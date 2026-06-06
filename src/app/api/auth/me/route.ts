import { NextResponse } from 'next/server';
import { auth, clearSessionCache } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: req.auth.user.id,
    name: req.auth.user.name,
    email: req.auth.user.email,
    role: req.auth.user.role,
    image: req.auth.user.image,
  });
});

export const POST = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role } = await req.json();
    if (!role || !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.auth.user.id },
      data: { role: role as Role },
    });

    // Clear session cache for this user
    clearSessionCache(req.auth.user.id);

    return NextResponse.json({
      success: true,
      role: updatedUser.role,
    });
  } catch (e) {
    console.error('Error updating user role:', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
});
