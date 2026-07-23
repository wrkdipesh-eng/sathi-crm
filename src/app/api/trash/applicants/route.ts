import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET: List soft-deleted applicants for the Trash section. SUPERADMIN only.
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicants = await prisma.applicant.findMany({
      where: {
        organizationId: authUser.organizationId,
        deletedAt: { not: null },
      },
      include: {
        branch: { select: { id: true, name: true } },
        deletedBy: { select: { id: true, name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return NextResponse.json({ success: true, applicants });
  } catch (error: any) {
    console.error('Fetch trashed applicants error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
