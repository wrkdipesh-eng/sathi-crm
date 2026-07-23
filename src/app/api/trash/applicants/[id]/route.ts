import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// PATCH: Restore a trashed applicant. SUPERADMIN only.
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant || applicant.organizationId !== authUser.organizationId || !applicant.deletedAt) {
      return NextResponse.json({ error: 'Trashed applicant not found' }, { status: 404 });
    }

    const restored = await prisma.applicant.update({
      where: { id },
      data: { deletedAt: null, deletedById: null },
    });

    return NextResponse.json({ success: true, applicant: restored });
  } catch (error: any) {
    console.error('Restore applicant error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Permanently destroy a trashed applicant and all related records.
// SUPERADMIN only -- this cannot be undone.
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant || applicant.organizationId !== authUser.organizationId || !applicant.deletedAt) {
      return NextResponse.json({ error: 'Trashed applicant not found' }, { status: 404 });
    }

    await prisma.applicant.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Permanently delete applicant error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
