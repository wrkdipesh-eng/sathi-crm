import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, canWriteApplicant } from '@/lib/auth';
import { updateApplicantPriority } from '@/lib/priorityCalculator';

/**
 * POST /api/applicants/[id]/commitment
 *
 * Set or update a commitment submission date for an applicant
 *
 * Request body:
 * {
 *   committedSubmissionDate: "2024-02-15T00:00:00Z",  // When they committed to submit
 *   notes?: "Applicant committed to submit within 1 week"
 * }
 */
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { committedSubmissionDate, notes } = body;

    if (!committedSubmissionDate) {
      return NextResponse.json(
        { error: 'committedSubmissionDate is required' },
        { status: 400 }
      );
    }

    // Get applicant
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
        counselorId: true,
        subAgentId: true,
        committedSubmissionDate: true,
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Check write permissions
    const hasWriteAccess = canWriteApplicant(authUser, applicant.branchId, applicant.counselorId, applicant.subAgentId);
    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse the date
    const newCommitmentDate = new Date(committedSubmissionDate);
    if (isNaN(newCommitmentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Update commitment date
    const updated = await prisma.applicant.update({
      where: { id },
      data: {
        committedSubmissionDate: newCommitmentDate,
      },
    });

    // Log the commitment in communication log
    await prisma.communicationLog.create({
      data: {
        type: 'TASK',
        title: 'Submission Commitment Set',
        content: `Applicant committed to submit application by ${newCommitmentDate.toISOString().split('T')[0]}.${
          notes ? ` Note: ${notes}` : ''
        }`,
        dueDate: newCommitmentDate,
        senderName: authUser.name,
        applicantId: id,
        status: 'PENDING',
      },
    });

    // Update priority based on commitment
    await updateApplicantPriority(id, authUser.userId);

    return NextResponse.json({
      success: true,
      message: 'Commitment date set successfully',
      applicant: updated,
      priorityUpdated: true,
    });
  } catch (error: any) {
    console.error('Error setting commitment date:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/applicants/[id]/commitment
 *
 * Clear/remove a commitment date
 */
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get applicant
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      select: {
        branchId: true,
        counselorId: true,
        subAgentId: true,
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Check write permissions
    const hasWriteAccess = canWriteApplicant(authUser, applicant.branchId, applicant.counselorId, applicant.subAgentId);
    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clear commitment date
    const updated = await prisma.applicant.update({
      where: { id },
      data: {
        committedSubmissionDate: null,
      },
    });

    // Log the cancellation
    await prisma.communicationLog.create({
      data: {
        type: 'NOTE',
        title: 'Commitment Cancelled',
        content: 'Submission commitment date has been cleared.',
        senderName: authUser.name,
        applicantId: id,
      },
    });

    // Update priority
    await updateApplicantPriority(id, authUser.userId);

    return NextResponse.json({
      success: true,
      message: 'Commitment date cleared',
      applicant: updated,
    });
  } catch (error: any) {
    console.error('Error clearing commitment date:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
