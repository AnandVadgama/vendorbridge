'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { useSession } from '@/lib/useSession';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ShieldAlert, Star, Calendar, CreditCard, Shield, Truck, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatCurrency } from '@/lib/utils';
import styles from './compare.module.css';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch quotation comparison');
  }
  return res.json();
});

interface RfqItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface RfqData {
  id: string;
  rfqNumber: string;
  title: string;
  category: string;
  deadline: string;
  items: RfqItem[];
}

interface QuotationItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
}

interface Vendor {
  id: string;
  companyName: string;
  rating: number;
}

interface QuotationData {
  id: string;
  quotationNumber: string;
  vendor: Vendor;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  deliveryDays: number;
  paymentTerms: string;
  warranty: string;
  notes?: string;
  status: string;
  items: QuotationItem[];
}

interface CompareResponse {
  rfq: RfqData;
  quotations: QuotationData[];
}

export default function CompareQuotationsPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.id as string;
  const { data: session } = useSession();
  const isProcurementStaff = session?.user?.role === 'ADMIN' || session?.user?.role === 'PROCUREMENT_OFFICER';

  const { data, error, isLoading, mutate } = useSWR<CompareResponse>(
    rfqId ? `/api/rfqs/${rfqId}/compare` : null,
    fetcher
  );

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorContainer}>
        <ShieldAlert size={48} className={styles.errorIcon} />
        <p>
          {error?.message === 'Forbidden'
            ? 'Access Denied: You do not have permission to view this quotation comparison.'
            : 'Failed to load quotation comparison details. Please make sure the database is seeded.'}
        </p>
        <Link href="/rfqs">
          <Button variant="secondary" style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to RFQs
          </Button>
        </Link>
      </div>
    );
  }

  const { rfq, quotations } = data;

  // Filter only submitted or accepted proposals
  const activeQuotations = quotations.filter((q) => q.status === 'SUBMITTED' || q.status === 'ACCEPTED');

  // Identify the lowest grand total price to highlight in emerald green
  const lowestPrice = activeQuotations.length > 0
    ? Math.min(...activeQuotations.map((q) => q.grandTotal))
    : null;

  const handleSelectAndApprove = async (quotationId: string) => {
    setApprovingId(quotationId);

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId,
          remarks: remarks || `Selected quotation for approval workflow`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to initiate approval');
      }

      const approval = await res.json();
      router.push(`/approvals/${approval.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Error initiating approval workflow');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topHeader}>
        <Link href="/rfqs" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to RFQs
        </Link>
        <PageHeader
          title="Quotation Comparison"
          description={`RFQ: ${rfq.rfqNumber} — ${rfq.title} (${activeQuotations.length} quotes received)`}
        />
      </div>

      {activeQuotations.length === 0 ? (
        <Card className={styles.noQuotesCard}>
          <div className={styles.noQuotesState}>
            <FileText size={48} className={styles.noQuotesIcon} />
            <h3>No Submitted Quotations Yet</h3>
            <p>Wait for invited vendors to submit their quotation spreadsheets.</p>
          </div>
        </Card>
      ) : (
        <div className={styles.comparisonLayout}>
          {/* Comparison Table Grid */}
          <div className={styles.gridContainer}>
            <table className={styles.compareTable}>
              <thead>
                <tr>
                  <th className={styles.criteriaHeader}>Comparison Criteria</th>
                  {activeQuotations.map((q) => {
                    const isWinner = lowestPrice !== null && q.grandTotal === lowestPrice;
                    return (
                      <th key={q.id} className={`${styles.vendorHeader} ${isWinner ? styles.lowestHeader : ''}`}>
                        <div className={styles.vendorHeaderBox}>
                          {isWinner && <Badge variant="success" className={styles.lowestBadge}>Lowest Quote</Badge>}
                          <span className={styles.vendorName}>{q.vendor.companyName}</span>
                          <div className={styles.vendorRating}>
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            <span>{q.vendor.rating.toFixed(1)} / 5</span>
                          </div>
                          <span className={styles.quoteNumber}>{q.quotationNumber}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* RFQ Line Items */}
                <tr className={styles.sectionDivider}>
                  <td colSpan={activeQuotations.length + 1}>Line Items Pricing</td>
                </tr>

                {rfq.items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.itemDetailCell}>
                      <span className={styles.itemName}>{item.productName}</span>
                      <span className={styles.itemQty}>Qty: {item.quantity} {item.unit}</span>
                    </td>
                    {activeQuotations.map((q) => {
                      const qItem = q.items.find((qi) => qi.rfqItemId === item.id);
                      return (
                        <td key={q.id} className={styles.priceCell}>
                          {qItem ? (
                            <div className={styles.priceDetail}>
                              <span className={styles.unitPrice}>{formatCurrency(qItem.unitPrice)} / {item.unit}</span>
                              <span className={styles.totalPrice}>Total: <strong>{formatCurrency(qItem.totalPrice)}</strong></span>
                            </div>
                          ) : (
                            <span className={styles.notQuoted}>N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Subtotal, Discount & Tax Summary */}
                <tr className={styles.sectionDivider}>
                  <td colSpan={activeQuotations.length + 1}>Commercial Totals</td>
                </tr>
                <tr>
                  <td className={styles.criteriaCell}>Subtotal</td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.dataCell}>{formatCurrency(q.subtotal)}</td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.criteriaCell}>Discount Given</td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.discountCell}>
                      {q.discount > 0 ? `- ${formatCurrency(q.discount)}` : '₹0.00'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.criteriaCell}>GST Tax ({activeQuotations[0]?.taxPercent || 18}%)</td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.dataCell}>{formatCurrency(q.taxAmount)}</td>
                  ))}
                </tr>
                <tr className={styles.grandTotalRow}>
                  <td className={styles.criteriaCell}>Grand Total (INR)</td>
                  {activeQuotations.map((q) => {
                    const isWinner = lowestPrice !== null && q.grandTotal === lowestPrice;
                    return (
                      <td key={q.id} className={`${styles.grandTotalValue} ${isWinner ? styles.lowestTotalValue : ''}`}>
                        {formatCurrency(q.grandTotal)}
                      </td>
                    );
                  })}
                </tr>

                {/* Terms and Logistics */}
                <tr className={styles.sectionDivider}>
                  <td colSpan={activeQuotations.length + 1}>Logistics & Payment Terms</td>
                </tr>
                <tr>
                  <td className={styles.criteriaCell}>
                    <div className={styles.critBox}><Truck size={16} /> Delivery Time</div>
                  </td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.dataCell}>
                      <span className={styles.boldDetail}>{q.deliveryDays} Days</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.criteriaCell}>
                    <div className={styles.critBox}><CreditCard size={16} /> Payment Terms</div>
                  </td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.dataCell}>
                      <span className={styles.wrappedText}>{q.paymentTerms || 'Standard Terms'}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.criteriaCell}>
                    <div className={styles.critBox}><Shield size={16} /> Warranty Terms</div>
                  </td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.dataCell}>
                      <span className={styles.wrappedText}>{q.warranty || 'No Warranty'}</span>
                    </td>
                  ))}
                </tr>
                
                {/* Remarks & Notes */}
                <tr>
                  <td className={styles.criteriaCell}>
                    <div className={styles.critBox}><FileText size={16} /> Vendor Remarks</div>
                  </td>
                  {activeQuotations.map((q) => (
                    <td key={q.id} className={styles.notesCell}>
                      <span className={styles.wrappedText}>{q.notes || '—'}</span>
                    </td>
                  ))}
                </tr>

                {/* Selection Actions */}
                {isProcurementStaff && (
                  <tr className={styles.actionRow}>
                    <td className={styles.criteriaCell}>Workflow Selection</td>
                    {activeQuotations.map((q) => {
                      const isApproved = q.status === 'ACCEPTED';
                      return (
                        <td key={q.id} className={styles.actionCell}>
                          {isApproved ? (
                            <div className={styles.approvedStatus}>
                              <CheckCircle size={18} /> Accepted & In Approval
                            </div>
                          ) : (
                            <Button
                              variant={lowestPrice !== null && q.grandTotal === lowestPrice ? 'primary' : 'secondary'}
                              onClick={() => handleSelectAndApprove(q.id)}
                              disabled={approvingId !== null}
                              className={styles.approveBtn}
                            >
                              {approvingId === q.id ? 'Initiating...' : 'Select & Approve'}
                            </Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.bottomDisclaimer}>
            <p className={styles.note}>
              💡 <strong>Selection Note:</strong> Selecting a vendor's quotation here initiates the <strong>3-step approval workflow</strong>. 
              The quotation will be sent to the Operations Manager for secondary review, and the other quotes will be automatically rejected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
