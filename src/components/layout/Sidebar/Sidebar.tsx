'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  ShoppingBag,
  CreditCard,
  History,
  BarChart3,
  LogOut,
  FolderOpen
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vendors', href: '/vendors', icon: Users },
  { label: "RFQ's", href: '/rfqs', icon: FileText },
  { label: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
  { label: 'Approvals', href: '/approvals', icon: CheckSquare },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingBag },
  { label: 'Invoices', href: '/invoices', icon: CreditCard },
  { label: 'Activity Logs', href: '/activity', icon: History },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo Area */}
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <FolderOpen size={20} className={styles.emerald} />
        </div>
        <span className={styles.logoText}>
          Vendor<span className={styles.accentText}>Bridge</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            // Handle matching nested routes e.g. /vendors/new matches /vendors
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));

            return (
              <li key={link.href} className={styles.navItem}>
                <Link
                  href={link.href}
                  className={cn(styles.navLink, isActive && styles.active)}
                >
                  <Icon size={18} className={styles.linkIcon} />
                  <span>{link.label}</span>
                  {isActive && <div className={styles.activeIndicator} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className={styles.footer}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={18} className={styles.linkIcon} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
