'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Lock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
        setIsLoading(false);
      } else {
        router.refresh();
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className={styles.loginCard}>
      {/* Header Avatar Place Holder */}
      <div className={styles.avatarHeader}>
        <div className={styles.avatarCircle}>
          <Lock size={28} className={styles.lockIcon} />
        </div>
        <h2 className={styles.title}>VendorBridge</h2>
        <p className={styles.subtitle}>Sign in to your procurement dashboard</p>
      </div>

      {/* Error Alert */}
      {error ? (
        <div className={styles.errorAlert}>
          <AlertCircle size={16} className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Email Address"
          type="email"
          placeholder="officer@vendorbridge.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />

        <div className={styles.footerActions}>
          <Button
            type="submit"
            className={styles.submitBtn}
            isLoading={isLoading}
          >
            Log In
          </Button>

          <p className={styles.signupText}>
            Don't have an account?{' '}
            <Link href="/register" className={styles.signupLink}>
              Register here
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
