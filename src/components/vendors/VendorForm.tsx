'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { CATEGORIES, VENDOR_STATUS, VendorStatusType } from '@/lib/constants';
import { Vendor } from '@/types';
import styles from './VendorForm.module.css';

interface VendorFormProps {
  vendor?: Vendor; // Pass for editing mode
  isStaff?: boolean; // Admin/PO flag to show status/rating editors
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export const VendorForm: React.FC<VendorFormProps> = ({
  vendor,
  isStaff = true,
  onSubmitSuccess,
  onCancel,
}) => {
  const isEditMode = !!vendor;

  // Form states
  const [companyName, setCompanyName] = useState(vendor?.companyName || '');
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [gstNumber, setGstNumber] = useState(vendor?.gstNumber || '');
  const [address, setAddress] = useState(vendor?.address || '');
  const [city, setCity] = useState(vendor?.city || '');
  const [state, setState] = useState(vendor?.state || '');
  const [category, setCategory] = useState(vendor?.category || CATEGORIES[0]);
  const [status, setStatus] = useState<VendorStatusType>(vendor?.status || VENDOR_STATUS.PENDING);
  const [rating, setRating] = useState(vendor?.rating || 5);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const payload = {
      companyName,
      contactPerson,
      email,
      phone,
      gstNumber,
      address,
      city,
      state,
      category,
      ...(isStaff && { status, rating: Number(rating) }),
    };

    try {
      const url = isEditMode ? `/api/vendors/${vendor.id}` : '/api/vendors';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save vendor details.');
        setIsLoading(false);
      } else {
        setIsLoading(false);
        if (onSubmitSuccess) onSubmitSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3 className={styles.formTitle}>
        {isEditMode ? 'Edit Vendor Profile' : 'Add New Supplier'}
      </h3>

      {error ? <div className={styles.errorAlert}>{error}</div> : null}

      <div className={styles.grid}>
        {/* Company name & contact person */}
        <Input
          label="Company Legal Name *"
          placeholder="e.g. Infra Supplies Pvt Ltd"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={isLoading}
          required
        />
        <Input
          label="Contact Person Name *"
          placeholder="e.g. Amit Sharma"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          disabled={isLoading}
          required
        />

        {/* Email & Phone */}
        <Input
          label="Email Address *"
          type="email"
          placeholder="e.g. vendor@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || isEditMode} // Disable email edit
          required
        />
        <Input
          label="Contact Phone *"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isLoading}
          required
        />

        {/* GST & Category */}
        <Input
          label="GSTIN Number *"
          placeholder="15-digit GSTIN (e.g. 27AAAAA1111A1Z1)"
          value={gstNumber}
          onChange={(e) => setGstNumber(e.target.value)}
          disabled={isLoading}
          required
        />
        <div className={styles.selectWrapper}>
          <label className={styles.selectLabel}>Business Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={styles.select}
            disabled={isLoading}
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className={styles.fullWidth}>
          <Input
            label="Registered Address *"
            placeholder="e.g. Suite 404, Business Hub"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* City & State */}
        <Input
          label="City *"
          placeholder="e.g. Mumbai"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={isLoading}
          required
        />
        <Input
          label="State / Region *"
          placeholder="e.g. Maharashtra"
          value={state}
          onChange={(e) => setState(e.target.value)}
          disabled={isLoading}
          required
        />

        {/* Staff Only Fields */}
        {isStaff ? (
          <>
            <div className={styles.selectWrapper}>
              <label className={styles.selectLabel}>Verification Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={styles.select}
                disabled={isLoading}
                required
              >
                <option value={VENDOR_STATUS.ACTIVE}>Active / Verified</option>
                <option value={VENDOR_STATUS.PENDING}>Pending Verification</option>
                <option value={VENDOR_STATUS.IN_REVIEW}>In Review</option>
                <option value={VENDOR_STATUS.BLOCKED}>Blocked / Suspended</option>
              </select>
            </div>
            <div className={styles.selectWrapper}>
              <label className={styles.selectLabel}>Vendor Rating (1-5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={styles.select}
                disabled={isLoading}
              >
                <option value="5">5.0 (Excellent)</option>
                <option value="4">4.0 (Good)</option>
                <option value="3">3.0 (Average)</option>
                <option value="2">2.0 (Poor)</option>
                <option value="1">1.0 (Critical)</option>
              </select>
            </div>
          </>
        ) : null}
      </div>

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {isEditMode ? 'Save Changes' : 'Register Supplier'}
        </Button>
      </div>
    </form>
  );
};
