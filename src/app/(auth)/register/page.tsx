'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  
  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PROCUREMENT_OFFICER');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setPhotoBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName || !lastName || !email || !password || !country) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          role,
          country,
          additionalInfo,
          photo: photoBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className={styles.registerCard}>
      {/* Photo Upload Header */}
      <div className={styles.header}>
        <div className={styles.photoUploadContainer} onClick={handlePhotoClick}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className={styles.hiddenInput}
            accept="image/*"
            disabled={isLoading}
          />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
          ) : (
            <div className={styles.photoPlaceholder}>
              <User size={32} className={styles.userIcon} />
              <div className={styles.cameraOverlay}>
                <Camera size={14} />
              </div>
            </div>
          )}
        </div>
        <h2 className={styles.title}>Register Account</h2>
        <p className={styles.subtitle}>Create your VendorBridge ERP profile</p>
      </div>

      {/* Message Alerts */}
      {error ? (
        <div className={styles.errorAlert}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : success ? (
        <div className={styles.successAlert}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Row 1: First Name & Last Name */}
        <div className={styles.row}>
          <Input
            label="First Name *"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            label="Last Name *"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Row 2: Email & Phone */}
        <div className={styles.row}>
          <Input
            label="Email Address *"
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Row 3: Role & Country */}
        <div className={styles.row}>
          <div className={styles.selectWrapper}>
            <label className={styles.selectLabel}>System Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={styles.select}
              disabled={isLoading}
              required
            >
              <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
              <option value="MANAGER">Operations Manager</option>
              <option value="ADMIN">System Administrator</option>
              <option value="VENDOR">Vendor Representative</option>
            </select>
          </div>
          <Input
            label="Country *"
            placeholder="India"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Password */}
        <Input
          label="Password *"
          type="password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />

        {/* Additional Info */}
        <Input
          label="Additional Information"
          type="textarea"
          textareaProps={{
            placeholder: 'Provide department info, company details or specialties...',
            rows: 3,
          }}
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          disabled={isLoading}
        />

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <Button
            type="submit"
            className={styles.submitBtn}
            isLoading={isLoading}
          >
            Register
          </Button>

          <p className={styles.loginText}>
            Already have an account?{' '}
            <Link href="/login" className={styles.loginLink}>
              Log in here
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
