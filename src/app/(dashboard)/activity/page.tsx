'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import {
  FileText,
  CheckSquare,
  CreditCard,
  Users,
  Clock,
  User,
  ShieldAlert,
  RotateCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import styles from './activity.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ActivityLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  details: string;
  category: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

const TABS = [
  { id: 'ALL', label: 'All Activities' },
  { id: 'RFQs', label: 'RFQs' },
  { id: 'Approvals', label: 'Approvals' },
  { id: 'Invoices', label: 'Invoices' },
  { id: 'Vendors', label: 'Vendors' },
];

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('ALL');

  const { data: logs = [], error, isLoading, mutate } = useSWR<ActivityLog[]>(
    `/api/activity?category=${activeTab}`,
    fetcher
  );

  // Helper to get Category Icons and Color Accents
  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'rfqs':
        return {
          icon: FileText,
          color: '#3b82f6', // blue
          bg: 'rgba(59, 130, 246, 0.1)',
        };
      case 'approvals':
        return {
          icon: CheckSquare,
          color: '#34d399', // emerald
          bg: 'rgba(52, 211, 153, 0.1)',
        };
      case 'invoices':
      case 'purchaseorders':
        return {
          icon: CreditCard,
          color: '#f59e0b', // orange
          bg: 'rgba(245, 158, 11, 0.1)',
        };
      case 'vendors':
        return {
          icon: Users,
          color: '#a855f7', // purple
          bg: 'rgba(168, 85, 247, 0.1)',
        };
      default:
        return {
          icon: Clock,
          color: '#94a3b8', // slate
          bg: 'rgba(148, 163, 184, 0.1)',
        };
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topHeader}>
        <PageHeader
          title="Activity & Logs"
          description="Track all RFQ lifecycle actions, from creation to approval, in real-time for complete transparency."
        />
        <button className={styles.refreshBtn} onClick={() => mutate()} disabled={isLoading} title="Refresh activity stream">
          <RotateCw size={16} className={isLoading ? styles.spinning : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsContainer}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <Card className={styles.timelineCard}>
        {isLoading ? (
          <div className={styles.loaderContainer}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <ShieldAlert size={36} className={styles.errorIcon} />
            <p>Failed to load activity log audit trail.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Clock size={40} className={styles.emptyIcon} />
            <h4>No Activities Registered</h4>
            <p>Any system operations (RFQ, Vendor, Approvals, Invoices) will be logged here automatically.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {logs.map((log) => {
              const theme = getCategoryTheme(log.category);
              const Icon = theme.icon;
              return (
                <div key={log.id} className={styles.timelineItem}>
                  {/* Category icon and vertical connecting lines */}
                  <div className={styles.iconCol}>
                    <div className={styles.iconWrapper} style={{ backgroundColor: theme.bg, color: theme.color }}>
                      <Icon size={18} />
                    </div>
                    <div className={styles.verticalLine} />
                  </div>

                  {/* Log descriptions details */}
                  <div className={styles.contentCol}>
                    <div className={styles.logHeader}>
                      <span className={styles.logDetails}>{log.details}</span>
                      <Badge variant="info" className={styles.categoryBadge}>
                        {log.category}
                      </Badge>
                    </div>
                    <div className={styles.logFooter}>
                      <div className={styles.userTrigger}>
                        <User size={12} />
                        <span>
                          {log.user.firstName} {log.user.lastName} ({log.user.role.replace('_', ' ')})
                        </span>
                      </div>
                      <span className={styles.timestamp}>{formatDate(log.createdAt, true)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
