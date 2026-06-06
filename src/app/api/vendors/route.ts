import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, VendorStatus } from '@prisma/client';

/**
 * GET /api/vendors
 * Retrieves a list of vendors with optional search and status filtering.
 * Roles allowed: ADMIN, PROCUREMENT_OFFICER, MANAGER
 */
export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER && role !== Role.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // e.g. ACTIVE, PENDING, IN_REVIEW, BLOCKED

    // Construct Prisma query filters
    const where: any = {};

    if (status && status !== 'ALL') {
      if (Object.values(VendorStatus).includes(status as VendorStatus)) {
        where.status = status as VendorStatus;
      }
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(vendors);
  } catch (error: any) {
    console.error('❌ GET /api/vendors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors from database' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/vendors
 * Creates a new vendor.
 * Roles allowed: ADMIN, PROCUREMENT_OFFICER
 */
export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      gstNumber,
      address,
      city,
      state,
      category,
      status,
    } = body;

    // Validation
    if (!companyName || !contactPerson || !email || !phone || !gstNumber || !address || !city || !state || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine status (default to PENDING)
    let vendorStatus = VendorStatus.PENDING;
    if (status && Object.values(VendorStatus).includes(status as VendorStatus)) {
      vendorStatus = status as VendorStatus;
    }

    // Check if a user account exists with this email to link them
    const associatedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const vendor = await prisma.vendor.create({
      data: {
        companyName,
        contactPerson,
        email: email.toLowerCase(),
        phone,
        gstNumber,
        address,
        city,
        state,
        category,
        status: vendorStatus,
        userId: associatedUser?.id || null, // Link if matching email exists
      },
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId: req.auth.user.id,
        entityType: 'VENDOR',
        entityId: vendor.id,
        action: 'CREATED',
        details: `Vendor ${companyName} created in the system.`,
        category: 'Vendors',
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/vendors error:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor in database' },
      { status: 500 }
    );
  }
});
