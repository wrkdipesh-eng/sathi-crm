import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

function checkDirector(authUser: any) {
  return authUser && (authUser.role === Role.DIRECTOR || authUser.role === Role.SUPERADMIN);
}

// PATCH: Rename a branch
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, branchCommissionSplit } = body;

    if (!name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: { 
        name,
        branchCommissionSplit: branchCommissionSplit !== undefined ? (branchCommissionSplit !== '' ? parseFloat(branchCommissionSplit) : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, branch: updated });
  } catch (error: any) {
    console.error('Update branch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a branch (checks if empty first)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const { id } = params;

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Check if branch has users or applicants assigned
    const userCount = await prisma.user.count({ where: { branchId: id } });
    const applicantCount = await prisma.applicant.count({ where: { branchId: id } });

    if (userCount > 0 || applicantCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete branch: ${userCount} staff member(s) and ${applicantCount} applicant(s) are currently assigned here. Please reassign them first.` 
      }, { status: 400 });
    }

    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    console.error('Delete branch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
