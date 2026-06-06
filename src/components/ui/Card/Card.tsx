import React from 'react';
import styles from './Card.module.css';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  isInteractive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  headerActions,
  footer,
  isInteractive = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        styles.card,
        isInteractive && styles.interactive,
        className
      )}
      {...props}
    >
      {title || subtitle || headerActions ? (
        <div className={styles.header}>
          <div className={styles.titleArea}>
            {title ? <h3 className={styles.title}>{title}</h3> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {headerActions ? <div className={styles.actions}>{headerActions}</div> : null}
        </div>
      ) : null}
      
      <div className={styles.body}>{children}</div>

      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
};
