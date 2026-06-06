import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RfqStatus } from '@prisma/client';

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
    const { title, category, deadline, description, items, vendors, status } = body;

    if (!title || !category || !deadline) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }

    // Generate a unique RFQ number e.g. RFQ-2026-0001
    const count = await prisma.rfq.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${sequence}`;

    const rfq = await prisma.$transaction(async (tx) => {
      // 1. Create RFQ Header
      const newRfq = await tx.rfq.create({
        data: {
          rfqNumber,
          title,
          description: description || null,
          category,
          deadline: new Date(deadline),
          status: status || RfqStatus.DRAFT,
          createdById: userId,
        },
      });

      // 2. Create Items
      if (items && items.length > 0) {
        await tx.rfqItem.createMany({
          data: items.map((item: any) => ({
            rfqId: newRfq.id,
            productName: item.productName,
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit || 'Units',
          })),
        });
      }

      // 3. Invite Vendors
      if (vendors && vendors.length > 0) {
        await tx.rfqVendor.createMany({
          data: vendors.map((vendorId: string) => ({
            rfqId: newRfq.id,
            vendorId,
            invited: true,
            invitedAt: new Date(),
          })),
        });
      }

      return newRfq;
    });

    // Write audit activity logs
    await prisma.activityLog.create({
      data: {
        userId,
        entityType: 'RFQ',
        entityId: rfq.id,
        action: 'CREATED',
        details: `RFQ ${rfqNumber} (${title}) created in status ${rfq.status}`,
        category: 'RFQs',
      },
    });

    return NextResponse.json(rfq, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/rfqs error:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while creating the RFQ' },
      { status: 500 }
    );
  }
});
