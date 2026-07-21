import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, getAccessQueryFilter } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE') {
      return NextResponse.json({ error: 'Forbidden: Restricted to Finance and Directors' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const branchId = searchParams.get('branchId') || '';

    // Enforce data-isolation filter criteria
    const accessFilter = getAccessQueryFilter(authUser);

    // Build the query filters
    const where: any = {
      applicant: {
        AND: [
          accessFilter,
          branchId ? { branchId } : {},
        ],
      },
      status: status ? status : undefined,
    };

    const commissions = await prisma.commissionLedger.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            targetCourse: true,
            branch: { select: { id: true, name: true } },
            counselor: { select: { id: true, name: true } },
            subAgent: { select: { id: true, name: true, email: true } },
            subAgentCommissionSplit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, commissions });
  } catch (error: any) {
    console.error('Fetch commissions error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || (authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      applicantId,
      partnerUniversity,
      commissionAmountForeign,
      currency,
      nprExchangeRate,
      status,
      subAgentAmountNpr = 0,
      branchAmountNpr = 0,
      agentSplitPercent,
      branchSplitPercent
    } = body;

    if (!applicantId || !partnerUniversity || !commissionAmountForeign || !currency || !nprExchangeRate || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const foreign = parseFloat(commissionAmountForeign);
    const rate = parseFloat(nprExchangeRate);
    const commissionAmountNpr = foreign * rate;
    const agentNpr = parseFloat(subAgentAmountNpr) || 0;
    const branchNpr = parseFloat(branchAmountNpr) || 0;
    const hqAmountNpr = commissionAmountNpr - agentNpr - branchNpr;

    // Persist split percentage updates back to the applicant if specified
    if (agentSplitPercent !== undefined || branchSplitPercent !== undefined) {
      const applicantUpdate: any = {};
      if (agentSplitPercent !== undefined && agentSplitPercent !== null) {
        applicantUpdate.subAgentCommissionSplit = parseFloat(agentSplitPercent) / 100;
      }
      if (branchSplitPercent !== undefined && branchSplitPercent !== null) {
        applicantUpdate.branchCommissionSplit = parseFloat(branchSplitPercent) / 100;
      }

      if (Object.keys(applicantUpdate).length > 0) {
        await prisma.applicant.update({
          where: { id: applicantId },
          data: applicantUpdate,
        });
      }
    }

    const newCommission = await prisma.commissionLedger.create({
      data: {
        applicantId,
        partnerUniversity,
        commissionAmountForeign: foreign,
        currency: currency.toUpperCase(),
        nprExchangeRate: rate,
        commissionAmountNpr,
        subAgentAmountNpr: agentNpr,
        branchAmountNpr: branchNpr,
        hqAmountNpr,
        status,
      },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            targetCourse: true,
            branch: { select: { id: true, name: true } },
            counselor: { select: { id: true, name: true } },
            subAgent: { select: { id: true, name: true, email: true } },
            subAgentCommissionSplit: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, commission: newCommission });
  } catch (error: any) {
    console.error('Create commission error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

