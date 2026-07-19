import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { fetchSellingRates, FALLBACK_RATES } from '@/lib/forex';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId } = params;
    const body = await req.json();
    const { partnerUniversity, commissionAmountForeign, currency, status } = body;

    if (!partnerUniversity || !commissionAmountForeign || !currency) {
      return NextResponse.json({ error: 'Partner university, foreign commission, and currency are required' }, { status: 400 });
    }

    // Get applicant details (to check sub-agent split details)
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        subAgent: true,
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    if (applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get exchange rate snapshot (dynamically fetch latest selling price from NRB API or website)
    let exchangeRate = FALLBACK_RATES[currency.toUpperCase()] || 133.0;
    try {
      const rates = await fetchSellingRates();
      if (rates[currency.toUpperCase()]) {
        exchangeRate = rates[currency.toUpperCase()];
      }
    } catch (err) {
      console.error('Failed to retrieve dynamic exchange rate, falling back to static snapshot:', err);
    }
    const commissionAmountNpr = parseFloat(commissionAmountForeign) * exchangeRate;

    // Calculate sub-agent split
    let subAgentAmountNpr = 0;

    if (applicant.subAgentId) {
      const splitValue = applicant.subAgentCommissionSplit !== null 
        ? applicant.subAgentCommissionSplit 
        : (applicant.subAgent?.subAgentCommissionSplit || 0);

      if (splitValue > 0) {
        if (splitValue < 1) {
          subAgentAmountNpr = commissionAmountNpr * splitValue;
        } else {
          subAgentAmountNpr = Math.min(splitValue, commissionAmountNpr);
        }
      }
    }

    // Calculate branch split
    let branchAmountNpr = 0;
    const branchRecord = await prisma.branch.findUnique({
      where: { id: applicant.branchId },
    });

    const branchSplitValue = applicant.branchCommissionSplit !== null
      ? applicant.branchCommissionSplit
      : (branchRecord?.branchCommissionSplit || 0);

    if (branchSplitValue > 0) {
      if (branchSplitValue < 1) {
        branchAmountNpr = commissionAmountNpr * branchSplitValue;
      } else {
        branchAmountNpr = Math.min(branchSplitValue, commissionAmountNpr);
      }
    }

    const hqAmountNpr = Math.max(0, commissionAmountNpr - subAgentAmountNpr - branchAmountNpr);

    // Create ledger entry
    const ledger = await prisma.commissionLedger.create({
      data: {
        applicantId,
        partnerUniversity,
        commissionAmountForeign: parseFloat(commissionAmountForeign),
        currency: currency.toUpperCase(),
        nprExchangeRate: exchangeRate,
        commissionAmountNpr,
        subAgentAmountNpr,
        branchAmountNpr,
        hqAmountNpr,
        status: status || 'PENDING',
      },
    });

    // Create timeline note
    await prisma.communicationLog.create({
      data: {
        type: 'NOTE',
        title: 'Commission Recorded',
        content: `Commission ledger entry created for ${partnerUniversity}. Total: ${currency} ${commissionAmountForeign} (@ ${exchangeRate} NPR). HQ Net: NPR ${hqAmountNpr.toLocaleString()}, Branch Split: NPR ${branchAmountNpr.toLocaleString()}, Agent Split: NPR ${subAgentAmountNpr.toLocaleString()}.`,
        senderName: authUser.name,
        applicantId,
      },
    });

    return NextResponse.json({ success: true, ledger });
  } catch (error: any) {
    console.error('Create commission ledger error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
