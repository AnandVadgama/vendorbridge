'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { formatCurrency } from '@/lib/utils';
import { FileText, Send, Save, ArrowLeft } from 'lucide-react';
import styles from './submit.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RfqItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface RfqDetails {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  deadline: string;
  items: RfqItem[];
}

export default function SubmitQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.rfqId as string;

  const { data: rfq, error, isLoading } = useSWR<RfqDetails>(
    rfqId ? `/api/rfqs/${rfqId}` : null,
    fetcher
  );

  const [prices, setPrices] = useState<Record<string, { unitPrice: number; deliveryDays: number }>>({});
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18); // Default 18% GST (CGST 9% + SGST 9%)
  const [paymentTerms, setPaymentTerms] = useState('');
  const [warranty, setWarranty] = useState('');

  // Auto populate inputs when rfq loads
  useEffect(() => {
    if (rfq?.items) {
      const initialPrices: Record<string, { unitPrice: number; deliveryDays: number }> = {};
      rfq.items.forEach((item) => {
        initialPrices[item.id] = { unitPrice: 0, deliveryDays: 7 };
      });
      setPrices(initialPrices);
    }
  }, [rfq]);

  if (isLoading) return <div className="spinner" />;
  if (error || !rfq) return <div>Failed to load RFQ specifications.</div>;

  // Pricing calculations
  const calculateSubtotal = () => {
    return rfq.items.reduce((sum, item) => {
      const price = prices[item.id]?.unitPrice || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal - discount) * (taxPercent / 100);
  const grandTotal = subtotal - discount + taxAmount;

  const handlePriceChange = (itemId: string, field: string, val: number) => {
    setPrices((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val,
      },
    }));
  };

  const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqId,
          subtotal,
          taxPercent,
          taxAmount,
          discount,
          grandTotal,
          paymentTerms,
          warranty,
          status,
          items: rfq.items.map((item) => ({
            rfqItemId: item.id,
            unitPrice: prices[item.id]?.unitPrice || 0,
            totalPrice: (prices[item.id]?.unitPrice || 0) * item.quantity,
            deliveryDays: prices[item.id]?.deliveryDays || 7,
          })),
        }),
      });

      if (!res.ok) throw new Error('Submission error');

      router.push('/quotations');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to submit proposal quotation');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
        <PageHeader
          title={`Submit Quotation — RFQ: ${rfq.title}`}
          description={`Deadline: ${new Date(rfq.deadline).toLocaleDateString()}`}
        />
      </div>

      {/* RFQ Description Box */}
      <Card className={styles.rfqCard} title={`RFQ Scope specifications: ${rfq.rfqNumber}`}>
        <p className={styles.description}>{rfq.description || 'No additional scope specifications provided.'}</p>
      </Card>

      <div className={styles.layout}>
        <div className={styles.formPanel}>
          <Card title="Line Item Proposals" className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Requested Product</th>
                  <th>Quantity</th>
                  <th>Unit Price (₹)</th>
                  <th>Total (₹)</th>
                  <th>Delivery (Days)</th>
                </tr>
              </thead>
              <tbody>
                {rfq.items.map((item) => {
                  const itemPrice = prices[item.id]?.unitPrice || 0;
                  const itemTotal = itemPrice * item.quantity;
                  return (
                    <tr key={item.id}>
                      <td className={styles.productName}>{item.productName}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>
                        <Input
                          type="number"
                          value={prices[item.id]?.unitPrice || ''}
                          onChange={(e) => handlePriceChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className={styles.totalCell}>{formatCurrency(itemTotal)}</td>
                      <td>
                        <Input
                          type="number"
                          value={prices[item.id]?.deliveryDays || ''}
                          onChange={(e) => handlePriceChange(item.id, 'deliveryDays', parseInt(e.target.value, 10) || 7)}
                          placeholder="e.g. 7"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card title="Terms & Details" className={styles.card} style={{ marginTop: '1.5rem' }}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Warranty Terms</label>
                <Input value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g. 1 Year Replacement Warranty" />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Terms</label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30% Advance, 70% Post-delivery" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right side summary cards */}
        <div className={styles.summaryPanel}>
          <Card title="Pricing Summary" className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Discount:</span>
              <Input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="Discount amount"
                style={{ width: '120px' }}
              />
            </div>
            <div className={styles.summaryRow}>
              <span>GST Tax (9% CGST + 9% SGST):</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <hr className={styles.divider} />
            <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <div className={styles.actionButtons}>
              <Button variant="secondary" onClick={() => handleSubmit('DRAFT')} style={{ width: '100%' }}>
                <Save size={16} /> Save Draft
              </Button>
              <Button variant="primary" onClick={() => handleSubmit('SUBMITTED')} style={{ width: '100%', marginTop: '0.75rem' }}>
                <Send size={16} /> Submit Quotation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
