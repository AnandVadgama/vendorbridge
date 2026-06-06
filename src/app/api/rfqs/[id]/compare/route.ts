import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

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
  const rfqId = resolvedParams.id;

  if (!rfqId) {
    return NextResponse.json({ error: 'RFQ ID is required' }, { status: 400 });
  }

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: {
        items: true,
      },
    });

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        rfqId,
        status: {
          in: ['SUBMITTED', 'ACCEPTED', 'REJECTED'],
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            rating: true,
          },
        },
        items: {
          include: {
            rfqItem: true,
          },
        },
      },
    });

    return NextResponse.json({ rfq, quotations });
  } catch (error: any) {
    console.error('❌ GET /api/rfqs/[id]/compare error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation comparison details' },
      { status: 500 }
    );
  }
});
