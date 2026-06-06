import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/activity
 * Retrieves activity logs, with category and user-scoped filtering.
 * Allowed roles: ADMIN, PROCUREMENT_OFFICER, MANAGER (full access), VENDOR (own logs only)
 */
export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = req.auth.user;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'ALL'; // e.g. RFQs, Approvals, Invoices, Vendors, ALL

  try {
    const where: any = {};

    // 1. Role-based scoping: Vendor can only see their own logs
    if (role === Role.VENDOR) {
      where.userId = userId;
    }

    // 2. Category filtering
    if (category !== 'ALL') {
      where.category = {
        equals: category,
        mode: 'insensitive', // Handle 'RFQs' vs 'rfqs'
      };
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('❌ GET /api/activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
});
