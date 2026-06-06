'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  const stats = [
    { label: 'Active RFQs', value: 12, variant: 'info' as const },
    { label: 'Pending Approvals', value: 5, variant: 'warning' as const },
    { label: 'Total Spend (YTD)', value: 230000, isCurrency: true, variant: 'success' as const },
    { label: 'Vendor Invoices', value: 3, variant: 'purple' as const },
  ];

  const recentOrders = [
    { id: 'PO-2025-014', date: '2026-06-05T10:00:00Z', vendor: 'Infra Supplies Pvt Ltd', amount: 185400, status: 'APPROVED' },
    { id: 'PO-2025-013', date: '2026-06-04T15:30:00Z', vendor: 'TechCore Ltd', amount: 48000, status: 'PENDING' },
    { id: 'PO-2025-012', date: '2026-06-03T11:15:00Z', vendor: 'FastLog Services', amount: 12000, status: 'APPROVED' },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title={`Welcome back, ${userName}`}
        description="Today's Overview — Manage vendors, track RFQs, and approve quotations."
      />

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Card key={i} className={styles.statCard}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>
              {stat.isCurrency ? formatCurrency(stat.value, true) : stat.value}
            </span>
            <div className={styles.indicatorContainer}>
              <Badge variant={stat.variant}>Active</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div className={styles.contentSection}>
        <Card title="Recent Purchase Orders" subtitle="Latest procurement purchase order statuses">
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>PO Number</TableCell>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Vendor</TableCell>
                <TableCell isHeader>Amount</TableCell>
                <TableCell isHeader>Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className={styles.mono}>{order.id}</TableCell>
                  <TableCell>{formatDate(order.date, false)}</TableCell>
                  <TableCell>{order.vendor}</TableCell>
                  <TableCell>{formatCurrency(order.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'APPROVED' ? 'success' : 'warning'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
