import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract ID from URL
  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').pop() || '';

  try {
    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    return NextResponse.json(rfq);
  } catch (error: any) {
    console.error(`❌ GET /api/rfqs/${id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch RFQ details' },
      { status: 500 }
    );
  }
});
