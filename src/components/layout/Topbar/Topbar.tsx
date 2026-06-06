'use client';

import React, { useState } from 'react';
import { Bell, Search, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import styles from './Topbar.module.css';

export const Topbar: React.FC = () => {
  const { data: session } = useSession();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const user = session?.user;
  
  // Dummy notification count
  const unreadNotifications = 3;

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

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
        <div className={styles.profileContainer}>
          <button
            className={styles.profileButton}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className={styles.avatar}>
              {user?.image ? (
                <img src={user.image} alt={user.name || 'User'} className={styles.avatarImg} />
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.name || 'Procurement Officer'}
              </span>
              <span className={styles.userRole}>
                {user?.role ? String(user.role).replace('_', ' ') : 'Officer'}
              </span>
            </div>
          </button>

          {showProfileDropdown ? (
            <div className={styles.profileDropdown}>
              <LinkItem href="/settings" icon={Settings} label="Settings" />
              <button className={styles.dropdownBtn} onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
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
