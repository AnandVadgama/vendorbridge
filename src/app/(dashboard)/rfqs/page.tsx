'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useSession } from '@/lib/useSession';
import { Plus, Search, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { formatDate } from '@/lib/utils';
import styles from './rfqs.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
  return res.json();
});

interface Rfq {
  id: string;
  rfqNumber: string;
  title: string;
  category: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  deadline: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string };
  _count: { quotations: number; items: number };
}

const STATUS_TABS = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'] as const;

const statusVariant = (s: string) => {
  if (s === 'OPEN') return 'success';
  if (s === 'DRAFT') return 'warning';
  if (s === 'CLOSED') return 'info';
  if (s === 'CANCELLED') return 'danger';
  return 'neutral';
};

export default function RfqsPage() {
  const { data: session } = useSession();
  const isStaff =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'PROCUREMENT_OFFICER';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]>('ALL');

  const { data: rfqs = [], error, isLoading } = useSWR<Rfq[]>(
    `/api/rfqs/list?search=${encodeURIComponent(search)}&status=${activeTab}`,
    fetcher
  );

  return (
    <div className={styles.container}>
      <PageHeader
        title="RFQ Management"
        description="Create and manage Requests for Quotation sent to vendors."
        actions={
          isStaff ? (
            <Link href="/rfqs/new">
              <Button variant="primary">
                <Plus size={18} /> New RFQ
              </Button>
            </Link>
          ) : null
        }
      />

      <Card className={styles.tableCard}>
        <div className={styles.controlsRow}>
          <div className={styles.tabs}>
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
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by number, title, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.stateContainer}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className={styles.stateContainer}>
            <AlertCircle size={36} className={styles.errorIcon} />
            <p>Failed to load RFQs.</p>
          </div>
        ) : rfqs.length === 0 ? (
          <div className={styles.stateContainer}>
            <FileText size={40} className={styles.emptyIcon} />
            <p>No RFQs found. {isStaff && 'Create your first RFQ above.'}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>RFQ Number</TableCell>
                <TableCell isHeader>Title</TableCell>
                <TableCell isHeader>Category</TableCell>
                <TableCell isHeader>Deadline</TableCell>
                <TableCell isHeader>Quotations</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader align="right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.map((rfq) => (
                <TableRow key={rfq.id}>
                  <TableCell className={styles.mono}>{rfq.rfqNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className={styles.titleMain}>{rfq.title}</p>
                      <p className={styles.titleSub}>
                        {rfq.createdBy.firstName} {rfq.createdBy.lastName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{rfq.category}</TableCell>
                  <TableCell>{formatDate(rfq.deadline, false)}</TableCell>
                  <TableCell>
                    <span className={styles.countBadge}>{rfq._count.quotations} quotes</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(rfq.status)}>{rfq.status}</Badge>
                  </TableCell>
                  <TableCell align="right">
                    {rfq.status === 'OPEN' && rfq._count.quotations > 0 && isStaff ? (
                      <Link href={`/rfqs/${rfq.id}/compare`} className={styles.actionLink}>
                        Compare <ChevronRight size={14} />
                      </Link>
                    ) : (
                      <span className={styles.noAction}>—</span>
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
