import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, props: { params: Promise<{ commissionId: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser || (authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commissionId } = params;
    const body = await req.json();
    const { partnerUniversity, commissionAmountForeign, currency, nprExchangeRate, status, subAgentAmountNpr, branchAmountNpr, agentSplitPercent, branchSplitPercent } = body;

    const commission = await prisma.commissionLedger.findUnique({
      where: { id: commissionId },
      include: { applicant: { include: { subAgent: true } } },
    });

    if (!commission) {
      return NextResponse.json({ error: 'Commission entry not found' }, { status: 404 });
    }

    // Persist split percentage updates back to the applicant
    if (agentSplitPercent !== undefined || branchSplitPercent !== undefined) {
      const applicantUpdate: any = {};
      if (agentSplitPercent !== undefined) {
        applicantUpdate.subAgentCommissionSplit = agentSplitPercent !== null ? parseFloat(agentSplitPercent) / 100 : null;
      }
      if (branchSplitPercent !== undefined) {
        applicantUpdate.branchCommissionSplit = branchSplitPercent !== null ? parseFloat(branchSplitPercent) / 100 : null;
      }

      await prisma.applicant.update({
        where: { id: commission.applicantId },
        data: applicantUpdate,
      });
    }

    const updateData: any = {};
    if (partnerUniversity !== undefined) updateData.partnerUniversity = partnerUniversity;
    if (status !== undefined) updateData.status = status;

    let finalForeign = commission.commissionAmountForeign;
    if (commissionAmountForeign !== undefined) {
      finalForeign = parseFloat(commissionAmountForeign);
      updateData.commissionAmountForeign = finalForeign;
    }

    let finalRate = commission.nprExchangeRate;
    if (nprExchangeRate !== undefined) {
      finalRate = parseFloat(nprExchangeRate);
      updateData.nprExchangeRate = finalRate;
    }

    if (currency !== undefined) {
      updateData.currency = currency.toUpperCase();
    }

    // Recalculate totals
    const commissionAmountNpr = finalForeign * finalRate;
    updateData.commissionAmountNpr = commissionAmountNpr;

    // Recalculate or override splits using original split overrides defined on applicant
    const applicant = commission.applicant;
    let finalSubAgent = commission.subAgentAmountNpr;

    if (subAgentAmountNpr !== undefined) {
      finalSubAgent = parseFloat(subAgentAmountNpr) || 0;
      updateData.subAgentAmountNpr = finalSubAgent;
    } else if (commissionAmountForeign !== undefined || nprExchangeRate !== undefined) {
      if (applicant.subAgentId) {
        const splitValue = applicant.subAgentCommissionSplit !== null 
          ? applicant.subAgentCommissionSplit 
          : (applicant.subAgent?.subAgentCommissionSplit || 0);

        if (splitValue > 0) {
          if (splitValue < 1) {
            finalSubAgent = commissionAmountNpr * splitValue;
          } else {
            finalSubAgent = Math.min(splitValue, commissionAmountNpr);
          }
        }
      } else {
        finalSubAgent = 0;
      }
      updateData.subAgentAmountNpr = finalSubAgent;
    }

    let finalBranch = commission.branchAmountNpr;

    if (branchAmountNpr !== undefined) {
      finalBranch = parseFloat(branchAmountNpr) || 0;
      updateData.branchAmountNpr = finalBranch;
    } else if (commissionAmountForeign !== undefined || nprExchangeRate !== undefined) {
      const branchRecord = await prisma.branch.findUnique({
        where: { id: applicant.branchId },
      });

      const branchSplitValue = applicant.branchCommissionSplit !== null
        ? applicant.branchCommissionSplit
        : (branchRecord?.branchCommissionSplit || 0);

      if (branchSplitValue > 0) {
        if (branchSplitValue < 1) {
          finalBranch = commissionAmountNpr * branchSplitValue;
        } else {
          finalBranch = Math.min(branchSplitValue, commissionAmountNpr);
        }
      } else {
        finalBranch = 0;
      }
      updateData.branchAmountNpr = finalBranch;
    }

    const hqAmountNpr = Math.max(0, commissionAmountNpr - finalSubAgent - finalBranch);
    updateData.hqAmountNpr = hqAmountNpr;

    const updated = await prisma.commissionLedger.update({
      where: { id: commissionId },
      data: updateData,
    });

    return NextResponse.json({ success: true, commission: updated });
  } catch (error: any) {
    console.error('Update commission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ commissionId: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser || (authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commissionId } = params;

    await prisma.commissionLedger.delete({
      where: { id: commissionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete commission error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
