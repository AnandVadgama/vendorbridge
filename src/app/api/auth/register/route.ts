import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      country,
      additionalInfo,
      photo,
    } = body;

    // 1. Basic validation
    if (!firstName || !lastName || !email || !password || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Determine user role from input (default to PROCUREMENT_OFFICER)
    let userRole = Role.PROCUREMENT_OFFICER;
    if (Object.values(Role).includes(role as Role)) {
      userRole = role as Role;
    }

    // 5. Create user record
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        role: userRole,
        country,
        additionalInfo: additionalInfo || null,
        photo: photo || null,
        isActive: true,
      },
    });

    // 6. Return success (excluding password)
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Registration API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred during registration' },
      { status: 500 }
    );
  }
}
