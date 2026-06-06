import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role, VendorStatus } from '@prisma/client';

/**
 * GET /api/vendors/[id]
 * Retrieves a single vendor's details.
 */
export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract ID from URL
  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').pop() || '';

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
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

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Role check: Admin/PO/Manager can view all. Vendor can only view their own profile.
    const { role, id: userId } = req.auth.user;
    if (
      role !== Role.ADMIN &&
      role !== Role.PROCUREMENT_OFFICER &&
      role !== Role.MANAGER &&
      vendor.userId !== userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(vendor);
  } catch (error: any) {
    console.error(`❌ GET /api/vendors/${id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor details' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/vendors/[id]
 * Updates a vendor's details.
 */
export const PUT = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').pop() || '';

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Role check: Admin/PO can edit any. Vendor can only edit their own.
    const { role, id: userId } = req.auth.user;
    const isOwner = vendor.userId === userId;
    const isStaff = role === Role.ADMIN || role === Role.PROCUREMENT_OFFICER;

    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      companyName,
      contactPerson,
      phone,
      address,
      city,
      state,
      category,
      status,
      rating,
    } = body;

    // Build update payload
    const data: any = {};
    if (companyName) data.companyName = companyName;
    if (contactPerson) data.contactPerson = contactPerson;
    if (phone) data.phone = phone;
    if (address) data.address = address;
    if (city) data.city = city;
    if (state) data.state = state;
    if (category) data.category = category;

    // Staff-only fields
    if (isStaff) {
      if (status && Object.values(VendorStatus).includes(status as VendorStatus)) {
        data.status = status as VendorStatus;
      }
      if (typeof rating === 'number') {
        data.rating = rating;
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data,
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId: req.auth.user.id,
        entityType: 'VENDOR',
        entityId: id,
        action: 'UPDATED',
        details: `Vendor ${updatedVendor.companyName} profile updated.`,
        category: 'Vendors',
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error: any) {
    console.error(`❌ PUT /api/vendors/${id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update vendor details' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/vendors/[id]
 * Deletes a vendor profile.
 * Roles allowed: ADMIN, PROCUREMENT_OFFICER
 */
export const DELETE = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role !== Role.ADMIN && role !== Role.PROCUREMENT_OFFICER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pathname = new URL(req.url).pathname;
  const id = pathname.split('/').pop() || '';

  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    await prisma.vendor.delete({
      where: { id },
    });

    // Write activity log
    await prisma.activityLog.create({
      data: {
        userId: req.auth.user.id,
        entityType: 'VENDOR',
        entityId: id,
        action: 'DELETED',
        details: `Vendor ${vendor.companyName} deleted from system.`,
        category: 'Vendors',
      },
    });

    return NextResponse.json({ message: 'Vendor profile deleted successfully' });
  } catch (error: any) {
    console.error(`❌ DELETE /api/vendors/${id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete vendor profile' },
      { status: 500 }
    );
  }
});
