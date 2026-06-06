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

  // 4. Create Vendors
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

  console.log('🏢 Created demo vendors.');

  // 5. Create RFQs
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

  console.log('📦 Created RFQ Items.');

  // 7. Invite Vendors to RFQs
  await prisma.rfqVendor.createMany({
    data: [
      { rfqId: rfqFurniture.id, vendorId: vendorInfra.id, invited: true },
      { rfqId: rfqFurniture.id, vendorId: vendorPaper.id, invited: true },
      { rfqId: rfqLaptops.id, vendorId: vendorTech.id, invited: true },
    ],
  });

  console.log('🔗 Invited vendors to RFQs.');

  // 8. Create Quotations
  const quotationInfra = await prisma.quotation.create({
    data: {
      quotationNumber: 'QTN-2025-001',
      rfqId: rfqFurniture.id,
      vendorId: vendorInfra.id,
      subtotal: 900000.0,
      taxPercent: 18.0,
      taxAmount: 162000.0,
      discount: 50000.0,
      grandTotal: 1012000.0, // Subtotal - Discount + Tax
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

  console.log('💰 Created Quotation for Office Furniture.');

  // 9. Create Approval workflow
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

  console.log('⚖️ Created Quotation Approval Request.');

  // 10. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: officer.id,
        entityType: 'RFQ',
        entityId: rfqFurniture.id,
        action: 'CREATED',
        details: 'RFQ Office Furniture Procurement Q2 created.',
        category: 'RFQs',
      },
      {
        userId: vendorUser.id,
        entityType: 'QUOTATION',
        entityId: quotationInfra.id,
        action: 'SUBMITTED',
        details: 'Quotation QTN-2025-001 submitted by Infra Supplies.',
        category: 'Quotations',
      },
      {
        userId: officer.id,
        entityType: 'APPROVAL',
        entityId: approval.id,
        action: 'REQUESTED',
        details: 'Approval workflow initiated for QTN-2025-001.',
        category: 'Approvals',
      },
    ],
  });

  // 11. Create Notifications
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
