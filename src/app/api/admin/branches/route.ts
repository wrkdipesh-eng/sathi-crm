import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

function checkDirector(authUser: any) {
  return authUser && (authUser.role === Role.DIRECTOR || authUser.role === Role.SUPERADMIN);
}

// POST: Create a new branch office
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, branchCommissionSplit } = body;

    if (!name) {
      return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        branchCommissionSplit: branchCommissionSplit !== undefined && branchCommissionSplit !== '' ? parseFloat(branchCommissionSplit) : null,
        organizationId: authUser!.organizationId,
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    console.error('Create admin branch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
