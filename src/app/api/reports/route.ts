import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, getAccessQueryFilter } from '@/lib/auth';
import { PipelineStage, Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessFilter = getAccessQueryFilter(authUser);

    // Get country / branch from query params and create combinedFilter
    const country = req.nextUrl.searchParams.get('country');
    const branchId = req.nextUrl.searchParams.get('branchId');
    const combinedFilter = { ...accessFilter, deletedAt: null } as any;
    if (country) {
      combinedFilter.targetCountry = country;
    }
    // Branch scoping: only honored for roles that aren't already pinned to a
    // single branch (getAccessQueryFilter already restricts branch-scoped
    // roles); for org-wide roles this lets a director view one branch's numbers.
    if (branchId && !(accessFilter as any).branchId) {
      combinedFilter.branchId = branchId;
    }

    // Run all independent queries in parallel — ~10x faster than sequential
    const [
      totalLeads,
      activePipelines,
      visaApproved,
      stuckLeads,
      leadsBySourceGroup,
      leadsByCountryGroup,
      branches,
      counselors,
      visaApplicants,
      agingLeads,
      hotCount,
      warmCount,
      coldCount,
      noPriorityCount,
      leadCount,
      inquiringCount,
      classEnrollmentCount,
      abroadEnrollmentCount,
      decisionCount,
      countriesGroup,
    ] = await Promise.all([
      // Core KPIs
      prisma.applicant.count({ where: combinedFilter }),
      prisma.applicant.count({
        where: {
          AND: [
            combinedFilter,
            { pipelineStage: { notIn: [PipelineStage.INQUIRY, PipelineStage.PRE_DEPARTURE] } },
          ],
        },
      }),
      prisma.applicant.count({
        where: { AND: [combinedFilter, { pipelineStage: PipelineStage.PRE_DEPARTURE }] },
      }),
      prisma.applicant.count({
        where: { AND: [combinedFilter, { daysInCurrentStage: { gte: 7 } }] },
      }),

      // Leads by Source
      prisma.applicant.groupBy({
        by: ['source'],
        where: combinedFilter,
        _count: { id: true },
      }),

      // Leads by Country
      prisma.applicant.groupBy({
        by: ['targetCountry'],
        where: combinedFilter,
        _count: { id: true },
      }),

      // Revenue by Branch
      prisma.branch.findMany({
        where: { organizationId: authUser.organizationId },
        include: {
          applicants: {
            where: combinedFilter,
            include: { commissions: true },
          },
        },
      }),

      // Counselor Conversions
      prisma.user.findMany({
        where: { organizationId: authUser.organizationId, role: Role.COUNSELOR },
        include: { assignedApplicants: { where: combinedFilter } },
      }),

      // Visa stats
      prisma.applicant.findMany({
        where: {
          AND: [
            combinedFilter,
            { pipelineStage: { in: [PipelineStage.VISA_GRANTED, PipelineStage.VISA_REFUSED, PipelineStage.PRE_DEPARTURE] } },
          ],
        },
      }),

      // Aging leads (stuck > 7 days)
      prisma.applicant.findMany({
        where: { AND: [combinedFilter, { daysInCurrentStage: { gte: 7 } }] },
        include: {
          branch: { select: { name: true } },
          counselor: { select: { name: true } },
        },
        orderBy: { daysInCurrentStage: 'desc' },
        take: 5,
      }),

      // Quick filter — priority counts
      prisma.applicant.count({ where: { AND: [combinedFilter, { priority: 'HOT' }] } }),
      prisma.applicant.count({ where: { AND: [combinedFilter, { priority: 'WARM' }] } }),
      prisma.applicant.count({ where: { AND: [combinedFilter, { priority: 'COLD' }] } }),
      prisma.applicant.count({ where: { AND: [combinedFilter, { priority: null }] } }),

      // Quick filter — stage counts
      prisma.applicant.count({ where: { AND: [combinedFilter, { pipelineStage: PipelineStage.INQUIRY }] } }),
      prisma.applicant.count({ where: { AND: [combinedFilter, { pipelineStage: PipelineStage.COUNSELLING }] } }),
      prisma.applicant.count({ where: { AND: [combinedFilter, { pipelineStage: PipelineStage.CLASS_ENROLLMENT }] } }),
      prisma.applicant.count({
        where: {
          AND: [
            combinedFilter,
            { pipelineStage: { in: [PipelineStage.APPLICATION_SUBMITTED, PipelineStage.OFFER, PipelineStage.VISA_FILED] } },
          ],
        },
      }),
      prisma.applicant.count({
        where: {
          AND: [
            combinedFilter,
            { pipelineStage: { in: [PipelineStage.VISA_GRANTED, PipelineStage.PRE_DEPARTURE] } },
          ],
        },
      }),

      // Get list of unique target countries for filters
      prisma.applicant.groupBy({
        by: ['targetCountry'],
        where: accessFilter,
      }),
    ]);

    // Shape derived data
    const countries = countriesGroup.map((g) => g.targetCountry).filter(Boolean);

    const leadsBySource = leadsBySourceGroup.map((g) => ({
      source: g.source,
      count: g._count.id,
    }));

    const leadsByCountry = leadsByCountryGroup
      .map((g) => ({
        country: g.targetCountry || 'Unknown',
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const revenueByBranch = branches.map((b) => {
      let revenue = 0;
      b.applicants.forEach((app) => {
        app.commissions.forEach((comm) => {
          if (comm.status === 'RECEIVED') revenue += comm.hqAmountNpr;
        });
      });
      return { branchId: b.id, branchName: b.name, revenue };
    });

    const counselorConversions = counselors.map((c) => {
      const total = c.assignedApplicants.length;
      const converted = c.assignedApplicants.filter((app) =>
        (
          [PipelineStage.OFFER, PipelineStage.VISA_FILED, PipelineStage.VISA_GRANTED, PipelineStage.PRE_DEPARTURE] as PipelineStage[]
        ).includes(app.pipelineStage)
      ).length;
      return {
        counselorId: c.id,
        counselorName: c.name,
        total,
        converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      };
    });

    const visaByCountry: Record<string, { approved: number; total: number }> = {};
    visaApplicants.forEach((app) => {
      const country = app.targetCountry;
      if (!visaByCountry[country]) visaByCountry[country] = { approved: 0, total: 0 };
      visaByCountry[country].total += 1;
      if (
        app.pipelineStage === PipelineStage.PRE_DEPARTURE ||
        app.pipelineStage === PipelineStage.VISA_GRANTED
      ) {
        visaByCountry[country].approved += 1;
      }
    });

    const visaStats = Object.keys(visaByCountry).map((country) => {
      const s = visaByCountry[country];
      return {
        country,
        approved: s.approved,
        total: s.total,
        rate: s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      countries,
      kpis: { totalLeads, activePipelines, visaApproved, stuckLeads },
      leadsBySource,
      revenueByBranch,
      counselorConversions,
      visaStats,
      agingLeads: agingLeads.map((l) => ({
        id: l.id,
        name: l.name,
        stage: l.pipelineStage,
        days: l.daysInCurrentStage,
        counselor: l.counselor?.name || 'Unassigned',
        branch: l.branch?.name,
      })),
      quickFilters: {
        hotCount,
        warmCount,
        coldCount,
        noPriorityCount,
        leadCount,
        inquiringCount,
        classEnrollmentCount,
        abroadEnrollmentCount,
        decisionCount,
      },
      leadsByCountry,
    });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
