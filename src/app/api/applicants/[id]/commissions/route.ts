import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Helper mock rates for NPR exchange rate snapshotting
const NPR_EXCHANGE_RATES: Record<string, number> = {
  AUD: 89.20,
  CAD: 89.45,
  GBP: 168.50,
  USD: 133.50,
};

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

    // Get exchange rate snapshot (dynamically fetch latest selling price from NRB API, with hardcoded fallback)
    let exchangeRate = NPR_EXCHANGE_RATES[currency.toUpperCase()] || 133.0;
    try {
      const toDate = new Date();
      const fromDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10-day window to guarantee capturing latest daily rates over weekends/holidays
      const toStr = toDate.toISOString().split('T')[0];
      const fromStr = fromDate.toISOString().split('T')[0];
      
      const nrbUrl = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=10&from=${fromStr}&to=${toStr}`;
      const response = await fetch(nrbUrl, { next: { revalidate: 3600 } });
      if (response.ok) {
        const json = await response.json();
        const payloads = json?.data?.payload || [];
        // Sort payloads by date descending to get the absolute latest rates
        payloads.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestPayload = payloads[0];
        if (latestPayload?.rates) {
          const matchingRate = latestPayload.rates.find(
            (r: any) => r.currency?.iso3?.toUpperCase() === currency.toUpperCase()
          );
          if (matchingRate) {
            const sellVal = parseFloat(matchingRate.sell);
            const unitVal = parseFloat(matchingRate.currency?.unit || '1');
            if (!isNaN(sellVal) && unitVal > 0) {
              exchangeRate = sellVal / unitVal;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to retrieve dynamic exchange rate from NRB, falling back to static snapshot:', err);
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
