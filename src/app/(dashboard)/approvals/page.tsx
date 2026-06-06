'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { CheckSquare, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './approvals.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
  return res.json();
});

interface Approval {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  currentStep: number;
  totalSteps: number;
  decidedAt: string | null;
  createdAt: string;
  requestedBy: { firstName: string; lastName: string };
  quotation: {
    quotationNumber: string;
    grandTotal: number;
    vendor: { companyName: string };
    rfq: { rfqNumber: string; title: string };
  };
}

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

const statusVariant = (s: string) => {
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  return 'warning';
};

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('ALL');

  const { data: allApprovals = [], error, isLoading } = useSWR<Approval[]>(
    '/api/approvals',
    fetcher
  );

  const approvals =
    activeTab === 'ALL' ? allApprovals : allApprovals.filter((a) => a.status === activeTab);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Approval Workflows"
        description="Review and process quotation approval requests across all procurement steps."
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
              {tab === 'PENDING' && allApprovals.filter((a) => a.status === 'PENDING').length > 0 && (
                <span className={styles.pendingDot} />
              )}
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
                ? 'Access Denied: You do not have permission to view approvals.'
                : 'Failed to load approval workflows.'}
            </p>
          </div>
        ) : approvals.length === 0 ? (
          <div className={styles.stateContainer}>
            <CheckSquare size={40} className={styles.emptyIcon} />
            <p>No approval workflows found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>Quotation</TableCell>
                <TableCell isHeader>RFQ</TableCell>
                <TableCell isHeader>Vendor</TableCell>
                <TableCell isHeader>Amount</TableCell>
                <TableCell isHeader>Step</TableCell>
                <TableCell isHeader>Requested By</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader align="right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell className={styles.mono}>{approval.quotation.quotationNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className={styles.rfqNum}>{approval.quotation.rfq.rfqNumber}</p>
                      <p className={styles.rfqTitle}>{approval.quotation.rfq.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>{approval.quotation.vendor.companyName}</TableCell>
                  <TableCell className={styles.amount}>{formatCurrency(approval.quotation.grandTotal)}</TableCell>
                  <TableCell>
                    <span className={styles.stepBadge}>
                      {approval.currentStep}/{approval.totalSteps}
                    </span>
                  </TableCell>
                  <TableCell>
                    {approval.requestedBy.firstName} {approval.requestedBy.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(approval.status)}>{approval.status}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Link href={`/approvals/${approval.id}`} className={styles.actionLink}>
                      Review <ChevronRight size={14} />
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
