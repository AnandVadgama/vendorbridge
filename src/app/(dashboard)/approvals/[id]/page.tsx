'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldAlert, FileText, Send, User, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import styles from './approval.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch approval details');
  }
  return res.json();
});

interface UserSelect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RfqItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface QuotationItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  rfqItem: RfqItem;
}

interface ApprovalResponse {
  id: string;
  quotationId: string;
  requestedById: string;
  requestedBy: UserSelect;
  approverId: string | null;
  approver: UserSelect | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  currentStep: number;
  totalSteps: number;
  remarks: string | null;
  createdAt: string;
  decidedAt: string | null;
  quotation: {
    id: string;
    quotationNumber: string;
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    discount: number;
    grandTotal: number;
    deliveryDays: number;
    paymentTerms: string;
    warranty: string;
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
    rfq: {
      id: string;
      rfqNumber: string;
      title: string;
      category: string;
    };
    items: QuotationItem[];
  };
}

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const approvalId = params.id as string;
  const { data: session } = useSession();
  
  const userRole = session?.user?.role;
  const isApproverRole = userRole === 'ADMIN' || userRole === 'MANAGER';

  const { data: approval, error, isLoading, mutate } = useSWR<ApprovalResponse>(
    approvalId ? `/api/approvals/${approvalId}` : null,
    fetcher
  );

  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className={styles.errorContainer}>
        <ShieldAlert size={48} className={styles.errorIcon} />
        <p>
          {error?.message === 'Forbidden'
            ? 'Access Denied: You do not have permission to view this approval workflow.'
            : 'Failed to load approval workflow details. Make sure the database seeds are complete.'}
        </p>
        <Link href="/approvals">
          <Button variant="secondary" style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Approvals
          </Button>
        </Link>
      </div>
    );
  }

  const { quotation } = approval;
  const { vendor, rfq } = quotation;

  const handleDecision = async (action: 'APPROVE' | 'REJECT') => {
    setSubmitting(true);

    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          remarks: decisionRemarks || `${action === 'APPROVE' ? 'Approved' : 'Rejected'} at Step ${approval.currentStep}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update approval decision');
      }

      await mutate();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error processing approval choice');
    } finally {
      setSubmitting(false);
    }
  };

  // Timeline representation
  const steps = [
    {
      title: 'Procurement Submission',
      desc: `Created by ${approval.requestedBy.firstName} ${approval.requestedBy.lastName}`,
      status: 'APPROVED',
      date: approval.createdAt,
    },
    {
      title: 'Operations Manager Review',
      desc: approval.currentStep > 1 
        ? `Reviewed & approved by ${approval.approver?.firstName || 'Manager'}`
        : 'Pending review by Operations Manager',
      status: approval.status === 'REJECTED' && approval.currentStep === 1
        ? 'REJECTED'
        : approval.currentStep > 1 
          ? 'APPROVED' 
          : 'PENDING',
      date: approval.currentStep > 1 ? approval.decidedAt : null,
    },
    {
      title: 'Director Audit & PO Generation',
      desc: approval.status === 'APPROVED' 
        ? 'Fully approved. Purchase Order generated.'
        : 'Awaiting final sign-off',
      status: approval.status === 'APPROVED' 
        ? 'APPROVED' 
        : approval.status === 'REJECTED' 
          ? 'REJECTED' 
          : 'PENDING',
      date: approval.status === 'APPROVED' ? approval.decidedAt : null,
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.topHeader}>
        <Button variant="secondary" onClick={() => router.push('/approvals')} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Approvals
        </Button>
        <PageHeader
          title={`Approval Workflow — RFQ: ${rfq.title}`}
          description={`Reference: ${rfq.rfqNumber} — Vendor: ${vendor.companyName}`}
        />
      </div>

      {/* Stepper Wizard Progress */}
      <div className={styles.stepperContainer}>
        {[1, 2, 3].map((num) => {
          let stepStatus = styles.upcoming;
          if (approval.status === 'APPROVED') {
            stepStatus = styles.completed;
          } else if (approval.status === 'REJECTED') {
            stepStatus = styles.rejected;
          } else if (approval.currentStep === num) {
            stepStatus = styles.active;
          } else if (approval.currentStep > num) {
            stepStatus = styles.completed;
          }

          return (
            <div key={num} className={`${styles.stepNode} ${stepStatus}`}>
              <div className={styles.stepCircle}>
                {stepStatus === styles.completed ? '✓' : stepStatus === styles.rejected ? '✗' : num}
              </div>
              <span className={styles.stepLabel}>
                {num === 1 ? 'Submission' : num === 2 ? 'Manager Review' : 'Final PO Sign-off'}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.layoutGrid}>
        {/* Left Column: Timeline Status */}
        <div className={styles.leftCol}>
          <Card title="Workflow Approval Timeline" className={styles.card}>
            <div className={styles.timeline}>
              {steps.map((stepItem, idx) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineIconContainer}>
                    {stepItem.status === 'APPROVED' ? (
                      <CheckCircle2 className={styles.timelineIconApproved} size={22} />
                    ) : stepItem.status === 'REJECTED' ? (
                      <XCircle className={styles.timelineIconRejected} size={22} />
                    ) : (
                      <Clock className={styles.timelineIconPending} size={22} />
                    )}
                    {idx < steps.length - 1 && <div className={styles.timelineLine} />}
                  </div>
                  <div className={styles.timelineContent}>
                    <h4 className={styles.timelineTitle}>{stepItem.title}</h4>
                    <p className={styles.timelineDesc}>{stepItem.desc}</p>
                    {stepItem.date && (
                      <span className={styles.timelineDate}>{formatDate(stepItem.date, true)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Remarks input section if pending approval */}
          {approval.status === 'PENDING' && isApproverRole && (
            <Card title="Add Approval Remarks" className={styles.remarksCard}>
              <div className={styles.formGroup}>
                <label>Review comments, remarks or compliance details *</label>
                <textarea
                  className={styles.textarea}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Enter remarks or approval conditions..."
                  disabled={submitting}
                />
              </div>
              <div className={styles.actionsRow}>
                <Button
                  variant="danger"
                  onClick={() => handleDecision('REJECT')}
                  disabled={submitting}
                  className={styles.actionBtn}
                >
                  <XCircle size={16} /> Reject Quotation
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleDecision('APPROVE')}
                  disabled={submitting}
                  className={styles.actionBtn}
                >
                  <CheckCircle2 size={16} /> Approve & Continue
                </Button>
              </div>
            </Card>
          )}

          {/* Display decision comments if resolved */}
          {approval.status !== 'PENDING' && (
            <Card title="Final Approver Decision Details" className={styles.card}>
              <div className={styles.decisionSummary}>
                <div className={styles.decisionHeader}>
                  <strong>Status:</strong>
                  <Badge variant={approval.status === 'APPROVED' ? 'success' : 'danger'}>
                    {approval.status}
                  </Badge>
                </div>
                <div className={styles.decisionItem}>
                  <strong>Resolved At:</strong>
                  <span>{approval.decidedAt ? formatDate(approval.decidedAt, true) : '—'}</span>
                </div>
                {approval.approver && (
                  <div className={styles.decisionItem}>
                    <strong>Approver Profile:</strong>
                    <span>{approval.approver.firstName} {approval.approver.lastName}</span>
                  </div>
                )}
                <div className={styles.decisionItem}>
                  <strong>Approver Conditions / Remarks:</strong>
                  <p className={styles.remarksDisplay}>
                    "{approval.remarks || 'No remarks provided.'}"
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Quotation Summary */}
        <div className={styles.rightCol}>
          <Card title="Quotation Proposal Summary" className={styles.card}>
            <div className={styles.summarySection}>
              <h4 className={styles.sectionHeader}>Supplier Information</h4>
              <div className={styles.infoRow}>
                <strong>Company:</strong>
                <span>{vendor.companyName}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>GST Number:</strong>
                <span className={styles.gstText}>{vendor.gstNumber}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>Billing Address:</strong>
                <span className={styles.addressText}>
                  {vendor.address}, {vendor.city}, {vendor.state}
                </span>
              </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.summarySection}>
              <h4 className={styles.sectionHeader}>Line Items Proposal</h4>
              <div className={styles.itemList}>
                {quotation.items.map((item) => (
                  <div key={item.id} className={styles.proposalItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTitle}>{item.rfqItem.productName}</span>
                      <span className={styles.itemQty}>Qty: {item.rfqItem.quantity} {item.rfqItem.unit}</span>
                    </div>
                    <div className={styles.itemPriceDetail}>
                      <span>Unit: {formatCurrency(item.unitPrice)}</span>
                      <span>Total: <strong>{formatCurrency(item.totalPrice)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.summarySection}>
              <h4 className={styles.sectionHeader}>Logistics & Pricing Summary</h4>
              <div className={styles.infoRow}>
                <strong>Delivery Lead Time:</strong>
                <span>{quotation.deliveryDays} Days</span>
              </div>
              <div className={styles.infoRow}>
                <strong>Payment Terms:</strong>
                <span>{quotation.paymentTerms}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>Warranty terms:</strong>
                <span>{quotation.warranty}</span>
              </div>
              
              <div className={styles.commercialSummary}>
                <div className={styles.commercialRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className={styles.commercialRow}>
                    <span>Discount:</span>
                    <span className={styles.discountText}>- {formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className={styles.commercialRow}>
                  <span>GST Tax ({quotation.taxPercent}%):</span>
                  <span>{formatCurrency(quotation.taxAmount)}</span>
                </div>
                <hr className={styles.subDivider} />
                <div className={`${styles.commercialRow} ${styles.grandTotal}`}>
                  <span>Grand Total (INR):</span>
                  <span>{formatCurrency(quotation.grandTotal)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
