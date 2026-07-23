import { fetchSellingRates, FALLBACK_RATES } from './forex';

/**
 * Auto-creates a commission ledger entry when a target (the primary slot on
 * Applicant, or a specific secondary Application) reaches VISA_FILED.
 *
 * `target` lets a secondary Application pass in its own university/course
 * instead of the applicant's primary ones -- without it, every call falls
 * back to reading the applicant's current primary target, which is only
 * correct for the primary-slot trigger path.
 */
export async function createCommissionIfVisaFiled(
  applicantId: string,
  tx: any,
  target?: { targetUniversity?: string | null; targetCourse?: string | null }
) {
  // 1. Fetch applicant details
  const applicant = await tx.applicant.findUnique({
    where: { id: applicantId },
    include: { subAgent: true }
  });

  if (!applicant) {
    console.log(`Applicant not found for ${applicantId}. Skipping auto-commission.`);
    return;
  }

  const resolvedUniversity = target?.targetUniversity ?? applicant.targetUniversity;
  const resolvedCourse = target?.targetCourse ?? applicant.targetCourse;

  if (!resolvedUniversity) {
    console.log(`Target university missing for applicant ${applicantId}. Skipping auto-commission.`);
    return;
  }

  // 2. Check if a commission record already exists for this specific
  // (applicant, university) placement -- an applicant with several target
  // applications at different universities should get a commission for
  // each one that reaches VISA_FILED, not just the first ever recorded.
  const existing = await tx.commissionLedger.findFirst({
    where: {
      applicantId,
      partnerUniversity: { equals: resolvedUniversity, mode: 'insensitive' },
    }
  });
  if (existing) {
    console.log(`Commission record already exists for applicant ${applicantId} at ${resolvedUniversity}. Skipping auto-creation.`);
    return;
  }

  // 3. Extract the base university name (removing suffix like [Direct] or [Portal: ...])
  const baseUniName = resolvedUniversity.replace(/\s+\[(Direct|Portal:.*)\]$/, '').trim();

  // 4. Try to find matching PartnerUniversity to extract tuition fee and commission percentage
  const partnerUni = await tx.partnerUniversity.findFirst({
    where: {
      name: { equals: baseUniName, mode: 'insensitive' },
      course: resolvedCourse ? { equals: resolvedCourse, mode: 'insensitive' } : undefined
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

  // 6. Calculate commission amount foreign based on slabs or base/bonus rules
  const studentCount = await tx.commissionLedger.count({
    where: {
      partnerUniversity: {
        equals: resolvedUniversity,
        mode: 'insensitive'
      }
    }
  });

  let commissionAmountForeign = 0;

  if (partnerUni && Array.isArray(partnerUni.slabs) && partnerUni.slabs.length > 0) {
    const currentStudentNumber = studentCount + 1;
    const slabs = partnerUni.slabs as any[];
    const matchingSlab = slabs.find(slab => {
      const min = parseInt(slab.minStudents) || 0;
      const max = slab.maxStudents ? parseInt(slab.maxStudents) : Infinity;
      return currentStudentNumber >= min && currentStudentNumber <= max;
    });

    if (matchingSlab) {
      const slabVal = parseFloat(matchingSlab.commissionValue) || 0;
      if (matchingSlab.commissionType === 'PERCENT') {
        commissionAmountForeign = tuitionAmount * (slabVal / 100);
      } else {
        commissionAmountForeign = slabVal;
      }
    } else {
      commissionAmountForeign = calculateBaseAndBonus(partnerUni, tuitionAmount);
    }
  } else {
    commissionAmountForeign = calculateBaseAndBonus(partnerUni, tuitionAmount);
  }

  function calculateBaseAndBonus(pUni: any, tuition: number) {
    let baseForeign = 0;
    if (pUni?.baseCommissionType === 'FLAT') {
      baseForeign = parseFloat(pUni.baseCommissionValue?.toString()) || 0;
    } else if (pUni?.baseCommissionType === 'PERCENT') {
      const baseVal = parseFloat(pUni.baseCommissionValue?.toString()) || 0;
      baseForeign = tuition * (baseVal / 100);
    } else {
      // Fallback to old schema percentage
      const pct = pUni?.commissionPercentage ? parseFloat(pUni.commissionPercentage.toString()) : 10.0;
      baseForeign = tuition * (pct / 100);
    }

    let bonusForeign = 0;
    if (pUni?.bonusType === 'FLAT') {
      bonusForeign = parseFloat(pUni.bonusValue?.toString()) || 0;
    } else if (pUni?.bonusType === 'PERCENT') {
      const bonusVal = parseFloat(pUni.bonusValue?.toString()) || 0;
      bonusForeign = tuition * (bonusVal / 100);
    }

    return baseForeign + bonusForeign;
  }

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
      partnerUniversity: resolvedUniversity,
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
