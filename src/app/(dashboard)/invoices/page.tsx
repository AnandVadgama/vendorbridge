'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { CreditCard, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './invoices.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
  return res.json();
});

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'PENDING_PAYMENT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  grandTotal: number;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  vendor: { companyName: string };
  purchaseOrder: { poNumber: string };
}

const STATUS_TABS = ['ALL', 'PENDING_PAYMENT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'PENDING',
  ALL: 'ALL',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
};

const statusVariant = (s: string) => {
  if (s === 'PAID') return 'success';
  if (s === 'OVERDUE' || s === 'CANCELLED') return 'danger';
  if (s === 'SENT') return 'info';
  return 'warning'; // PENDING_PAYMENT
};

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('ALL');

  const { data: invoices = [], error, isLoading } = useSWR<Invoice[]>(
    `/api/invoices?status=${activeTab}`,
    fetcher
  );

  const pendingCount = invoices.filter((i) => i.status === 'PENDING_PAYMENT').length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Invoices"
        description="Track all vendor invoices and payment settlement statuses."
      />

      {pendingCount > 0 && (
        <div className={styles.alertBanner}>
          <CreditCard size={16} />
          <span><strong>{pendingCount}</strong> invoice{pendingCount !== 1 ? 's' : ''} pending payment settlement</span>
        </div>
      )}

      <Card className={styles.tableCard}>
        <div className={styles.tabsRow}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={styles.tabButton}
              data-active={activeTab === tab}
            >
              {STATUS_LABELS[tab]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.stateContainer}><div className="spinner" /></div>
        ) : error ? (
          <div className={styles.stateContainer}>
            <AlertCircle size={36} className={styles.errorIcon} />
            <p>Failed to load invoices.</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className={styles.stateContainer}>
            <CreditCard size={40} className={styles.emptyIcon} />
            <p>No invoices found. Invoices are generated from approved purchase orders.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>Invoice #</TableCell>
                <TableCell isHeader>PO Number</TableCell>
                <TableCell isHeader>Vendor</TableCell>
                <TableCell isHeader>Grand Total</TableCell>
                <TableCell isHeader>Due Date</TableCell>
                <TableCell isHeader>Paid Date</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader align="right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className={styles.mono}>{inv.invoiceNumber}</TableCell>
                  <TableCell className={styles.poNum}>{inv.purchaseOrder.poNumber}</TableCell>
                  <TableCell>{inv.vendor.companyName}</TableCell>
                  <TableCell className={styles.amount}>{formatCurrency(inv.grandTotal)}</TableCell>
                  <TableCell>{formatDate(inv.dueDate, false)}</TableCell>
                  <TableCell>
                    {inv.paidAt ? (
                      <span className={styles.paidDate}>{formatDate(inv.paidAt, false)}</span>
                    ) : (
                      <span className={styles.na}>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status)}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Link href={`/purchase-orders/${inv.purchaseOrder.poNumber}`} className={styles.actionLink}>
                      View PO <ChevronRight size={14} />
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
