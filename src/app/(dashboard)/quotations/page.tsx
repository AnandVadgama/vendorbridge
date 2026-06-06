'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, FileSpreadsheet, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './quotations.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
  return res.json();
});

interface Quotation {
  id: string;
  quotationNumber: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  grandTotal: number;
  deliveryDays: number;
  submittedAt: string | null;
  createdAt: string;
  vendor: { companyName: string };
  rfq: { rfqNumber: string; title: string; category: string };
  _count: { items: number };
}

const STATUS_TABS = ['ALL', 'DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED'] as const;

const statusVariant = (s: string) => {
  if (s === 'ACCEPTED') return 'success';
  if (s === 'SUBMITTED') return 'info';
  if (s === 'REJECTED') return 'danger';
  return 'warning';
};

export default function QuotationsPage() {
  const { data: session } = useSession();
  const isVendor = session?.user?.role === 'VENDOR';
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('ALL');

  const { data: quotations = [], error, isLoading } = useSWR<Quotation[]>(
    `/api/quotations?status=${activeTab}`,
    fetcher
  );

  return (
    <div className={styles.container}>
      <PageHeader
        title="Quotations"
        description="Track all submitted vendor proposals and their approval status."
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
            <p>Failed to load quotations.</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className={styles.stateContainer}>
            <FileSpreadsheet size={40} className={styles.emptyIcon} />
            <p>No quotations found for this status.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>Quote #</TableCell>
                <TableCell isHeader>RFQ</TableCell>
                {!isVendor && <TableCell isHeader>Vendor</TableCell>}
                <TableCell isHeader>Grand Total</TableCell>
                <TableCell isHeader>Delivery</TableCell>
                <TableCell isHeader>Submitted</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader align="right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className={styles.mono}>{q.quotationNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className={styles.rfqNum}>{q.rfq.rfqNumber}</p>
                      <p className={styles.rfqTitle}>{q.rfq.title}</p>
                    </div>
                  </TableCell>
                  {!isVendor && <TableCell>{q.vendor.companyName}</TableCell>}
                  <TableCell className={styles.amount}>{formatCurrency(q.grandTotal)}</TableCell>
                  <TableCell>{q.deliveryDays} days</TableCell>
                  <TableCell>
                    {q.submittedAt ? formatDate(q.submittedAt, false) : <span className={styles.na}>—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    {(q.status === 'SUBMITTED' || q.status === 'ACCEPTED') && !isVendor ? (
                      <Link href={`/rfqs/${q.rfq.rfqNumber}/compare`} className={styles.actionLink}>
                        Compare <ChevronRight size={14} />
                      </Link>
                    ) : (
                      <span className={styles.na}>—</span>
                    )}
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
