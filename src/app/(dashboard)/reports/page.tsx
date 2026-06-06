'use client';

import React, { useState, useEffect } from 'react';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import styles from './reports.module.css';

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

const COLORS = ['#3b82f6', '#34d399', '#f59e0b', '#a855f7', '#14b8a6'];

export default function ReportsPage() {
  const [filterPeriod, setFilterPeriod] = useState('YTD');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
            {isMounted && spendByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={spendByCategory}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3558" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val}`}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={styles.customTooltip}>
                            <p className={styles.tooltipLabel}>{payload[0].payload.category}</p>
                            <p className={styles.tooltipVal}>
                              Spend: <strong>{formatCurrency(payload[0].value as number)}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="spend" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    {spendByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No category spend recorded in database container.</div>
            )}
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
            {isMounted && monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
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
                              Total: <strong>{formatCurrency(payload[0].value as number)}</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>No spend trend data available.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
