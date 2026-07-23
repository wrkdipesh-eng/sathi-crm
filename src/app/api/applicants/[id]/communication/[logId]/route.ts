import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, canWriteApplicant } from '@/lib/auth';
import { updateApplicantPriority } from '@/lib/priorityCalculator';

const ALLOWED_STATUSES = ['PENDING', 'COMPLETED', 'IN_PROGRESS', 'SENT', 'FAILED'];

/**
 * PATCH /api/applicants/[id]/communication/[logId]
 *
 * Update a communication log's status — primarily used to mark a follow-up
 * TASK as COMPLETED once it's been actioned. Without this, a TASK stays
 * PENDING forever, which is what the missed-follow-up count relies on to
 * tell "overdue, still needs action" apart from "already handled".
 *
 * Request body: { status: "COMPLETED" }
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string; logId: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId, logId } = params;
    const body = await req.json();
    const { status } = body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      select: { branchId: true, counselorId: true, subAgentId: true },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    const hasWriteAccess = canWriteApplicant(authUser, applicant.branchId, applicant.counselorId, applicant.subAgentId);
    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const log = await prisma.communicationLog.findUnique({ where: { id: logId } });
    if (!log || log.applicantId !== applicantId) {
      return NextResponse.json({ error: 'Communication log not found' }, { status: 404 });
    }

    const updated = await prisma.communicationLog.update({
      where: { id: logId },
      data: { status },
    });

    // Completing/reopening a TASK can change the missed-follow-up count,
    // so recalculate priority off the back of it.
    let priorityUpdated = false;
    if (log.type === 'TASK') {
      priorityUpdated = await updateApplicantPriority(applicantId, authUser.userId);
    }

    return NextResponse.json({ success: true, log: updated, priorityUpdated });
  } catch (error: any) {
    console.error('Error updating communication log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
