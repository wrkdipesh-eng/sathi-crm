import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch branches of this organization
    const branches = await prisma.branch.findMany({
      where: { organizationId: authUser.organizationId },
      orderBy: { name: 'asc' },
    });

    // Fetch counselors of this organization
    const counselors = await prisma.user.findMany({
      where: {
        organizationId: authUser.organizationId,
        role: Role.COUNSELOR,
      },
      select: {
        id: true,
        name: true,
        email: true,
        branchId: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch sub-agents of this organization
    const subAgents = await prisma.user.findMany({
      where: {
        organizationId: authUser.organizationId,
        role: Role.SUB_AGENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        subAgentCommissionSplit: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      branches,
      counselors,
      subAgents,
    });
  } catch (error: any) {
    console.error('Fetch branches metadata error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
