import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

function checkAdminAccess(authUser: any) {
  return authUser && (authUser.role === Role.DIRECTOR || authUser.role === Role.SUPERADMIN);
}

// PATCH: Update user profile
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!checkAdminAccess(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, password, role, branchId, subAgentCommissionSplit, permissions } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Check email collision
      const collision = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (collision) {
        return NextResponse.json({ error: 'Email address already in use' }, { status: 400 });
      }
      updateData.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }
    if (role) {
      if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }

    // Branch assignment logic
    if (branchId !== undefined) {
      updateData.branchId = role !== Role.DIRECTOR && role !== Role.SUPERADMIN && role !== Role.SUB_AGENT ? (branchId || null) : null;
    }

    // Sub-agent splits
    if (subAgentCommissionSplit !== undefined) {
      updateData.subAgentCommissionSplit = role === Role.SUB_AGENT ? parseFloat(subAgentCommissionSplit) : null;
    }

    // Permissions
    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error('Update admin user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a user from the registry
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!checkAdminAccess(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 });
    }

    const { id } = params;

    // Prevent deleting oneself
    if (id === authUser!.userId) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    // Verify user belongs to same org
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete admin user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
