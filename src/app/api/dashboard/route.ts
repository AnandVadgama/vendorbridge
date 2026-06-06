import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, RfqStatus, ApprovalStatus, PoStatus, InvoiceStatus } from '@prisma/client';

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER && role !== Role.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Active RFQs Count
    const activeRfqsCount = await prisma.rfq.count({
      where: {
        status: RfqStatus.OPEN,
      },
    });

    // 2. Pending Approvals Count
    const pendingApprovalsCount = await prisma.approval.count({
      where: {
        status: ApprovalStatus.PENDING,
      },
    });

    // 3. Total Spend (Sum of PO grand totals with status ISSUED, RECEIVED, or COMPLETED)
    const spendAggregation = await prisma.purchaseOrder.aggregate({
      _sum: {
        grandTotal: true,
      },
      where: {
        status: {
          in: [PoStatus.ISSUED, PoStatus.RECEIVED, PoStatus.COMPLETED],
        },
      },
    });
    const totalSpend = spendAggregation._sum.grandTotal || 0;

    // 4. Pending Invoices Count
    const pendingInvoicesCount = await prisma.invoice.count({
      where: {
        status: InvoiceStatus.PENDING_PAYMENT,
      },
    });

    // 5. Recent Purchase Orders (Take 5)
    const recentPurchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: {
        poDate: 'desc',
      },
      take: 5,
      include: {
        vendor: {
          select: {
            companyName: true,
          },
        },
      },
    });

    // 6. Trend Data (Spend by month for the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Set to start of month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const posForTrend = await prisma.purchaseOrder.findMany({
      where: {
        poDate: {
          gte: sixMonthsAgo,
        },
        status: {
          in: [PoStatus.ISSUED, PoStatus.RECEIVED, PoStatus.COMPLETED],
        },
      },
      select: {
        grandTotal: true,
        poDate: true,
      },
    });

    // Process last 6 months labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      trendMap[label] = 0;
    }

    // Populate spend values
    posForTrend.forEach((po) => {
      const date = new Date(po.poDate);
      const label = `${months[date.getMonth()]} ${date.getFullYear().toString().substr(-2)}`;
      if (trendMap[label] !== undefined) {
        trendMap[label] += po.grandTotal;
      }
    });

    const trendData = Object.keys(trendMap).map((key) => ({
      month: key,
      spend: trendMap[key],
    }));

    return NextResponse.json({
      metrics: {
        activeRfqs: activeRfqsCount,
        pendingApprovals: pendingApprovalsCount,
        totalSpend,
        pendingInvoices: pendingInvoicesCount,
      },
      recentPOs: recentPurchaseOrders.map((po) => ({
        id: po.poNumber,
        date: po.poDate,
        vendor: po.vendor.companyName,
        amount: po.grandTotal,
        status: po.status,
      })),
      trend: trendData,
    });
  } catch (error: any) {
    console.error('❌ GET /api/dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
});
