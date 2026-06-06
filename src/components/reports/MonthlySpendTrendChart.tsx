'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from '@/app/(dashboard)/reports/reports.module.css';
import { formatCurrency } from '@/lib/utils';

interface MonthlySpendTrendChartProps {
  monthlyTrend: Array<{
    month: string;
    spend: number;
  }>;
}

export default function MonthlySpendTrendChart({ monthlyTrend }: MonthlySpendTrendChartProps) {
  if (!monthlyTrend || monthlyTrend.length === 0) {
    return <div className={styles.noData}>No spend trend data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={monthlyTrend} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
        <YAxis
          stroke="var(--text-secondary)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => `₹${val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val}`}
        />
        <Tooltip
          cursor={{ fill: 'var(--bg-table-row)' }}
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
        <Bar dataKey="spend" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  );
}
