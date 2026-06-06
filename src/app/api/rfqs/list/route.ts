import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/rfqs/list
 * Lists all RFQs with status, creator, and quotation count.
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { rfqNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const rfqs = await prisma.rfq.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        _count: {
          select: { quotations: true, items: true },
        },
      },
    });

    return NextResponse.json(rfqs);
  } catch (error: any) {
    console.error('❌ GET /api/rfqs/list error:', error);
    return NextResponse.json({ error: 'Failed to fetch RFQs' }, { status: 500 });
  }
});
