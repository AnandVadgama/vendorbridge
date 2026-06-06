'use client';

import React, { useState } from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useSession } from '@/lib/useSession';
import { useTheme } from '@/components/ThemeProvider';
import styles from './Topbar.module.css';

export const Topbar: React.FC = () => {
  const { data: session } = useSession();
  const me = session?.user;
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleRoleChange = async (newRole: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Error changing role:', e);
    }
  };

  // Dummy notification count
  const unreadNotifications = 3;

  return (
    <header className={styles.topbar}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search RFQs, vendors, orders..."
          className={styles.searchInput}
        />
      </div>

      {/* Action Items */}
      <div className={styles.actions}>
        {/* Theme Toggle */}
        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification Bell */}
        <div className={styles.iconButtonContainer}>
          <button
            className={styles.iconButton}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadNotifications > 0 ? (
              <span className={styles.badge}>{unreadNotifications}</span>
            ) : null}
          </button>
          
          {showNotifications ? (
            <div className={styles.notificationDropdown}>
              <div className={styles.dropdownHeader}>Notifications</div>
              <div className={styles.dropdownBody}>
                <div className={styles.notificationItem}>
                  <p className={styles.notificationText}>
                    <strong>Quotation submitted</strong> by TechCore Ltd for RFQ-2025-001.
                  </p>
                  <span className={styles.notificationTime}>5 mins ago</span>
                </div>
                <div className={styles.notificationItem}>
                  <p className={styles.notificationText}>
                    <strong>Approval requested</strong> for office chairs procurement.
                  </p>
                  <span className={styles.notificationTime}>1 hour ago</span>
                </div>
                <div className={styles.notificationItem}>
                  <p className={styles.notificationText}>
                    <strong>PO-2025-014</strong> has been generated and emailed.
                  </p>
                  <span className={styles.notificationTime}>3 hours ago</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* User Profile */}
        <div className={styles.profileContainer} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserButton showName={false} />
          {me && (
            <div className={styles.userInfo} style={{ textAlign: 'left' }}>
              <span className={styles.userName} style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>
                {me.name}
              </span>
              <span className={styles.userRole} style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                Role: 
                <select
                  value={me.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    marginLeft: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '11px',
                    outline: 'none',
                    padding: '2px'
                  }}
                >
                  <option value="ADMIN" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Admin</option>
                  <option value="PROCUREMENT_OFFICER" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Procurement Officer</option>
                  <option value="MANAGER" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Manager</option>
                  <option value="VENDOR" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>Vendor</option>
                </select>
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

interface LinkItemProps {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
}

const LinkItem: React.FC<LinkItemProps> = ({ href, icon: Icon, label }) => {
  return (
    <a href={href} className={styles.dropdownLink}>
      <Icon size={16} />
      <span>{label}</span>
    </a>
  );
};
