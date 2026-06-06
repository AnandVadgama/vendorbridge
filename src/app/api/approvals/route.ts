import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, ApprovalStatus, QuotationStatus, RfqStatus } from '@prisma/client';

/**
 * POST /api/approvals
 * Initiates the approval workflow for a selected quotation.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER
 */
export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { quotationId, remarks } = body;

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        rfq: true,
        vendor: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Process approval instantiation transaction
    const approval = await prisma.$transaction(async (tx) => {
      // 1. Create Approval Workflow
      const newApproval = await tx.approval.create({
        data: {
          quotationId,
          requestedById: userId,
          status: ApprovalStatus.PENDING,
          currentStep: 1,
          totalSteps: 3,
          remarks: remarks || null,
        },
      });

      // 2. Set this quotation as ACCEPTED
      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.ACCEPTED,
        },
      });

      // 3. Reject other submitted quotations for the same RFQ
      await tx.quotation.updateMany({
        where: {
          rfqId: quotation.rfqId,
          id: { not: quotationId },
          status: QuotationStatus.SUBMITTED,
        },
        data: {
          status: QuotationStatus.REJECTED,
        },
      });

      // 4. Update RFQ status to CLOSED
      await tx.rfq.update({
        where: { id: quotation.rfqId },
        data: {
          status: RfqStatus.CLOSED,
        },
      });

      // 5. Create Activity Logs
      await tx.activityLog.create({
        data: {
          userId,
          entityType: 'APPROVAL',
          entityId: newApproval.id,
          action: 'INITIATED',
          details: `Approval workflow initiated for Quotation ${quotation.quotationNumber} (${quotation.vendor.companyName}) for amount ₹${quotation.grandTotal.toFixed(2)}`,
          category: 'Approvals',
        },
      });

      return newApproval;
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/approvals error:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while initiating approval' },
      { status: 500 }
    );
  }
});

/**
 * GET /api/approvals
 * Lists all approval workflows.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER, MANAGER
 */
export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER && role !== Role.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const approvals = await prisma.approval.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        quotation: {
          include: {
            vendor: {
              select: {
                companyName: true,
              },
            },
            rfq: {
              select: {
                rfqNumber: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(approvals);
  } catch (error: any) {
    console.error('❌ GET /api/approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval queue' },
      { status: 500 }
    );
  }
});
