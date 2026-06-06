import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/purchase-orders
 * Lists all purchase orders with vendor info.
 * Allowed: ADMIN, PROCUREMENT_OFFICER, MANAGER (all); VENDOR (own only)
 */
export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    // Vendors can only see their own POs
    if (role === Role.VENDOR) {
      const vendor = await prisma.vendor.findFirst({ where: { userId } });
      if (!vendor) {
        return NextResponse.json([], { status: 200 });
      }
      where.vendorId = vendor.id;
    }

    const pos = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { poDate: 'desc' },
      include: {
        vendor: {
          select: { companyName: true },
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    return NextResponse.json(pos);
  } catch (error: any) {
    console.error('❌ GET /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
});
