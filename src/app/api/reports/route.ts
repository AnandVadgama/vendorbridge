import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, PoStatus, InvoiceStatus, VendorStatus } from '@prisma/client';

/**
 * GET /api/reports
 * Fetches analytical procurement reports data.
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
    // 1. Total Spend YTD
    const spendSum = await prisma.purchaseOrder.aggregate({
      _sum: { grandTotal: true },
      where: {
        status: { in: [PoStatus.ISSUED, PoStatus.RECEIVED, PoStatus.COMPLETED] },
      },
    });
    const totalSpend = spendSum._sum.grandTotal || 0;

    // 2. Active Vendors
    const activeVendors = await prisma.vendor.count({
      where: { status: VendorStatus.ACTIVE },
    });

    // 3. PO Fulfillment Rate (Completed POs / Total POs)
    const totalPosCount = await prisma.purchaseOrder.count();
    const completedPosCount = await prisma.purchaseOrder.count({
      where: { status: PoStatus.COMPLETED },
    });
    const poFulfillmentRate = totalPosCount > 0 
      ? Math.round((completedPosCount / totalPosCount) * 100) 
      : 100; // Default if no POs exist

    // 4. Pending Invoices
    const pendingInvoices = await prisma.invoice.count({
      where: { status: InvoiceStatus.PENDING_PAYMENT },
    });

    // 5. Spend by Category
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: [PoStatus.ISSUED, PoStatus.RECEIVED, PoStatus.COMPLETED] },
      },
      include: {
        quotation: {
          select: {
            rfq: {
              select: { category: true },
            },
          },
        },
      },
    });

    const categorySpendMap: Record<string, number> = {
      'IT Hardware': 0,
      'Furniture': 0,
      'Stationery': 0,
      'Logistics': 0,
    };

    pos.forEach((po) => {
      const category = po.quotation.rfq.category || 'Other';
      if (categorySpendMap[category] !== undefined) {
        categorySpendMap[category] += po.grandTotal;
      } else {
        categorySpendMap[category] = po.grandTotal;
      }
    });

    const spendByCategory = Object.keys(categorySpendMap).map((key) => ({
      category: key,
      spend: categorySpendMap[key],
    }));

    // 6. Top Vendors by Spend
    const vendorSpendGroups = await prisma.purchaseOrder.groupBy({
      by: ['vendorId'],
      _sum: { grandTotal: true },
      _count: { id: true },
      where: {
        status: { in: [PoStatus.ISSUED, PoStatus.RECEIVED, PoStatus.COMPLETED] },
      },
      orderBy: {
        _sum: { grandTotal: 'desc' },
      },
      take: 5,
    });

    const topVendors = await Promise.all(
      vendorSpendGroups.map(async (group) => {
        const vendor = await prisma.vendor.findUnique({
          where: { id: group.vendorId },
          select: { companyName: true },
        });
        return {
          vendorName: vendor?.companyName || 'Unknown Vendor',
          spend: group._sum.grandTotal || 0,
          posCount: group._count.id,
        };
      })
    );

    // 7. Monthly Spend Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const posForTrend = await prisma.purchaseOrder.findMany({
      where: {
        poDate: { gte: sixMonthsAgo },
        status: { in: [PoStatus.ISSUED, PoStatus.RECEIVED, PoStatus.COMPLETED] },
      },
      select: { grandTotal: true, poDate: true },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      trendMap[label] = 0;
    }

    posForTrend.forEach((po) => {
      const date = new Date(po.poDate);
      const label = `${months[date.getMonth()]} ${date.getFullYear().toString().substr(-2)}`;
      if (trendMap[label] !== undefined) {
        trendMap[label] += po.grandTotal;
      }
    });

    const monthlyTrend = Object.keys(trendMap).map((key) => ({
      month: key,
      spend: trendMap[key],
    }));

    return NextResponse.json({
      stats: {
        totalSpend,
        activeVendors,
        poFulfillmentRate,
        pendingInvoices,
      },
      spendByCategory,
      topVendors,
      monthlyTrend,
    });
  } catch (error: any) {
    console.error('❌ GET /api/reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytical reports' },
      { status: 500 }
    );
  }
});
