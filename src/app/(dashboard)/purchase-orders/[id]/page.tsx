'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  FileCheck,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './po.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch Purchase Order details');
  }
  return res.json();
});

interface RfqItem {
  productName: string;
  unit: string;
}

interface QuotationItem {
  id: string;
  unitPrice: number;
  totalPrice: number;
  rfqItem: RfqItem;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'PENDING_PAYMENT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidAt: string | null;
}

interface PurchaseOrderResponse {
  id: string;
  poNumber: string;
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'ISSUED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED';
  poDate: string;
  invoiceDate: string | null;
  dueDate: string | null;
  vendor: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    gstNumber: string;
    address: string;
    city: string;
    state: string;
  };
  quotation: {
    discount: number;
    items: QuotationItem[];
  };
  invoices: Invoice[];
}

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const poId = params.id as string;
  const { data: session } = useSession();
  const isProcurementStaff = session?.user?.role === 'ADMIN' || session?.user?.role === 'PROCUREMENT_OFFICER';

  const { data: po, error, isLoading, mutate } = useSWR<PurchaseOrderResponse>(
    poId ? `/api/purchase-orders/${poId}` : null,
    fetcher
  );

  const [actionsLoading, setActionsLoading] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} className={styles.errorIcon} />
        <p>
          {error?.message === 'Forbidden'
            ? 'Access Denied: You do not have permission to view this Purchase Order.'
            : 'Failed to load Purchase Order details. Verify that you have run database seeds.'}
        </p>
        <Link href="/purchase-orders">
          <Button variant="secondary" style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Purchase Orders
          </Button>
        </Link>
      </div>
    );
  }

  const invoice = po.invoices[0] || null;

  // Handle generating an invoice
  const handleGenerateInvoice = async () => {
    setActionsLoading('generate-invoice');
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/invoice`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate invoice');
      }

      await mutate();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating invoice');
    } finally {
      setActionsLoading(null);
    }
  };

  // Handle marking invoice as paid
  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    setActionsLoading('pay-invoice');
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update payment status');
      }

      await mutate();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error recording payment');
    } finally {
      setActionsLoading(null);
    }
  };

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Handle Email PDF Simulation
  const handleEmailSim = async () => {
    setActionsLoading('email');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`✉️ PO & Invoice successfully emailed to ${po.vendor.email}!`);
    setActionsLoading(null);
  };

  // Handle PDF Download Simulation
  const handleDownloadSim = () => {
    alert(`⬇️ Downloading PDF document for PO ${po.poNumber}...`);
  };

  return (
    <div className={styles.container}>
      {/* Page header and print/email action controls */}
      <div className={styles.topHeader}>
        <div className={styles.headerInfo}>
          <Link href="/purchase-orders" className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to Purchase Orders
          </Link>
          <PageHeader
            title={`Purchase Order & Invoice — ${po.poNumber}`}
            description="Auto-generated after quotation final manager approval."
          />
        </div>
        <div className={styles.actionsMenu}>
          <button className={styles.actionIconBtn} onClick={handleDownloadSim} title="Download PDF Document">
            <Download size={18} />
          </button>
          <button className={styles.actionIconBtn} onClick={handlePrint} title="Print Document">
            <Printer size={18} />
          </button>
          <button
            className={styles.actionIconBtn}
            onClick={handleEmailSim}
            disabled={actionsLoading === 'email'}
            title="Email to Vendor"
          >
            <Mail size={18} />
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left Column: PO Invoice Document View */}
        <div className={styles.documentCol}>
          <Card className={styles.invoiceSheet}>
            {/* Logo / Header Row */}
            <div className={styles.docHeader}>
              <div className={styles.logoBox}>
                <span className={styles.logoTitle}>VendorBridge</span>
                <span className={styles.logoSub}>Procurement ERP System</span>
              </div>
              <div className={styles.docTypeLabel}>
                <h3>PURCHASE ORDER</h3>
                <span className={styles.monoPoNum}>{po.poNumber}</span>
              </div>
            </div>

            {/* Bill To & Ship From address row */}
            <div className={styles.addressSection}>
              <div className={styles.billToBox}>
                <h4 className={styles.sectionTitle}>BILL TO:</h4>
                <div className={styles.addressDetails}>
                  <strong>{po.buyerName}</strong>
                  <p>{po.buyerAddress}</p>
                  <span>GSTIN: <strong>{po.buyerGstin}</strong></span>
                </div>
              </div>
              <div className={styles.vendorBox}>
                <h4 className={styles.sectionTitle}>VENDOR DETAILS:</h4>
                <div className={styles.addressDetails}>
                  <strong>{po.vendor.companyName}</strong>
                  <p>{po.vendor.address}</p>
                  <p>{po.vendor.city}, {po.vendor.state}</p>
                  <span>GSTIN: <strong>{po.vendor.gstNumber}</strong></span>
                  <p>Contact: {po.vendor.contactPerson} ({po.vendor.phone})</p>
                </div>
              </div>
            </div>

            {/* Document details dates row */}
            <div className={styles.docDetailsRow}>
              <div className={styles.docDetailBox}>
                <span className={styles.detailLabel}>PO DATE</span>
                <span className={styles.detailVal}>{formatDate(po.poDate, false)}</span>
              </div>
              <div className={styles.docDetailBox}>
                <span className={styles.detailLabel}>INVOICE DATE</span>
                <span className={styles.detailVal}>{po.invoiceDate ? formatDate(po.invoiceDate, false) : 'Not Invoiced'}</span>
              </div>
              <div className={styles.docDetailBox}>
                <span className={styles.detailLabel}>DUE DATE</span>
                <span className={styles.detailVal}>{po.dueDate ? formatDate(po.dueDate, false) : '—'}</span>
              </div>
              <div className={styles.docDetailBox}>
                <span className={styles.detailLabel}>PO STATUS</span>
                <span className={styles.detailVal}>
                  <Badge variant={po.status === 'ISSUED' || po.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {po.status}
                  </Badge>
                </span>
              </div>
            </div>

            {/* Items table */}
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Product Description</th>
                  <th>Quantity</th>
                  <th>Unit Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {po.quotation.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td className={styles.productName}>{item.rfqItem.productName}</td>
                    <td>{po.quotation.items[idx]?.rfqItem ? '1' : '1'} Unit</td> {/* Placeholder matching */}
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial breakdown */}
            <div className={styles.financialSummaryBlock}>
              <div className={styles.pricingSummaryTable}>
                <div className={styles.priceRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(po.subtotal)}</span>
                </div>
                {po.quotation.discount > 0 && (
                  <div className={styles.priceRow}>
                    <span>Discount:</span>
                    <span className={styles.discountVal}>- {formatCurrency(po.quotation.discount)}</span>
                  </div>
                )}
                <div className={styles.priceRow}>
                  <span>CGST ({po.cgstRate.toFixed(1)}%):</span>
                  <span>{formatCurrency(po.cgstAmount)}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>SGST ({po.sgstRate.toFixed(1)}%):</span>
                  <span>{formatCurrency(po.sgstAmount)}</span>
                </div>
                <hr className={styles.pricingDivider} />
                <div className={`${styles.priceRow} ${styles.grandTotal}`}>
                  <span>Grand Total (INR):</span>
                  <span>{formatCurrency(po.grandTotal)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Invoice Status & Billing Operations */}
        <div className={styles.opsCol}>
          {/* Invoice operations card */}
          <Card title="Billing & Accounts Payable" className={styles.opsCard}>
            {!invoice ? (
              <div className={styles.opsStateBox}>
                <Receipt size={40} className={styles.opsIconWarning} />
                <h4>Invoice Not Generated</h4>
                <p className={styles.opsText}>The workflow has been approved, but the invoice hasn't been created yet.</p>
                {isProcurementStaff && (
                  <Button
                    variant="primary"
                    onClick={handleGenerateInvoice}
                    disabled={actionsLoading === 'generate-invoice'}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {actionsLoading === 'generate-invoice' ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                )}
              </div>
            ) : (
              <div className={styles.invoiceOpsDetails}>
                <div className={styles.opsRow}>
                  <span>Invoice Number:</span>
                  <strong className={styles.mono}>{invoice.invoiceNumber}</strong>
                </div>
                <div className={styles.opsRow}>
                  <span>Invoice Status:</span>
                  <Badge variant={invoice.status === 'PAID' ? 'success' : 'warning'}>
                    {invoice.status === 'PENDING_PAYMENT' ? 'PENDING PAYMENT' : invoice.status}
                  </Badge>
                </div>
                <div className={styles.opsRow}>
                  <span>Due Date:</span>
                  <span>{formatDate(invoice.dueDate, false)}</span>
                </div>
                {invoice.paidAt && (
                  <div className={styles.opsRow}>
                    <span>Paid Date:</span>
                    <span>{formatDate(invoice.paidAt, true)}</span>
                  </div>
                )}

                <hr className={styles.divider} />

                {invoice.status === 'PENDING_PAYMENT' ? (
                  <div className={styles.pendingOpsBox}>
                    <p className={styles.pendingText}>
                      💸 <strong>Pending Accounts Payable:</strong> This invoice is waiting for payment registration from the finance department.
                    </p>
                    {isProcurementStaff && (
                      <Button
                        variant="primary"
                        onClick={handleMarkAsPaid}
                        disabled={actionsLoading === 'pay-invoice'}
                        style={{ width: '100%', marginTop: '1rem' }}
                      >
                        {actionsLoading === 'pay-invoice' ? 'Recording...' : 'Mark as Paid'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={styles.paidOpsBox}>
                    <CheckCircle2 size={36} className={styles.paidIcon} />
                    <h4>Invoice Fully Settled</h4>
                    <p>Payment cleared in system accounts logs.</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
