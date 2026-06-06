import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, QuotationStatus } from '@prisma/client';

export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  
  // Find associated vendor account
  const vendor = await prisma.vendor.findFirst({
    where: { userId },
  });

  if (!vendor || role !== Role.VENDOR) {
    return NextResponse.json({ error: 'Only registered vendors can submit quotations' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      rfqId,
      subtotal,
      taxPercent,
      taxAmount,
      discount,
      grandTotal,
      paymentTerms,
      warranty,
      status,
      items,
    } = body;

    if (!rfqId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing quotation details' }, { status: 400 });
    }

    // Generate quotation number e.g. QUOT-2026-0001
    const count = await prisma.quotation.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    const quotationNumber = `QUOT-${new Date().getFullYear()}-${sequence}`;

    const quotation = await prisma.$transaction(async (tx) => {
      // 1. Create Quotation Header
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber,
          rfqId,
          vendorId: vendor.id,
          subtotal,
          taxPercent,
          taxAmount,
          discount,
          grandTotal,
          deliveryDays: Math.max(...items.map((i: any) => i.deliveryDays || 0)),
          paymentTerms: paymentTerms || '',
          warranty: warranty || '',
          status: status || QuotationStatus.DRAFT,
          submittedAt: status === QuotationStatus.SUBMITTED ? new Date() : null,
        },
      });

      // 2. Create Quotation Items
      await tx.quotationItem.createMany({
        data: items.map((item: any) => ({
          quotationId: newQuotation.id,
          rfqItemId: item.rfqItemId,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          deliveryDays: item.deliveryDays,
        })),
      });

      return newQuotation;
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId,
        entityType: 'QUOTATION',
        entityId: quotation.id,
        action: 'SUBMITTED',
        details: `Quotation ${quotationNumber} submitted for RFQ in status ${quotation.status}`,
        category: 'Quotations',
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/quotations error:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while submitting the quotation' },
      { status: 500 }
    );
  }
});
