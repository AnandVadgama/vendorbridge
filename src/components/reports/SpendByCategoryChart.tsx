'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import styles from '@/app/(dashboard)/reports/reports.module.css';
import { formatCurrency } from '@/lib/utils';

interface SpendByCategoryChartProps {
  spendByCategory: Array<{
    category: string;
    spend: number;
  }>;
}

const COLORS = ['var(--accent-blue)', 'var(--accent-primary)', 'var(--accent-orange)', 'var(--accent-purple)', 'var(--accent-red)'];

export default function SpendByCategoryChart({ spendByCategory }: SpendByCategoryChartProps) {
  if (!spendByCategory || spendByCategory.length === 0) {
    return <div className={styles.noData}>No category spend recorded in database container.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={spendByCategory}
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
        <XAxis
          type="number"
          stroke="var(--text-secondary)"
          fontSize={12}
          tickLine={false}
          tickFormatter={(val) => `₹${val >= 100000 ? (val / 100000).toFixed(1) + 'L' : val}`}
        />
        <YAxis
          dataKey="category"
          type="category"
          stroke="var(--text-secondary)"
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--bg-table-row)' }}
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
  );
}
