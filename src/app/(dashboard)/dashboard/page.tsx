'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileText,
  CheckSquare,
  TrendingUp,
  CreditCard,
  Plus,
  Users,
  Eye,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from './dashboard.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DashboardData {
  metrics: {
    activeRfqs: number;
    pendingApprovals: number;
    totalSpend: number;
    pendingInvoices: number;
  };
  recentPOs: Array<{
    id: string;
    date: string;
    vendor: string;
    amount: number;
    status: string;
  }>;
  trend: Array<{
    month: string;
    spend: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';
  const userRole = session?.user?.role;
  const isStaff = userRole === 'ADMIN' || userRole === 'PROCUREMENT_OFFICER';

  // Fix Recharts hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, error, isLoading } = useSWR<DashboardData>('/api/dashboard', fetcher);

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorContainer}>
        Failed to load dashboard metrics. Ensure your database container is running.
      </div>
    );
  }

  const { metrics, recentPOs, trend } = data;

  const stats = [
    { label: 'Active RFQs', value: metrics.activeRfqs, icon: FileText, variant: 'info' as const, color: '#3b82f6' },
    { label: 'Pending Approvals', value: metrics.pendingApprovals, icon: CheckSquare, variant: 'warning' as const, color: '#f59e0b' },
    { label: 'Total Spend (YTD)', value: metrics.totalSpend, icon: TrendingUp, variant: 'success' as const, color: '#34d399', isCurrency: true },
    { label: 'Pending Invoices', value: metrics.pendingInvoices, icon: CreditCard, variant: 'danger' as const, color: '#ef4444' },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title={`Welcome back, ${userName}`}
        description="Today's Overview — Manage vendors, track RFQs, and approve quotations."
      />

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>{stat.label}</span>
                <div className={styles.statIconContainer} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <span className={styles.statValue}>
                {stat.isCurrency ? formatCurrency(stat.value, true) : stat.value}
              </span>
              <div className={styles.statFooter}>
                <Badge variant={stat.variant}>System Tracked</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Charts & Recent Work Section */}
      <div className={styles.mainGrid}>
        {/* Analytics Chart */}
        <Card title="Monthly Spend Trend" subtitle="Procurement spend statistics over the last 6 months" className={styles.chartCard}>
          <div className={styles.chartWrapper}>
            {isMounted && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3558" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={styles.customTooltip}>
                            <p className={styles.tooltipLabel}>{payload[0].payload.month}</p>
                            <p className={styles.tooltipVal}>
                              Spend: <strong>{formatCurrency(payload[0].value as number)}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="spend" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No data available for chart visualization</div>
            )}
          </div>
        </Card>

        {/* Quick Actions Panel */}
        <Card title="Quick Actions" subtitle="ERP operations shortcuts" className={styles.actionsCard}>
          <div className={styles.actionsGrid}>
            {isStaff ? (
              <>
                <Link href="/rfqs" className={styles.actionBtn}>
                  <div className={styles.actionIcon}><Plus size={20} /></div>
                  <div className={styles.actionText}>
                    <p className={styles.actionTitle}>Create new RFQ</p>
                    <p className={styles.actionDesc}>Submit pricing request to vendors</p>
                  </div>
                  <ArrowRight size={16} className={styles.actionArrow} />
                </Link>
                <Link href="/vendors" className={styles.actionBtn}>
                  <div className={styles.actionIcon}><Users size={20} /></div>
                  <div className={styles.actionText}>
                    <p className={styles.actionTitle}>Add Vendor</p>
                    <p className={styles.actionDesc}>Manage partner profiles</p>
                  </div>
                  <ArrowRight size={16} className={styles.actionArrow} />
                </Link>
              </>
            ) : null}
            <Link href="/invoices" className={styles.actionBtn}>
              <div className={styles.actionIcon}><CreditCard size={20} /></div>
              <div className={styles.actionText}>
                <p className={styles.actionTitle}>View Invoices</p>
                <p className={styles.actionDesc}>Check pending accounts payable</p>
              </div>
              <ArrowRight size={16} className={styles.actionArrow} />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Activity / PO Table */}
      <div className={styles.contentSection}>
        <Card
          title="Recent Purchase Orders"
          subtitle="Overview of the latest purchase orders generated"
          headerActions={
            <Link href="/purchase-orders" className={styles.viewAllLink}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          }
        >
          {recentPOs.length === 0 ? (
            <div className={styles.emptyTable}>No purchase orders registered in system.</div>
          ) : (
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
                {recentPOs.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className={styles.mono}>{order.id}</TableCell>
                    <TableCell>{formatDate(order.date, false)}</TableCell>
                    <TableCell>{order.vendor}</TableCell>
                    <TableCell>{formatCurrency(order.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'COMPLETED' || order.status === 'APPROVED' || order.status === 'ISSUED'
                            ? 'success'
                            : order.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
