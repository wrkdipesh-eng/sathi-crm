import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateApplicantPriority, updateAllApplicantPriorities } from '@/lib/priorityCalculator';

/**
 * POST /api/applicants/update-priorities
 *
 * Update priorities for applicants
 * - Query param: ?applicantId=xxx → update single applicant
 * - Query param: ?organizationId=xxx → update all applicants in org
 * - Header: Authorization required
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get('applicantId');
    const organizationId = searchParams.get('organizationId') || authUser.organizationId;

    // Verify organization access
    if (organizationId !== authUser.organizationId && authUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden: Cannot access other organizations' }, { status: 403 });
    }

    let result: any;

    if (applicantId) {
      // Update single applicant
      const changed = await updateApplicantPriority(applicantId, authUser.userId);
      result = {
        success: true,
        message: `Applicant priority updated. Changed: ${changed}`,
        updated: 1,
        changed: changed ? 1 : 0,
      };
    } else {
      // Batch update all applicants in organization
      const changedCount = await updateAllApplicantPriorities(organizationId);
      const totalCount = await (
        // Count total applicants
        require('@/lib/prisma').default
      ).applicant.count({
        where: { organizationId },
      });

      result = {
        success: true,
        message: `Updated ${totalCount} applicants. ${changedCount} priorities changed.`,
        updated: totalCount,
        changed: changedCount,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating applicant priorities:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * GET /api/applicants/update-priorities
 * Get status / health check
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Priority update endpoint active',
      usage: {
        single: 'POST /api/applicants/update-priorities?applicantId=xxx',
        batch: 'POST /api/applicants/update-priorities?organizationId=xxx',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
