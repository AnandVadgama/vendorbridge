import { Role, VendorStatus, RfqStatus, QuotationStatus, ApprovalStatus, PoStatus, InvoiceStatus } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  photo?: string | null;
  country?: string | null;
  additionalInfo?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  category: string;
  status: VendorStatus;
  rating: number;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RfqItem {
  id: string;
  rfqId: string;
  productName: string;
  description?: string | null;
  quantity: number;
  unit: string;
}

export interface RfqAttachment {
  id: string;
  rfqId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface Rfq {
  id: string;
  rfqNumber: string;
  title: string;
  description?: string | null;
  category: string;
  status: RfqStatus;
  deadline: Date;
  currentStep: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: User;
  items?: RfqItem[];
  attachments?: RfqAttachment[];
  _count?: {
    rfqVendors: number;
    quotations: number;
  };
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  rfqItemId: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  remarks?: string | null;
  rfqItem?: RfqItem;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  deliveryDays: number;
  paymentTerms: string;
  warranty: string;
  notes?: string | null;
  status: QuotationStatus;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vendor?: Vendor;
  rfq?: Rfq;
  items?: QuotationItem[];
}

export interface Approval {
  id: string;
  quotationId: string;
  requestedById: string;
  approverId?: string | null;
  status: ApprovalStatus;
  currentStep: number;
  totalSteps: number;
  remarks?: string | null;
  decidedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  quotation?: Quotation;
  requestedBy?: User;
  approver?: User | null;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  vendorId: string;
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  grandTotal: number;
  status: PoStatus;
  poDate: Date;
  invoiceDate?: Date | null;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vendor?: Vendor;
  quotation?: Quotation;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  status: InvoiceStatus;
  dueDate: Date;
  sentAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vendor?: Vendor;
  purchaseOrder?: PurchaseOrder;
}

export interface ActivityLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  details: string;
  category: string;
  createdAt: Date;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
}
