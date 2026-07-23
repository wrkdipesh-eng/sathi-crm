import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET: List soft-deleted visitors for the Trash section. SUPERADMIN only.
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (authUser.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const visitors = await prisma.visitor.findMany({
      where: {
        organizationId: authUser.organizationId,
        deletedAt: { not: null },
      },
      include: {
        branch: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
        deletedBy: { select: { id: true, name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return NextResponse.json({ success: true, visitors });
  } catch (error: any) {
    console.error('Fetch trashed visitors error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
