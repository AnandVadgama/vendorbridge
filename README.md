# 🌉 VendorBridge ERP

> **VendorBridge** is a premium B2B Procurement and Vendor Management Enterprise Resource Planning (ERP) platform. It is engineered to bridge the operational gap between organizational procurement departments, managers, and external vendors through a seamless, automated, and audit-ready workflow.

---

## 🚀 Technical Highlights & Features

- **🎨 Multi-Theme System**: Instantly switch between **Dark Navy (Midnight)** and **Light (Clean Silver)** modes with zero flash-on-load.
- **✨ Premium Typography**: Global font stack featuring **Geist** for crisp visual displays and body text.
- **🔐 Custom Clerk Session Wrapper**: Integrated Clerk v7 auth coupled with a PostgreSQL database layer, leveraging cached session providers for lightning-fast access control.
- **⚡ Hot-Swap Role Selector**: An interactive identity selector in the dashboard Topbar allows reviewers to transition between roles seamlessly with instant cache-invalidation.
- **📊 Real-time Analytics & Reporting**: Rich visuals built with Recharts detailing procurement budgets, purchase statuses, and active vendor statistics.
- **📈 Complete Activity Logger**: Tracks user activities across RFQs, Purchase Orders, and Invoices for end-to-end audits.
- **🔔 Live Notifications**: Keeps users informed about RFQ status updates, manager approvals, and invoice status transitions.

---

## 🔄 Core Procurement Workflow

```mermaid
graph TD
    A[Procurement Officer] -->|1. Creates RFQ| B(Open RFQ)
    B -->|2. Invites Vendors| C[Vendors]
    C -->|3. Submits Quotation| D(Quotation Review)
    A -->|4. Compares & Selects| E(Procurement Request)
    E -->|5. Submits for Approval| F[Manager / Approver]
    F -->|6a. Approved| G(Approved Quotation)
    F -->|6b. Rejected| H(RFQ Status Updated)
    G -->|7. Generates PO| I[Purchase Order]
    I -->|8. Delivers Goods/Services| J[Invoice Generated]
    C -->|9. Submits Invoice| K[Payment Processed]
```

---

## 👥 Roles & Capabilities

The ERP enforces strict role-based access control (RBAC) supporting the following roles:

### 📋 1. Procurement Officer
*The operator of the purchasing department. Drives active procurement runs.*
* **Create RFQs**: Define items, quantities, deadlines, and attach technical specifications.
* **Compare Quotations**: Side-by-side graphical and tabular comparison of vendor bids (by price, delivery terms, and rating).
* **Generate Purchase Orders**: Create binding Purchase Orders from accepted, approved vendor quotations.
* **Generate Invoices**: Keep track of financial commitments and draft invoice requirements.
* **Routes**: [`/rfqs`](/rfqs), [`/quotations`](/quotations), [`/purchase-orders`](/purchase-orders)

### 🤝 2. Vendor
*External partners supplying goods or services.*
* **Submit Quotations**: Quote unit prices, lead times, warranties, and payment terms against open RFQs.
* **Track RFQ Status**: Stay updated on invited RFQs and the status of submitted bids.
* **View Purchase Orders**: Receive and accept formal purchase orders issued by the organization.
* **Routes**: [`/quotations`](/quotations), [`/purchase-orders`](/purchase-orders), [`/invoices`](/invoices)

### ⚖️ 3. Manager / Approver
*The operational gatekeeper of budgets and policy compliance.*
* **Approve / Reject Requests**: View detailed quotes and click to approve/reject procurement requisitions.
* **Monitor Workflows**: Oversee pending approvals, logs, and vendor performance history.
* **Routes**: [`/approvals`](/approvals), [`/activity`](/activity)

### 🔑 4. Admin
*System administrator managing platform resources.*
* **Manage Users**: Control access, activate/deactivate accounts, and edit profiles.
* **Manage Vendors**: Review pending vendor onboarding applications, approve vendors, and monitor quality scores.
* **View Procurement Analytics**: High-level spending insights, category distributions, and vendor rating averages.
* **Routes**: [`/vendors`](/vendors), [`/reports`](/reports), [`/activity`](/activity)

---

## 🔑 Fast Access Credentials

To review the workflows, you can use the **automatic dropdown switcher** in the Topbar once signed in, or log in directly using these pre-seeded sandbox accounts:

| Role | Email | Password | Primary Action Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@vendorbridge.com` | `admin123` | Analytics Reports, Vendor Approvals |
| **Procurement Officer** | `officer@vendorbridge.com` | `officer123` | Create RFQs, Compare Quotations, Issue POs |
| **Manager / Approver** | `manager@vendorbridge.com` | `manager123` | Approve/Reject Requisitions |
| **Vendor** | `vendor@vendorbridge.com` | `vendor123` | Submit Quotations, Track RFQs, View POs |

---

## 🛠️ Project Stack & Architecture

- **Frontend**: Next.js 16 (App Router), Vanilla CSS, CSS Modules, Lucide React, Recharts.
- **Backend/ORM**: Prisma ORM, TSX (Seeding/Script Runner).
- **Database**: PostgreSQL (Docker-ready).
- **Authentication**: Clerk Authentication (with custom sync to PostgreSQL user schema).

---

## ⚙️ Local Development Setup

Follow these steps to run the VendorBridge portal locally:

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd vendorbridge
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and define the following environment variables (reference `.env.example`):
```ini
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/vendorbridge?schema=public"

# NextAuth Configuration (Legacy/Fallback)
AUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"

# Clerk Auth Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### 3. Spin Up Postgres & Apply Schema
If you use the included `docker-compose.yml` to run Postgres:
```bash
# Start Docker Container
docker compose up -d

# Sync Database Schema with Prisma
npx prisma db push
```

### 4. Seed Database
Execute the custom seeding script to populate sandbox ERP data:
```bash
npx prisma db seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Development Git Workflow

For merging functional feature branches back into production:

1. **Stash & Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: implement visual enhancements and user onboarding"
   ```
2. **Switch to main and Pull Latest**:
   ```bash
   git checkout main
   git pull origin main
   ```
3. **Merge develop into main**:
   ```bash
   git merge develop
   ```
4. **Push Up to GitHub**:
   ```bash
   git push origin main
   ```