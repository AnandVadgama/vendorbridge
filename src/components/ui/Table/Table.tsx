import React from 'react';
import styles from './Table.module.css';
import { cn } from '@/lib/utils';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={styles.tableContainer}>
      <table className={cn(styles.table, className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <thead className={cn(styles.thead, className)} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <tbody className={cn(styles.tbody, className)} {...props}>
      {children}
    </tbody>
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isHeader?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className,
  isHeader = false,
  ...props
}) => {
  return (
    <tr
      className={cn(
        styles.tr,
        isHeader ? styles.headerRow : styles.bodyRow,
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

export interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className,
  isHeader = false,
  align = 'left',
  ...props
}) => {
  const CellTag = isHeader ? 'th' : 'td';
  return (
    <CellTag
      className={cn(
        styles.cell,
        isHeader ? styles.headerCell : styles.bodyCell,
        styles[align],
        className
      )}
      {...props}
    >
      {children}
    </CellTag>
  );
};
