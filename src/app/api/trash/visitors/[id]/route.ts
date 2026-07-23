import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// PATCH: Restore a trashed visitor. SUPERADMIN only.
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
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor || visitor.organizationId !== authUser.organizationId || !visitor.deletedAt) {
      return NextResponse.json({ error: 'Trashed visitor not found' }, { status: 404 });
    }

    const restored = await prisma.visitor.update({
      where: { id },
      data: { deletedAt: null, deletedById: null },
    });

    return NextResponse.json({ success: true, visitor: restored });
  } catch (error: any) {
    console.error('Restore visitor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Permanently destroy a trashed visitor. SUPERADMIN only -- this
// cannot be undone.
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
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor || visitor.organizationId !== authUser.organizationId || !visitor.deletedAt) {
      return NextResponse.json({ error: 'Trashed visitor not found' }, { status: 404 });
    }

    await prisma.visitor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Permanently delete visitor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
