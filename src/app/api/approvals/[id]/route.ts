import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, ApprovalStatus, PoStatus, QuotationStatus, RfqStatus } from '@prisma/client';

/**
 * GET /api/approvals/[id]
 * Retrieves a single approval workflow's status and details.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER, MANAGER
 */
export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER && role !== Role.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Await params for Next.js 15/16 compatibility
  const resolvedParams = await (params as any);
  const approvalId = resolvedParams.id;

  try {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quotation: {
          include: {
            vendor: true,
            rfq: {
              include: {
                items: true,
              },
            },
            items: {
              include: {
                rfqItem: true,
              },
            },
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval workflow not found' }, { status: 404 });
    }

    return NextResponse.json(approval);
  } catch (error: any) {
    console.error(`❌ GET /api/approvals/${approvalId} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch approval details' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/approvals/[id]
 * Processes approval decisions (APPROVE or REJECT).
 * Allowed roles: ADMIN, MANAGER
 */
export const PUT = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, name } = req.auth.user;
  // Managers or Admins can approve
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    return NextResponse.json({ error: 'Forbidden: Only managers can approve/reject quotations' }, { status: 403 });
  }

  const resolvedParams = await (params as any);
  const approvalId = resolvedParams.id;

  try {
    const body = await req.json();
    const { action, remarks } = body; // action: 'APPROVE' or 'REJECT'

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        quotation: {
          include: {
            vendor: true,
            rfq: true,
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval workflow not found' }, { status: 404 });
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return NextResponse.json({ error: 'Approval workflow is already finalized' }, { status: 400 });
    }

    const updatedApproval = await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        const nextStep = approval.currentStep + 1;
        const isFullyApproved = nextStep > approval.totalSteps;

        // Update Approval Record
        const updated = await tx.approval.update({
          where: { id: approvalId },
          data: {
            currentStep: Math.min(nextStep, approval.totalSteps),
            status: isFullyApproved ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
            approverId: userId,
            remarks: remarks || approval.remarks,
            decidedAt: isFullyApproved ? new Date() : null,
          },
        });

        // If it reaches the final level of approval, generate the PO!
        if (isFullyApproved) {
          // Count POs to create sequential number
          const poCount = await tx.purchaseOrder.count();
          const sequence = (poCount + 1).toString().padStart(4, '0');
          const poNumber = `PO-${new Date().getFullYear()}-${sequence}`;

          // Create PO
          const purchaseOrder = await tx.purchaseOrder.create({
            data: {
              poNumber,
              quotationId: approval.quotationId,
              vendorId: approval.quotation.vendorId,
              buyerName: 'VendorBridge Procurement Ltd',
              buyerAddress: '101 Tech Square, Sector 62, Noida, India',
              buyerGstin: '09AAACV1290K1ZX',
              subtotal: approval.quotation.subtotal,
              cgstRate: 9.0,
              cgstAmount: (approval.quotation.subtotal - approval.quotation.discount) * 0.09,
              sgstRate: 9.0,
              sgstAmount: (approval.quotation.subtotal - approval.quotation.discount) * 0.09,
              grandTotal: approval.quotation.grandTotal,
              status: PoStatus.ISSUED,
            },
          });

          // Log PO generation
          await tx.activityLog.create({
            data: {
              userId,
              entityType: 'PURCHASE_ORDER',
              entityId: purchaseOrder.id,
              action: 'GENERATED',
              details: `Purchase Order ${poNumber} auto-generated after final approval of quotation ${approval.quotation.quotationNumber}.`,
              category: 'PurchaseOrders',
            },
          });
        }

        // Write activity log
        await tx.activityLog.create({
          data: {
            userId,
            entityType: 'APPROVAL',
            entityId: approvalId,
            action: isFullyApproved ? 'APPROVED' : 'STEP_COMPLETED',
            details: `Approval step ${approval.currentStep} approved by ${name || 'Manager'}.${isFullyApproved ? ' Quotation fully accepted.' : ''}`,
            category: 'Approvals',
          },
        });

        return updated;
      } else {
        // action === 'REJECT'
        const updated = await tx.approval.update({
          where: { id: approvalId },
          data: {
            status: ApprovalStatus.REJECTED,
            approverId: userId,
            remarks: remarks || 'Rejected by approver',
            decidedAt: new Date(),
          },
        });

        // Set the quotation status back to REJECTED
        await tx.quotation.update({
          where: { id: approval.quotationId },
          data: {
            status: QuotationStatus.REJECTED,
          },
        });

        // Set the RFQ status back to OPEN so vendors can submit other proposals or it can be re-opened
        await tx.rfq.update({
          where: { id: approval.quotation.rfqId },
          data: {
            status: RfqStatus.OPEN,
          },
        });

        // Log rejection
        await tx.activityLog.create({
          data: {
            userId,
            entityType: 'APPROVAL',
            entityId: approvalId,
            action: 'REJECTED',
            details: `Approval workflow rejected by ${name || 'Manager'}. Remarks: ${remarks || 'None'}`,
            category: 'Approvals',
          },
        });

        return updated;
      }
    });

    return NextResponse.json(updatedApproval);
  } catch (error: any) {
    console.error(`❌ PUT /api/approvals/${approvalId} error:`, error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating the approval status' },
      { status: 500 }
    );
  }
});

