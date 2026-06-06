'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ShoppingBag, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './purchase-orders.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
  return res.json();
});

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';
  grandTotal: number;
  poDate: string;
  vendor: { companyName: string };
  _count: { invoices: number };
}

const STATUS_TABS = ['ALL', 'DRAFT', 'ISSUED', 'RECEIVED', 'COMPLETED', 'CANCELLED'] as const;

const statusVariant = (s: string) => {
  if (s === 'COMPLETED' || s === 'ISSUED') return 'success';
  if (s === 'CANCELLED') return 'danger';
  if (s === 'RECEIVED') return 'info';
  return 'warning';
};

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('ALL');

  const { data: allPos = [], error, isLoading } = useSWR<PurchaseOrder[]>(
    `/api/purchase-orders?status=${activeTab}`,
    fetcher
  );

  return (
    <div className={styles.container}>
      <PageHeader
        title="Purchase Orders"
        description="View all auto-generated purchase orders from approved quotations."
      />

      <Card className={styles.tableCard}>
        <div className={styles.tabsRow}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={styles.tabButton}
              data-active={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.stateContainer}><div className="spinner" /></div>
        ) : error ? (
          <div className={styles.stateContainer}>
            <AlertCircle size={36} className={styles.errorIcon} />
            <p>
              {error.message === 'Forbidden'
                ? 'Access Denied: You do not have permission to view purchase orders.'
                : 'Failed to load purchase orders.'}
            </p>
          </div>
        ) : allPos.length === 0 ? (
          <div className={styles.stateContainer}>
            <ShoppingBag size={40} className={styles.emptyIcon} />
            <p>No purchase orders found. They are auto-generated upon final approval.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>PO Number</TableCell>
                <TableCell isHeader>Vendor</TableCell>
                <TableCell isHeader>Grand Total</TableCell>
                <TableCell isHeader>PO Date</TableCell>
                <TableCell isHeader>Invoices</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader align="right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPos.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className={styles.mono}>{po.poNumber}</TableCell>
                  <TableCell>{po.vendor.companyName}</TableCell>
                  <TableCell className={styles.amount}>{formatCurrency(po.grandTotal)}</TableCell>
                  <TableCell>{formatDate(po.poDate, false)}</TableCell>
                  <TableCell>
                    <span className={styles.invoiceCount}>{po._count.invoices} invoice{po._count.invoices !== 1 ? 's' : ''}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(po.status)}>{po.status}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Link href={`/purchase-orders/${po.id}`} className={styles.actionLink}>
                      Open <ChevronRight size={14} />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
