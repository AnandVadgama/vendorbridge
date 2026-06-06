import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Topbar } from '@/components/layout/Topbar/Topbar';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      {/* Sidebar - Fixed Left */}
      <Sidebar />

      {/* Main Content Area - Flex Right */}
      <div className={styles.mainArea}>
        {/* Topbar - Fixed Top */}
        <Topbar />

        {/* Scrollable Page Body */}
        <main className={styles.contentBody}>
          <div className={styles.pageContainer}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
