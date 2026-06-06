import React from 'react';
import styles from './Badge.module.css';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  ...props
}) => {
  return (
    <span
      className={cn(styles.badge, styles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
