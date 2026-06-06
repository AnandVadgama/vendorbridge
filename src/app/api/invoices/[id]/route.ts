import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, InvoiceStatus } from '@prisma/client';

/**
 * GET /api/invoices/[id]
 * Retrieves details for a specific Invoice.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER, MANAGER, VENDOR (if it's their own invoice)
 */
export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  const resolvedParams = await (params as any);
  const invoiceId = resolvedParams.id;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        vendor: true,
        purchaseOrder: {
          include: {
            quotation: {
              include: {
                items: {
                  include: {
                    rfqItem: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Role check: Vendor can only see their own invoice
    if (role === Role.VENDOR && invoice.vendor.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error(`❌ GET /api/invoices/${invoiceId} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice details' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/invoices/[id]
 * Updates status of an Invoice (e.g. marking as paid).
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER
 */
export const PUT = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await (params as any);
  const invoiceId = resolvedParams.id;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const data: any = { status: status as InvoiceStatus };
    if (status === InvoiceStatus.PAID) {
      data.paidAt = new Date();
    } else if (status === InvoiceStatus.SENT) {
      data.sentAt = new Date();
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: { vendor: true },
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId,
        entityType: 'INVOICE',
        entityId: invoiceId,
        action: 'STATUS_UPDATED',
        details: `Invoice ${updatedInvoice.invoiceNumber} status updated to ${status}.`,
        category: 'Invoices',
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error(`❌ PUT /api/invoices/${invoiceId} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
});

