import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, PoStatus } from '@prisma/client';

/**
 * GET /api/purchase-orders/[id]
 * Retrieves details for a specific Purchase Order, including its vendor, quotation items, and invoices.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER, MANAGER, VENDOR (if it's their own PO)
 */
export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  const resolvedParams = await (params as any);
  const poId = resolvedParams.id;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendor: true,
        invoices: true,
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
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    // Role check: Vendor can only see their own PO
    if (role === Role.VENDOR && po.vendor.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(po);
  } catch (error: any) {
    console.error(`❌ GET /api/purchase-orders/${poId} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch Purchase Order details' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/purchase-orders/[id]
 * Updates status of a Purchase Order.
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
  const poId = resolvedParams.id;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(PoStatus).includes(status as PoStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const updatedPo = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: status as PoStatus },
      include: { vendor: true },
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId,
        entityType: 'PURCHASE_ORDER',
        entityId: poId,
        action: 'STATUS_UPDATED',
        details: `Purchase Order ${updatedPo.poNumber} status updated to ${status}.`,
        category: 'PurchaseOrders',
      },
    });

    return NextResponse.json(updatedPo);
  } catch (error: any) {
    console.error(`❌ PUT /api/purchase-orders/${poId} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update Purchase Order' },
      { status: 500 }
    );
  }
});
