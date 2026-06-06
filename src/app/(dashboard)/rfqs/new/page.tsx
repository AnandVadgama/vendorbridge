'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Badge } from '@/components/ui/Badge/Badge';
import { Upload, Plus, Trash2, ArrowLeft, ArrowRight, Save, Check } from 'lucide-react';
import styles from './new.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Vendor {
  id: string;
  companyName: string;
  category: string;
  email: string;
}

export default function NewRfqPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { data: vendors = [] } = useSWR<Vendor[]>('/api/vendors', fetcher);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  
  // Line Items State
  const [items, setItems] = useState<Array<{ productName: string; quantity: number; unit: string }>>([
    { productName: '', quantity: 1, unit: 'Units' }
  ]);

  // Invited Vendors State (Selected vendor IDs)
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  
  // Mock file list for demonstration
  const [attachments, setAttachments] = useState<string[]>([]);

  // Navigation helpers
  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: 1, unit: 'Units' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleToggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const handleSubmit = async (status: 'DRAFT' | 'OPEN') => {
    if (!title || !category || !deadline) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          deadline,
          description,
          items: items.filter(item => item.productName),
          vendors: selectedVendors,
          attachments,
          status,
        }),
      });

      if (!res.ok) throw new Error('Failed to create RFQ');
      
      router.push('/rfqs');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Error creating RFQ');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Create RFQ's"
        description="Issue a new Request for Quotation to system vendors."
      />

      {/* Wizard Stepper */}
      <div className={styles.stepperContainer}>
        {[1, 2, 3].map((num) => (
          <div key={num} className={`${styles.stepNode} ${step >= num ? styles.activeStep : ''}`}>
            <div className={styles.stepCircle}>{num}</div>
            <span className={styles.stepLabel}>
              {num === 1 ? 'RFQ Details' : num === 2 ? 'Select Vendors' : 'Attachments'}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.layoutGrid}>
        {/* Step Cards */}
        <div className={styles.formPanel}>
          {step === 1 && (
            <Card title="Step 1: RFQ Details" className={styles.card}>
              <div className={styles.formGroup}>
                <label>RFQ Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office Furniture Procurement Q2" />
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select Category</option>
                    <option value="Furniture">Furniture</option>
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Deadline *</label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Scope of Work / Description</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide scope guidelines, requirements, or terms..."
                />
              </div>

              {/* Dynamic Line Items */}
              <div className={styles.sectionHeader}>
                <h4>Requested Line Items</h4>
                <Button type="button" variant="secondary" onClick={handleAddItem}>
                  <Plus size={16} /> Add Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <Input
                    placeholder="Product Name"
                    value={item.productName}
                    onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                    style={{ flex: 3 }}
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10))}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="Unit (e.g. Pcs, Box)"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    style={{ flex: 1.2 }}
                  />
                  {items.length > 1 && (
                    <button type="button" className={styles.deleteBtn} onClick={() => handleRemoveItem(idx)}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </Card>
          )}

          {step === 2 && (
            <Card title="Step 2: Invite Vendors" className={styles.card}>
              <p className={styles.instructions}>Select the suppliers you would like to invite to submit quotation quotes.</p>
              <div className={styles.vendorList}>
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className={`${styles.vendorItem} ${selectedVendors.includes(vendor.id) ? styles.selectedVendor : ''}`}
                    onClick={() => handleToggleVendor(vendor.id)}
                  >
                    <div className={styles.vendorCheck}>
                      {selectedVendors.includes(vendor.id) ? <Check size={16} /> : null}
                    </div>
                    <div className={styles.vendorDetails}>
                      <span className={styles.vendorName}>{vendor.companyName}</span>
                      <Badge variant="info">{vendor.category}</Badge>
                    </div>
                  </div>
                ))}
                {vendors.length === 0 && <p className={styles.noData}>No vendors found. Please add vendors first.</p>}
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card title="Step 3: Upload Attachments" className={styles.card}>
              <div className={styles.dropzone}>
                <Upload size={40} className={styles.uploadIcon} />
                <p>Drag and drop files here, or click to upload</p>
                <span className={styles.subtext}>Supports: PDF, DOCX, XLSX (Max 10MB)</span>
              </div>
              <div className={styles.actionsRow}>
                <Button variant="secondary" onClick={() => handleSubmit('DRAFT')}>
                  <Save size={16} /> Save as Draft
                </Button>
                <Button variant="primary" onClick={() => handleSubmit('OPEN')}>
                  <Check size={16} /> Save & Submit
                </Button>
              </div>
            </Card>
          )}

          {/* Stepper Navigation Actions */}
          <div className={styles.navigationRow}>
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                <ArrowLeft size={16} /> Previous Step
              </Button>
            )}
            {step < 3 && (
              <Button type="button" variant="primary" onClick={nextStep} style={{ marginLeft: 'auto' }}>
                Next Step <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel Summary Detail Drawer */}
        <div className={styles.summaryPanel}>
          <Card title="RFQ Summary Info" className={styles.summaryCard}>
            <div className={styles.summaryItem}>
              <strong>Title:</strong>
              <span>{title || 'Untitled RFQ'}</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>Category:</strong>
              <span>{category || 'Not selected'}</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>Deadline:</strong>
              <span>{deadline || 'Not set'}</span>
            </div>
            <hr className={styles.divider} />
            <div className={styles.summaryItem}>
              <strong>Invited Vendors:</strong>
              <span>{selectedVendors.length} vendors selected</span>
            </div>
            <div className={styles.summaryItem}>
              <strong>Items Count:</strong>
              <span>{items.filter((item) => item.productName).length} items added</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
