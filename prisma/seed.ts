import { PrismaClient, Role, VendorStatus, RfqStatus, QuotationStatus, ApprovalStatus, PoStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rfqAttachment.deleteMany({});
  await prisma.rfqVendor.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rfq.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 2. Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const officerPassword = await bcrypt.hash('officer123', salt);
  const managerPassword = await bcrypt.hash('manager123', salt);
  const vendorPassword = await bcrypt.hash('vendor123', salt);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vendorbridge.com',
      firstName: 'Anand',
      lastName: 'Vadgama',
      phone: '+91 98765 43210',
      password: adminPassword,
      role: Role.ADMIN,
      country: 'India',
      additionalInfo: 'System Administrator',
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: 'officer@vendorbridge.com',
      firstName: 'Vikram',
      lastName: 'Singh',
      phone: '+91 98765 43211',
      password: officerPassword,
      role: Role.PROCUREMENT_OFFICER,
      country: 'India',
      additionalInfo: 'Senior Procurement Officer',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@vendorbridge.com',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91 98765 43212',
      password: managerPassword,
      role: Role.MANAGER,
      country: 'India',
      additionalInfo: 'Finance & Operations Manager',
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@vendorbridge.com',
      firstName: 'Amit',
      lastName: 'Sharma',
      phone: '+91 98765 43213',
      password: vendorPassword,
      role: Role.VENDOR,
      country: 'India',
      additionalInfo: 'Vendor Representative',
    },
  });

  console.log('👤 Created demo users (Admin, Officer, Manager, Vendor).');

  // 4. Create Vendors (Populate all statuses: ACTIVE, PENDING, IN_REVIEW, BLOCKED)
  const vendorInfra = await prisma.vendor.create({
    data: {
      companyName: 'Infra Supplies Pvt Ltd',
      contactPerson: 'Amit Sharma',
      email: 'vendor@vendorbridge.com', // Linked to vendor user
      phone: '+91 98765 43213',
      gstNumber: '27AAAAA1111A1Z1',
      address: '101, Industrial Area Phase II',
      city: 'Mumbai',
      state: 'Maharashtra',
      category: 'Furniture & Office Supplies',
      status: VendorStatus.ACTIVE,
      rating: 4.8,
      userId: vendorUser.id,
    },
  });

  const vendorTech = await prisma.vendor.create({
    data: {
      companyName: 'TechCore Ltd',
      contactPerson: 'Sarah Connor',
      email: 'sarah@techcore.com',
      phone: '+91 99999 88888',
      gstNumber: '07BBBBB2222B2Z2',
      address: '404, Tech Park, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      category: 'IT Hardware',
      status: VendorStatus.ACTIVE,
      rating: 4.9,
    },
  });

  const vendorFastLog = await prisma.vendor.create({
    data: {
      companyName: 'FastLog Services',
      contactPerson: 'Bruce Wayne',
      email: 'bruce@fastlog.com',
      phone: '+91 77777 66666',
      gstNumber: '24CCCCC3333C3Z3',
      address: 'Wayne Manor, Gotham Rd',
      city: 'Gandhinagar',
      state: 'Gujarat',
      category: 'Logistics & Transport',
      status: VendorStatus.ACTIVE,
      rating: 4.5,
    },
  });

  const vendorPaper = await prisma.vendor.create({
    data: {
      companyName: 'PaperCo Ltd',
      contactPerson: 'Clark Kent',
      email: 'clark@paperco.com',
      phone: '+91 55555 44444',
      gstNumber: '29DDDDD4444D4Z4',
      address: 'Daily Planet Ave',
      city: 'Bengaluru',
      state: 'Karnataka',
      category: 'Stationery',
      status: VendorStatus.PENDING,
      rating: 3.5,
    },
  });

  const vendorGlass = await prisma.vendor.create({
    data: {
      companyName: 'Glass & Glaze Co',
      contactPerson: 'Peter Parker',
      email: 'peter@glassglaze.com',
      phone: '+91 44444 33333',
      gstNumber: '27GGGGG5555G5Z5',
      address: 'Queens Blvd',
      city: 'Mumbai',
      state: 'Maharashtra',
      category: 'Glassmorphism Fittings',
      status: VendorStatus.IN_REVIEW,
      rating: 4.0,
    },
  });

  const vendorBlocked = await prisma.vendor.create({
    data: {
      companyName: 'Bad Quality Corp',
      contactPerson: 'Lex Luthor',
      email: 'lex@badquality.com',
      phone: '+91 11111 22222',
      gstNumber: '19LLLLL0000L0Z0',
      address: 'LexCorp Towers',
      city: 'Kolkata',
      state: 'West Bengal',
      category: 'Cheap Plastic Goods',
      status: VendorStatus.BLOCKED,
      rating: 1.5,
    },
  });

  console.log('🏢 Created demo vendors.');

  // 5. Create RFQs (Populate all statuses: DRAFT, OPEN, CLOSED, CANCELLED)
  const rfqFurniture = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2025-001',
      title: 'Office Furniture Procurement Q2',
      description: 'Request for ergonomic office chairs and motorized standing desks for our Mumbai HQ expansion.',
      category: 'Furniture & Office Supplies',
      status: RfqStatus.OPEN,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      currentStep: 3,
      createdById: officer.id,
    },
  });

  const rfqLaptops = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2025-002',
      title: 'Laptops for Development Team',
      description: 'Request for high-performance developer laptops.',
      category: 'IT Hardware',
      status: RfqStatus.OPEN,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      currentStep: 3,
      createdById: officer.id,
    },
  });

  const rfqDraft = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2025-003',
      title: 'Annual Logistics & Delivery Contract',
      description: 'Draft request for logistics services.',
      category: 'Logistics & Transport',
      status: RfqStatus.DRAFT,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      currentStep: 1,
      createdById: officer.id,
    },
  });

  const rfqClosed = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2025-004',
      title: 'Quarterly Printing Paper Supply',
      description: 'Completed printing paper supply for all branches.',
      category: 'Stationery',
      status: RfqStatus.CLOSED,
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Passed deadline
      currentStep: 3,
      createdById: officer.id,
    },
  });

  const rfqCancelled = await prisma.rfq.create({
    data: {
      rfqNumber: 'RFQ-2025-005',
      title: 'Old Servers Replacements Plan',
      description: 'Cancelled Server hardware request.',
      category: 'IT Hardware',
      status: RfqStatus.CANCELLED,
      deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      currentStep: 3,
      createdById: officer.id,
    },
  });

  console.log('📄 Created RFQs.');

  // 6. Create RFQ Items
  const itemChair = await prisma.rfqItem.create({
    data: {
      rfqId: rfqFurniture.id,
      productName: 'Ergonomic Office Chairs',
      description: 'High-back mesh chairs with lumbar support and 3D armrests.',
      quantity: 50,
      unit: 'Units',
    },
  });

  const itemDesk = await prisma.rfqItem.create({
    data: {
      rfqId: rfqFurniture.id,
      productName: 'Standing Desks',
      description: 'Motorized dual-motor height adjustable desks (120x60cm).',
      quantity: 20,
      unit: 'Units',
    },
  });

  const itemMacbook = await prisma.rfqItem.create({
    data: {
      rfqId: rfqLaptops.id,
      productName: 'MacBook Pro 16-inch M3 Pro',
      description: '36GB Unified Memory, 512GB SSD, Space Black.',
      quantity: 10,
      unit: 'Units',
    },
  });

  const itemPaper = await prisma.rfqItem.create({
    data: {
      rfqId: rfqClosed.id,
      productName: 'A4 Copier Paper Reams',
      description: '75 GSM A4 copier paper reams.',
      quantity: 500,
      unit: 'Reams',
    },
  });

  console.log('📦 Created RFQ Items.');

  // 7. Invite Vendors to RFQs
  await prisma.rfqVendor.createMany({
    data: [
      { rfqId: rfqFurniture.id, vendorId: vendorInfra.id, invited: true },
      { rfqId: rfqFurniture.id, vendorId: vendorPaper.id, invited: true },
      { rfqId: rfqLaptops.id, vendorId: vendorTech.id, invited: true },
      { rfqId: rfqClosed.id, vendorId: vendorPaper.id, invited: true },
    ],
  });

  console.log('🔗 Invited vendors to RFQs.');

  // 8. Create Quotations (SUBMITTED, ACCEPTED, REJECTED, DRAFT)
  const quotationInfra = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-001',
      rfqId: rfqFurniture.id,
      vendorId: vendorInfra.id,
      subtotal: 900000.0,
      taxPercent: 18.0,
      taxAmount: 162000.0,
      discount: 50000.0,
      grandTotal: 1012000.0,
      deliveryDays: 7,
      paymentTerms: '30 days net',
      warranty: '3 years onsite warranty',
      notes: 'Special bulk discount of ₹50,000 applied. Standard shipping included.',
      status: QuotationStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotationInfra.id,
      rfqItemId: itemChair.id,
      unitPrice: 8000.0,
      totalPrice: 400000.0,
      deliveryDays: 5,
      remarks: 'Model: AeroComfort V2',
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotationInfra.id,
      rfqItemId: itemDesk.id,
      unitPrice: 25000.0,
      totalPrice: 500000.0,
      deliveryDays: 7,
      remarks: 'Model: RiseUp Dual',
    },
  });

  // Quotation 2: Accepted laptop quotation
  const quotationTech = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-002',
      rfqId: rfqLaptops.id,
      vendorId: vendorTech.id,
      subtotal: 1500000.0,
      taxPercent: 18.0,
      taxAmount: 270000.0,
      discount: 100000.0,
      grandTotal: 1670000.0,
      deliveryDays: 5,
      paymentTerms: '15 days net',
      warranty: '1 year Apple India warranty',
      notes: 'Corporate discount applied. Ready stock available.',
      status: QuotationStatus.ACCEPTED,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotationTech.id,
      rfqItemId: itemMacbook.id,
      unitPrice: 150000.0,
      totalPrice: 1500000.0,
      deliveryDays: 5,
      remarks: 'Model: Apple MacBook Pro 16-inch M3 Pro',
    },
  });

  // Quotation 3: Rejected Paper quotation
  const quotationPaper = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-003',
      rfqId: rfqClosed.id,
      vendorId: vendorPaper.id,
      subtotal: 100000.0,
      taxPercent: 12.0,
      taxAmount: 12000.0,
      discount: 0.0,
      grandTotal: 112000.0,
      deliveryDays: 3,
      paymentTerms: 'COD',
      warranty: 'No warranty on paper products',
      status: QuotationStatus.REJECTED,
      submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.quotationItem.create({
    data: {
      quotationId: quotationPaper.id,
      rfqItemId: itemPaper.id,
      unitPrice: 200.0,
      totalPrice: 100000.0,
      deliveryDays: 3,
      remarks: 'Model: PaperCo HighWhite Reams',
    },
  });

  // Quotation 4: Draft Quotation for Logistics
  const quotationDraft = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-004',
      rfqId: rfqDraft.id,
      vendorId: vendorFastLog.id,
      subtotal: 75000.0,
      taxPercent: 18.0,
      taxAmount: 13500.0,
      discount: 5000.0,
      grandTotal: 83500.0,
      deliveryDays: 2,
      paymentTerms: 'Immediate payment',
      warranty: 'Service guarantee SLA 99%',
      status: QuotationStatus.DRAFT,
    },
  });

  console.log('💰 Created dynamic Quotations (Submitted, Accepted, Rejected, Draft).');

  // 9. Create Approval Workflow records (PENDING, APPROVED, REJECTED)
  const approval = await prisma.approval.create({
    data: {
      quotationId: quotationInfra.id,
      requestedById: officer.id,
      approverId: manager.id,
      status: ApprovalStatus.PENDING,
      currentStep: 2,
      totalSteps: 3,
      remarks: 'Pricing is very competitive and includes 3 years warranty.',
    },
  });

  const approvalApproved = await prisma.approval.create({
    data: {
      quotationId: quotationTech.id,
      requestedById: officer.id,
      approverId: manager.id,
      status: ApprovalStatus.APPROVED,
      currentStep: 3,
      totalSteps: 3,
      remarks: 'Approved. Desktops needed urgently.',
      decidedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const approvalRejected = await prisma.approval.create({
    data: {
      quotationId: quotationPaper.id,
      requestedById: officer.id,
      approverId: manager.id,
      status: ApprovalStatus.REJECTED,
      currentStep: 2,
      totalSteps: 3,
      remarks: 'Rejected: Rates are higher than market average.',
      decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('⚖️ Created dynamic Quotation Approvals.');

  // 10. Create Purchase Orders (ISSUED, COMPLETED, CANCELLED)
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2025-001',
      quotationId: quotationTech.id,
      vendorId: vendorTech.id,
      buyerName: 'VendorBridge Corp HQ',
      buyerAddress: '909, Enterprise Tower, BKC, Mumbai, Maharashtra - 400051',
      buyerGstin: '27AABCDE1234F1Z0',
      subtotal: 1400000.0,
      cgstRate: 9.0,
      cgstAmount: 126000.0,
      sgstRate: 9.0,
      sgstAmount: 126000.0,
      grandTotal: 1652000.0,
      status: PoStatus.ISSUED,
      poDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const purchaseOrderCompleted = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2025-002',
      quotationId: quotationTech.id,
      vendorId: vendorTech.id,
      buyerName: 'VendorBridge Office expansion',
      buyerAddress: '101, Industrial Area Phase II, Mumbai',
      buyerGstin: '27AABCDE1234F1Z0',
      subtotal: 1500000.0,
      cgstRate: 9.0,
      cgstAmount: 135000.0,
      sgstRate: 9.0,
      sgstAmount: 135000.0,
      grandTotal: 1770000.0,
      status: PoStatus.COMPLETED,
      poDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  });

  const purchaseOrderCancelled = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2025-003',
      quotationId: quotationPaper.id,
      vendorId: vendorPaper.id,
      buyerName: 'VendorBridge Corp HQ',
      buyerAddress: '909, Enterprise Tower, BKC, Mumbai',
      buyerGstin: '27AABCDE1234F1Z0',
      subtotal: 100000.0,
      cgstRate: 6.0,
      cgstAmount: 6000.0,
      sgstRate: 6.0,
      sgstAmount: 6000.0,
      grandTotal: 112000.0,
      status: PoStatus.CANCELLED,
      poDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('📦 Created dynamic Purchase Orders.');

  // 11. Create Invoices (PENDING_PAYMENT, PAID, OVERDUE)
  const invoicePending = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-001',
      purchaseOrderId: purchaseOrder.id,
      vendorId: vendorTech.id,
      subtotal: 1400000.0,
      cgst: 126000.0,
      sgst: 126000.0,
      grandTotal: 1652000.0,
      status: InvoiceStatus.PENDING_PAYMENT,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const invoicePaid = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-002',
      purchaseOrderId: purchaseOrderCompleted.id,
      vendorId: vendorTech.id,
      subtotal: 1500000.0,
      cgst: 135000.0,
      sgst: 135000.0,
      grandTotal: 1770000.0,
      status: InvoiceStatus.PAID,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
    },
  });

  const invoiceOverdue = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2025-003',
      purchaseOrderId: purchaseOrder.id,
      vendorId: vendorTech.id,
      subtotal: 50000.0,
      cgst: 4500.0,
      sgst: 4500.0,
      grandTotal: 59000.0,
      status: InvoiceStatus.OVERDUE,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('🧾 Created dynamic Invoices.');

  // 12. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: officer.id,
        entityType: 'RFQ',
        entityId: rfqFurniture.id,
        action: 'CREATED',
        details: 'RFQ Office Furniture Procurement Q2 created.',
        category: 'RFQs',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        userId: vendorUser.id,
        entityType: 'QUOTATION',
        entityId: quotationInfra.id,
        action: 'SUBMITTED',
        details: 'Quotation QTN-2025-001 submitted by Infra Supplies.',
        category: 'Quotations',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        userId: officer.id,
        entityType: 'APPROVAL',
        entityId: approval.id,
        action: 'REQUESTED',
        details: 'Approval workflow initiated for QTN-2025-001.',
        category: 'Approvals',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        userId: officer.id,
        entityType: 'RFQ',
        entityId: rfqLaptops.id,
        action: 'CREATED',
        details: 'RFQ Laptops for Development Team created.',
        category: 'RFQs',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: manager.id,
        entityType: 'APPROVAL',
        entityId: approvalApproved.id,
        action: 'APPROVED',
        details: 'Quotation QTN-2025-002 has been approved by Rajesh Kumar.',
        category: 'Approvals',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: officer.id,
        entityType: 'PO',
        entityId: purchaseOrder.id,
        action: 'ISSUED',
        details: 'Purchase Order PO-2025-001 generated and issued to TechCore Ltd.',
        category: 'Invoices',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 13. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: officer.id,
        title: 'New Quotation Received',
        message: 'Infra Supplies submitted quotation for Office Furniture.',
        link: `/rfqs/${rfqFurniture.id}/compare`,
      },
      {
        userId: manager.id,
        title: 'Pending Quotation Approval',
        message: 'Approval requested for Office Furniture Quotation.',
        link: `/approvals/${approval.id}`,
      },
      {
        userId: officer.id,
        title: 'PO Approved & Signed',
        message: 'Rajesh Kumar approved laptop hardware requisition.',
        link: `/purchase-orders/${purchaseOrder.id}`,
      },
    ],
  });

  console.log('🔔 Seeding activity logs and notifications.');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
