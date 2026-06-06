export const ROLES = {
  ADMIN: 'ADMIN',
  PROCUREMENT_OFFICER: 'PROCUREMENT_OFFICER',
  MANAGER: 'MANAGER',
  VENDOR: 'VENDOR',
} as const;

export type UserRole = keyof typeof ROLES;

export const VENDOR_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  BLOCKED: 'BLOCKED',
} as const;

export type VendorStatusType = keyof typeof VENDOR_STATUS;

export const RFQ_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type RfqStatusType = keyof typeof RFQ_STATUS;

export const QUOTATION_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type QuotationStatusType = keyof typeof QUOTATION_STATUS;

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatusType = keyof typeof APPROVAL_STATUS;

export const PO_STATUS = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  RECEIVED: 'RECEIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type PoStatusType = keyof typeof PO_STATUS;

export const INVOICE_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatusType = keyof typeof INVOICE_STATUS;

export const CATEGORIES = [
  'IT Hardware',
  'Software/SaaS',
  'Furniture & Office Supplies',
  'Stationery',
  'Logistics & Transport',
  'Facilities & Services',
  'Others',
] as const;

export const TAX_RATES = {
  CGST: 9.0, // 9% Central GST
  SGST: 9.0, // 9% State GST
} as const;
