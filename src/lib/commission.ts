import { fetchSellingRates, FALLBACK_RATES } from './forex';

export async function createCommissionIfVisaFiled(applicantId: string, tx: any) {
  // 1. Check if a commission record already exists for this applicant
  const existing = await tx.commissionLedger.findFirst({
    where: { applicantId }
  });
  if (existing) {
    console.log(`Commission record already exists for applicant ${applicantId}. Skipping auto-creation.`);
    return;
  }

  // 2. Fetch applicant details
  const applicant = await tx.applicant.findUnique({
    where: { id: applicantId },
    include: { subAgent: true }
  });

  if (!applicant || !applicant.targetUniversity) {
    console.log(`Applicant not found or target university missing for ${applicantId}. Skipping auto-commission.`);
    return;
  }

  // 3. Extract the base university name (removing suffix like [Direct] or [Portal: ...])
  const baseUniName = applicant.targetUniversity.replace(/\s+\[(Direct|Portal:.*)\]$/, '').trim();

  // 4. Try to find matching PartnerUniversity to extract tuition fee and commission percentage
  const partnerUni = await tx.partnerUniversity.findFirst({
    where: {
      name: { equals: baseUniName, mode: 'insensitive' },
      course: applicant.targetCourse ? { equals: applicant.targetCourse, mode: 'insensitive' } : undefined
    }
  });

  // 5. Parse tuition fee and commission percentage
  let tuitionFeeStr = partnerUni?.tuitionFee || 'AUD 25000 / Year';
  let commPercent = partnerUni?.commissionPercentage ? parseFloat(partnerUni.commissionPercentage.toString()) : 10.0;

  // Extract currency (first 3 alphabetic characters) and value
  const currencyMatch = tuitionFeeStr.match(/([a-zA-Z]{3})/);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'AUD';

  // Extract digits for tuition fee number
  const cleanFeeStr = tuitionFeeStr.split('/')[0].replace(/[^0-9.]/g, '');
  const tuitionAmount = parseFloat(cleanFeeStr) || 25000.0;

  const commissionAmountForeign = tuitionAmount * (commPercent / 100);

  // 6. Fetch exchange rate
  let exchangeRate = FALLBACK_RATES[currency] || 133.0;
  try {
    const rates = await fetchSellingRates();
    if (rates[currency]) {
      exchangeRate = rates[currency];
    }
  } catch (err) {
    console.error('Failed to retrieve dynamic exchange rate for auto-commission:', err);
  }

  const commissionAmountNpr = commissionAmountForeign * exchangeRate;

  // 7. Calculate sub-agent split
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

  // 8. Calculate branch split
  let branchAmountNpr = 0;
  const branchRecord = await tx.branch.findUnique({
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

  // 9. Create CommissionLedger entry
  await tx.commissionLedger.create({
    data: {
      applicantId,
      partnerUniversity: applicant.targetUniversity,
      commissionAmountForeign,
      currency,
      nprExchangeRate: exchangeRate,
      commissionAmountNpr,
      subAgentAmountNpr,
      branchAmountNpr,
      hqAmountNpr,
      status: 'PENDING',
    }
  });

  console.log(`Auto-created commission record for applicant ${applicant.name} (${applicantId}): ${commissionAmountForeign} ${currency} (${commissionAmountNpr} NPR).`);
}
