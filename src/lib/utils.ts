/**
 * Formats a number to Indian Rupee (INR) currency format (e.g. ₹ 2,34,500.00 or ₹ 2.3L)
 */
export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹ ${(amount / 1000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date into a clean readable format (e.g., "21 May, 2025 - 3:45 PM")
 */
export function formatDate(dateInput: Date | string | number, includeTime = true): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  // Format e.g. "21 May 2025, 3:45 pm" -> "21 May, 2025 - 3:45 PM"
  const formatted = new Intl.DateTimeFormat('en-IN', options).format(date);
  
  if (includeTime) {
    const parts = formatted.split(', ');
    if (parts.length === 2) {
      return `${parts[0]} - ${parts[1].toUpperCase()}`;
    }
  }
  return formatted;
}

/**
 * Formats file size in bytes to a human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Simple helper to join class names together
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generates an automated unique ID for RFQs (e.g., RFQ-2025-001)
 */
export function generateRfqNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequence).padStart(3, '0');
  return `RFQ-${year}-${paddedSeq}`;
}

/**
 * Generates an automated unique ID for POs (e.g., PO-2025-001)
 */
export function generatePoNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequence).padStart(3, '0');
  return `PO-${year}-${paddedSeq}`;
}

/**
 * Generates an automated unique ID for Invoices (e.g., INV-2025-001)
 */
export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequence).padStart(3, '0');
  return `INV-${year}-${paddedSeq}`;
}
