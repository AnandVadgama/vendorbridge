import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, InvoiceStatus } from '@prisma/client';

/**
 * POST /api/purchase-orders/[id]/invoice
 * Generates an Invoice for a specific Purchase Order.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER
 */
export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await (params as any);
  const poId = resolvedParams.id;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { invoices: true },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    if (po.invoices.length > 0) {
      return NextResponse.json(
        { error: 'An invoice has already been generated for this Purchase Order' },
        { status: 400 }
      );
    }

    // Generate Invoice number e.g. INV-2026-0001
    const count = await prisma.invoice.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${sequence}`;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice Record
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          purchaseOrderId: poId,
          vendorId: po.vendorId,
          subtotal: po.subtotal,
          cgst: po.cgstAmount,
          sgst: po.sgstAmount,
          grandTotal: po.grandTotal,
          status: InvoiceStatus.PENDING_PAYMENT,
          dueDate,
        },
      });

      // 2. Set PO invoiceDate and dueDate
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          invoiceDate: new Date(),
          dueDate,
        },
      });

      // 3. Log Activity
      await tx.activityLog.create({
        data: {
          userId,
          entityType: 'INVOICE',
          entityId: newInvoice.id,
          action: 'GENERATED',
          details: `Invoice ${invoiceNumber} generated for Purchase Order ${po.poNumber}.`,
          category: 'Invoices',
        },
      });

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error(`❌ POST /api/purchase-orders/${poId}/invoice error:`, error);
    return NextResponse.json(
      { error: 'Failed to generate invoice in database' },
      { status: 500 }
    );
  }
});
