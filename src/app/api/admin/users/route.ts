import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Enforce Director or Superadmin role check for all admin routes
function checkAdminAccess(authUser: any) {
  return authUser && (authUser.role === Role.DIRECTOR || authUser.role === Role.SUPERADMIN);
}

// GET: List all users in the organization
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkAdminAccess(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: authUser!.organizationId },
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Strip password hashes from response
    const safeUsers = users.map(u => {
      const { passwordHash, ...safe } = u;
      return safe;
    });

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error: any) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new user (Counselor, Branch Manager, Sub-agent, etc.)
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkAdminAccess(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, branchId, subAgentCommissionSplit, permissions } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email address already registered' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        organizationId: authUser!.organizationId,
        branchId: role !== Role.DIRECTOR && role !== Role.SUPERADMIN && role !== Role.SUB_AGENT ? (branchId || null) : null,
        subAgentCommissionSplit: role === Role.SUB_AGENT ? parseFloat(subAgentCommissionSplit || '0.40') : null,
        permissions: permissions || {},
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error('Create admin user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
