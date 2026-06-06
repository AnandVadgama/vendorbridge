import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/invoices
 * Lists all invoices with vendor and PO info.
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

    // Vendors can only see their own invoices
    if (role === Role.VENDOR) {
      const vendor = await prisma.vendor.findFirst({ where: { userId } });
      if (!vendor) {
        return NextResponse.json([], { status: 200 });
      }
      where.vendorId = vendor.id;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: { companyName: true },
        },
        purchaseOrder: {
          select: { poNumber: true },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('❌ GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
});
