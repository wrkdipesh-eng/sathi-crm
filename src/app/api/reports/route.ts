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

    // Enforce data-isolation filter criteria
    const accessFilter = getAccessQueryFilter(authUser);

    // 1. Core KPIs
    const totalLeads = await prisma.applicant.count({ where: accessFilter });
    
    const activePipelines = await prisma.applicant.count({
      where: {
        AND: [
          accessFilter,
          {
            pipelineStage: {
              notIn: [PipelineStage.INQUIRY, PipelineStage.PRE_DEPARTURE],
            },
          },
        ],
      },
    });

    const visaApproved = await prisma.applicant.count({
      where: {
        AND: [
          accessFilter,
          { pipelineStage: PipelineStage.PRE_DEPARTURE }, // or custom stages
        ],
      },
    });

    const stuckLeads = await prisma.applicant.count({
      where: {
        AND: [
          accessFilter,
          { daysInCurrentStage: { gte: 7 } },
        ],
      },
    });

    // 2. Leads by Source
    const leadsBySourceGroup = await prisma.applicant.groupBy({
      by: ['source'],
      where: accessFilter,
      _count: { id: true },
    });
    
    const leadsBySource = leadsBySourceGroup.map(g => ({
      source: g.source,
      count: g._count.id,
    }));

    // 3. Revenue by Branch
    // For each branch, get the sum of hqAmountNpr from linked applicants commission ledgers
    const branches = await prisma.branch.findMany({
      where: { organizationId: authUser.organizationId },
      include: {
        applicants: {
          where: accessFilter,
          include: {
            commissions: true,
          },
        },
      },
    });

    const revenueByBranch = branches.map(b => {
      let revenue = 0;
      b.applicants.forEach(app => {
        app.commissions.forEach(comm => {
          if (comm.status === 'RECEIVED') {
            revenue += comm.hqAmountNpr;
          }
        });
      });
      return {
        branchId: b.id,
        branchName: b.name,
        revenue,
      };
    });

    // 4. Conversion Rate by Counselor
    // Let's find counselors in the org, count their total assigned students and conversion (Offer stage and beyond)
    const counselors = await prisma.user.findMany({
      where: {
        organizationId: authUser.organizationId,
        role: Role.COUNSELOR,
      },
      include: {
        assignedApplicants: {
          where: accessFilter,
        },
      },
    });

    const counselorConversions = counselors.map(c => {
      const total = c.assignedApplicants.length;
      const converted = c.assignedApplicants.filter(app => 
        ([PipelineStage.OFFER, PipelineStage.VISA_FILED, PipelineStage.VISA_DECISION, PipelineStage.PRE_DEPARTURE] as PipelineStage[]).includes(app.pipelineStage)
      ).length;

      const rate = total > 0 ? (converted / total) * 100 : 0;
      return {
        counselorName: c.name,
        total,
        converted,
        conversionRate: Math.round(rate),
      };
    });

    // 5. Visa statistics by Country
    // Placements in VISA_DECISION or PRE_DEPARTURE stages are processed.
    const visaApplicants = await prisma.applicant.findMany({
      where: {
        AND: [
          accessFilter,
          {
            pipelineStage: {
              in: [PipelineStage.VISA_DECISION, PipelineStage.PRE_DEPARTURE],
            },
          },
        ],
      },
    });

    const visaByCountry: Record<string, { approved: number; total: number }> = {};
    visaApplicants.forEach(app => {
      const country = app.targetCountry;
      if (!visaByCountry[country]) {
        visaByCountry[country] = { approved: 0, total: 0 };
      }
      visaByCountry[country].total += 1;
      // In our seed, PRE_DEPARTURE and VISA_DECISION (which we seed as approved) are approvals
      if (app.pipelineStage === PipelineStage.PRE_DEPARTURE || app.pipelineStage === PipelineStage.VISA_DECISION) {
        visaByCountry[country].approved += 1;
      }
    });

    const visaStats = Object.keys(visaByCountry).map(country => {
      const stats = visaByCountry[country];
      const rate = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
      return {
        country,
        approved: stats.approved,
        total: stats.total,
        rate: Math.round(rate),
      };
    });

    // 6. Stuck Leads Aging List
    const agingLeads = await prisma.applicant.findMany({
      where: {
        AND: [
          accessFilter,
          { daysInCurrentStage: { gte: 7 } },
        ],
      },
      include: {
        branch: { select: { name: true } },
        counselor: { select: { name: true } },
      },
      orderBy: { daysInCurrentStage: 'desc' },
      take: 5,
    });

    // 7. Quick Filters Priority Counts
    const hotCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { priority: 'HOT' }] }
    });
    const warmCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { priority: 'WARM' }] }
    });
    const coldCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { priority: 'COLD' }] }
    });
    const noPriorityCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { priority: null }] }
    });

    // 8. Quick Filters Category Counts
    const leadCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { pipelineStage: PipelineStage.INQUIRY }] }
    });
    const inquiringCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { pipelineStage: PipelineStage.COUNSELLING }] }
    });
    const classEnrollmentCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { pipelineStage: PipelineStage.CLASS_ENROLLMENT }] }
    });
    const abroadEnrollmentCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { pipelineStage: { in: [PipelineStage.APPLICATION_SUBMITTED, PipelineStage.OFFER, PipelineStage.VISA_FILED] } }] }
    });
    const decisionCount = await prisma.applicant.count({
      where: { AND: [accessFilter, { pipelineStage: { in: [PipelineStage.VISA_DECISION, PipelineStage.PRE_DEPARTURE] } }] }
    });

    return NextResponse.json({
      success: true,
      kpis: {
        totalLeads,
        activePipelines,
        visaApproved,
        stuckLeads,
      },
      leadsBySource,
      revenueByBranch,
      counselorConversions,
      visaStats,
      agingLeads: agingLeads.map(l => ({
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
    });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
