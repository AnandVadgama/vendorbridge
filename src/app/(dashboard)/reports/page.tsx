'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  CheckCircle,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from './reports.module.css';

const SpendByCategoryChart = dynamic(() => import('@/components/reports/SpendByCategoryChart'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
      <div className="spinner" />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading category spend...</span>
    </div>
  ),
});

const MonthlySpendTrendChart = dynamic(() => import('@/components/reports/MonthlySpendTrendChart'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
      <div className="spinner" />
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading spend trends...</span>
    </div>
  ),
});

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load reports');
  }
  return res.json();
});

interface ReportsData {
  stats: {
    totalSpend: number;
    activeVendors: number;
    poFulfillmentRate: number;
    pendingInvoices: number;
  };
  spendByCategory: Array<{
    category: string;
    spend: number;
  }>;
  topVendors: Array<{
    vendorName: string;
    spend: number;
    posCount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    spend: number;
  }>;
}

export default function ReportsPage() {
  const [filterPeriod, setFilterPeriod] = useState('YTD');

  const { data, error, isLoading } = useSWR<ReportsData>('/api/reports', fetcher);

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
        <AlertCircle size={48} className={styles.errorIcon} />
        <p>
          {error?.message === 'Forbidden'
            ? 'Access Denied: You do not have permission to view analytical reports.'
            : 'Failed to load analytical reports. Ensure database seeding is complete.'}
        </p>
      </div>
    );
  }

  const { stats, spendByCategory, topVendors, monthlyTrend } = data;

  const cards = [
    { label: 'Total Spend (YTD)', value: stats.totalSpend, icon: TrendingUp, color: '#34d399', isCurrency: true },
    { label: 'Active Vendors', value: stats.activeVendors, icon: Users, color: '#3b82f6' },
    { label: 'PO Fulfillment Rate', value: `${stats.poFulfillmentRate}%`, icon: CheckCircle, color: '#f59e0b' },
    { label: 'Pending Invoices', value: stats.pendingInvoices, icon: FileText, color: '#ef4444' },
  ];

  // CSV Mock Export handler
  const handleExportCSV = () => {
    const csvContent = [
      ['Vendor Name', 'Total Spend (₹)', 'Purchase Orders Count'],
      ...topVendors.map((v) => [v.vendorName, v.spend.toFixed(2), v.posCount])
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vendorbridge_procurement_report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topHeader}>
        <PageHeader
          title="Reports & Analytics"
          description="Procurement insights, spend breakdown, and supplier performance tracking."
        />
        <div className={styles.filterActions}>
          <select
            className={styles.select}
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="YTD">Year To Date (YTD)</option>
            <option value="6M">Last 6 Months</option>
            <option value="ALL">All Time</option>
          </select>
          <Button variant="secondary" onClick={handleExportCSV} title="Export Report data to CSV">
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards Overview Row */}
      <div className={styles.statsGrid}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>{card.label}</span>
                <div className={styles.statIconContainer} style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <span className={styles.statValue}>
                {card.isCurrency ? formatCurrency(card.value as number, true) : card.value}
              </span>
            </Card>
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        {/* Spend by Category Horizontal Bar Chart */}
        <Card title="Spend by Category" subtitle="Distribution of spend across material groupings" className={styles.card}>
          <div className={styles.chartWrapper}>
            <SpendByCategoryChart spendByCategory={spendByCategory} />
          </div>
        </Card>

        {/* Top Vendors by Spend Table */}
        <Card title="Top Vendors by Spend" subtitle="Top performing suppliers sorted by volume" className={styles.card}>
          {topVendors.length === 0 ? (
            <div className={styles.emptyTable}>No vendor invoices found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow isHeader>
                  <TableCell isHeader>Vendor</TableCell>
                  <TableCell isHeader>Spend</TableCell>
                  <TableCell isHeader>POs Count</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVendors.map((vendor, idx) => (
                  <TableRow key={idx}>
                    <TableCell className={styles.boldCell}>{vendor.vendorName}</TableCell>
                    <TableCell>{formatCurrency(vendor.spend)}</TableCell>
                    <TableCell>{vendor.posCount} POs</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Monthly Trend Spend Chart */}
      <div className={styles.fullWidthSection}>
        <Card title="Monthly Spend Trend" subtitle="Procurement volume tracking for last 6 months" className={styles.card}>
          <div className={styles.trendChartWrapper}>
            <MonthlySpendTrendChart monthlyTrend={monthlyTrend} />
          </div>
        </Card>
      </div>
    </div>
  );
}
