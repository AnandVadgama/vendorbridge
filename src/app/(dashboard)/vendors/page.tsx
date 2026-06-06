'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Search, Plus, Edit2, Trash2, ShieldAlert, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Modal } from '@/components/ui/Modal/Modal';
import { VendorForm } from '@/components/vendors/VendorForm';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table/Table';
import { VENDOR_STATUS, VendorStatusType } from '@/lib/constants';
import { Vendor } from '@/types';
import styles from './vendors.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch vendors');
  }
  return res.json();
});

export default function VendorsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isStaff = userRole === 'ADMIN' || userRole === 'PROCUREMENT_OFFICER';

  // State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<VendorStatusType | 'ALL'>('ALL');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | undefined>(undefined);

  // Data Fetching with SWR
  const { data: vendors = [], mutate, error, isLoading } = useSWR<Vendor[]>(
    `/api/vendors?search=${encodeURIComponent(search)}&status=${activeTab}`,
    fetcher
  );

  const handleOpenAdd = () => {
    setSelectedVendor(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;
    try {
      const response = await fetch(`/api/vendors/${vendorToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        mutate();
        setIsDeleteOpen(false);
        setVendorToDelete(undefined);
      }
    } catch (err) {
      console.error('Failed to delete vendor', err);
    }
  };

  const handleFormSuccess = () => {
    mutate();
    setIsFormOpen(false);
    setSelectedVendor(undefined);
  };

  // Status Badge Mapper
  const getStatusBadge = (status: VendorStatusType) => {
    switch (status) {
      case VENDOR_STATUS.ACTIVE:
        return <Badge variant="success">Active</Badge>;
      case VENDOR_STATUS.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case VENDOR_STATUS.IN_REVIEW:
        return <Badge variant="info">In Review</Badge>;
      case VENDOR_STATUS.BLOCKED:
        return <Badge variant="danger">Blocked</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Vendors"
        description="Manage supplier profiles, registration compliance, and service categories."
        actions={
          isStaff ? (
            <Button onClick={handleOpenAdd} variant="primary" className={styles.addBtn}>
              <Plus size={18} />
              <span>Add Vendor</span>
            </Button>
          ) : null
        }
      />

      {/* Main Panel */}
      <Card className={styles.tableCard}>
        {/* Search & Tabs Controls */}
        <div className={styles.controlsRow}>
          {/* Tabs */}
          <div className={styles.tabs}>
            {(['ALL', 'ACTIVE', 'PENDING', 'IN_REVIEW', 'BLOCKED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={styles.tabButton}
                data-active={activeTab === tab}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, GSTIN, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Vendors Table */}
        {isLoading ? (
          <div className={styles.loaderContainer}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            {error.message === 'Forbidden'
              ? 'Access Denied: You do not have permission to view vendor profiles.'
              : 'Failed to load supplier records.'}
          </div>
        ) : vendors.length === 0 ? (
          <div className={styles.emptyContainer}>
            <ShieldAlert size={40} className={styles.emptyIcon} />
            <p>No vendors found matching your selection.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow isHeader>
                <TableCell isHeader>Vendor Name</TableCell>
                <TableCell isHeader>Category</TableCell>
                <TableCell isHeader>GST Number</TableCell>
                <TableCell isHeader>Contact Person</TableCell>
                <TableCell isHeader>Rating</TableCell>
                <TableCell isHeader>Status</TableCell>
                {isStaff ? <TableCell isHeader align="right">Actions</TableCell> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className={styles.companyName}>
                    <div>
                      <p className={styles.companyTitle}>{vendor.companyName}</p>
                      <p className={styles.companySub}>{vendor.city}, {vendor.state}</p>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.category}</TableCell>
                  <TableCell className={styles.mono}>{vendor.gstNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className={styles.contactName}>{vendor.contactPerson}</p>
                      <p className={styles.contactEmail}>{vendor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.ratingCell}>
                      <Star size={14} className={styles.starIcon} />
                      <span>{Number(vendor.rating).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(vendor.status as any)}</TableCell>
                  {isStaff ? (
                    <TableCell align="right">
                      <div className={styles.actionBtns}>
                        <button
                          onClick={() => handleOpenEdit(vendor)}
                          className={styles.actionIconBtn}
                          title="Edit Vendor"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(vendor)}
                          className={styles.actionIconBtnDelete}
                          title="Delete Vendor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add / Edit Vendor Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} size="md">
        <VendorForm
          vendor={selectedVendor}
          isStaff={isStaff}
          onSubmitSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} size="sm">
        <div className={styles.deleteConfirmContainer}>
          <ShieldAlert size={48} className={styles.deleteAlertIcon} />
          <h4 className={styles.deleteTitle}>Delete Supplier Profile?</h4>
          <p className={styles.deleteDesc}>
            Are you sure you want to delete **{vendorToDelete?.companyName}**? This action will remove their supplier profile from the platform permanently.
          </p>
          <div className={styles.deleteActions}>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
