import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
            tagline: true,
            logoUrl: true,
            logoIcon: true,
          },
        },
        branchId: true,
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationTagline: user.organization.tagline || null,
        organizationLogoUrl: user.organization.logoUrl || null,
        organizationLogoIcon: user.organization.logoIcon || null,
        branchId: user.branchId,
        branchName: user.branch?.name || null,
      },
    });
  } catch (error: any) {
    console.error('Verify user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
