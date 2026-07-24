import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, canWriteApplicant } from '@/lib/auth';
import { PipelineStage, CommunicationType } from '@prisma/client';
import { createCommissionIfVisaFiled } from '@/lib/commission';
import { calculatePriority, calculateApplicantStatus } from '@/lib/priorityCalculator';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { newStage } = body;

    if (!newStage || !Object.values(PipelineStage).includes(newStage)) {
      return NextResponse.json({ error: 'Invalid pipeline stage' }, { status: 400 });
    }

    // Get current applicant details
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        pipelineStageLogs: {
          where: { exitedAt: null },
          orderBy: { enteredAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Check write permissions
    const hasWriteAccess = canWriteApplicant(
      authUser,
      applicant.branchId,
      applicant.counselorId,
      applicant.subAgentId
    );

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldStage = applicant.pipelineStage;
    if (oldStage === newStage) {
      return NextResponse.json({ success: true, message: 'Already in this stage' });
    }

    // A visa refusal loops the applicant back into Counseling to be
    // re-engaged as a fresh lead (they may reapply) rather than sitting in
    // a dead-end stage. The refusal itself is still logged for history/
    // reporting -- only the applicant's resting stage differs from newStage.
    const isVisaRefusal = newStage === PipelineStage.VISA_REFUSED;
    const finalStage = isVisaRefusal ? PipelineStage.COUNSELLING : newStage;

    // Process transition in transaction
    const updatedApplicant = await prisma.$transaction(async (tx) => {
      // 1. Close current active stage log
      const activeLog = applicant.pipelineStageLogs[0];
      const now = new Date();

      if (activeLog) {
        const diffTime = Math.abs(now.getTime() - activeLog.enteredAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        await tx.pipelineStageLog.update({
          where: { id: activeLog.id },
          data: {
            exitedAt: now,
            durationDays: diffDays,
          },
        });
      }

      // 2. Open new stage log. A refusal logs an instant VISA_REFUSED entry
      // (for history) immediately followed by the active COUNSELLING one.
      if (isVisaRefusal) {
        await tx.pipelineStageLog.create({
          data: {
            applicantId: id,
            stage: PipelineStage.VISA_REFUSED,
            enteredAt: now,
            exitedAt: now,
            durationDays: 0,
          },
        });
      }
      await tx.pipelineStageLog.create({
        data: {
          applicantId: id,
          stage: finalStage,
          enteredAt: now,
        },
      });

      // 3. Update applicant stage fields & auto-update priority & status.
      // Priority/status are calculated off newStage (a refusal triggers the
      // HOT re-engage reset) even though the applicant lands on finalStage.
      const priorityResult = calculatePriority(
        newStage,
        applicant.missedFollowUpCount,
        applicant.committedSubmissionDate,
        applicant.createdAt
      );
      const newStatus = calculateApplicantStatus(newStage);

      const priorityChanged = applicant.priority !== priorityResult.priority;
      const statusChanged = applicant.applicantStatus !== newStatus;
      const shouldLog = priorityChanged || statusChanged;
      // Log reason reflects whatever actually changed, so it never goes stale
      const logReason = priorityChanged ? priorityResult.reason : 'STATUS_CHANGE';

      const updated = await tx.applicant.update({
        where: { id },
        data: {
          pipelineStage: finalStage,
          daysInCurrentStage: 0,
          stageUpdatedAt: now,
          priority: priorityResult.priority,
          applicantStatus: newStatus,
          lastPriorityChangeAt: shouldLog ? now : applicant.lastPriorityChangeAt,
          priorityChangeReason: shouldLog ? logReason : applicant.priorityChangeReason,
        },
      });

      // Log if priority or status changed (a stage change can move status alone, e.g. INQUIRY -> REAL, with priority unchanged)
      if (shouldLog) {
        await tx.priorityChangeLog.create({
          data: {
            applicantId: id,
            oldPriority: applicant.priority,
            newPriority: priorityResult.priority,
            reason: logReason,
            triggeredBy: authUser.userId,
            pipelineStage: newStage,
            missedFollowUpCount: applicant.missedFollowUpCount,
            notes: `Stage change from "${oldStage}" to "${newStage}"${
              priorityChanged ? ` triggered priority update` : ` (priority unchanged: ${priorityResult.priority})`
            }${statusChanged ? ` and status update to "${newStatus}"` : ''}`,
          },
        });
      }

      // Auto-create commission ledger entry if stage is VISA_FILED
      if (newStage === PipelineStage.VISA_FILED) {
        await createCommissionIfVisaFiled(id, tx);
      }

      // 4. Create timeline transition log note
      await tx.communicationLog.create({
        data: {
          type: CommunicationType.NOTE,
          title: 'Stage Transitioned',
          content: isVisaRefusal
            ? `Pipeline stage updated from "${oldStage}" to "VISA_REFUSED", then automatically moved back to "COUNSELLING" for re-engagement.`
            : `Pipeline stage updated from "${oldStage}" to "${newStage}".`,
          senderName: authUser.name,
          applicantId: id,
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, applicant: updatedApplicant });
  } catch (error: any) {
    console.error('Stage transition error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
