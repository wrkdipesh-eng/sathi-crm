import prisma from '@/lib/prisma';
import { PipelineStage } from '@prisma/client';

export interface PriorityResult {
  priority: string | null;
  reason: string;
  missedFollowUpCount: number;
}

/**
 * Calculate priority based on pipeline stage and follow-up history
 *
 * Logic:
 * - NEW ENTRY (INQUIRY) → WARM
 * - APPLICATION_SUBMITTED or later → HOT
 * - 2+ missed follow-ups → COLD
 * - If HOT but has missed follow-ups → stay HOT (override)
 */
export function calculatePriority(
  pipelineStage: PipelineStage,
  missedFollowUpCount: number
): PriorityResult {
  // If 2 or more missed follow-ups, always COLD
  if (missedFollowUpCount >= 2) {
    return {
      priority: 'COLD',
      reason: 'FOLLOWUP_MISSED',
      missedFollowUpCount,
    };
  }

  // If application submitted or beyond, it's HOT
  if (
    pipelineStage === PipelineStage.APPLICATION_SUBMITTED ||
    pipelineStage === PipelineStage.OFFER ||
    pipelineStage === PipelineStage.VISA_FILED ||
    pipelineStage === PipelineStage.VISA_GRANTED ||
    pipelineStage === PipelineStage.VISA_REFUSED ||
    pipelineStage === PipelineStage.PRE_DEPARTURE
  ) {
    return {
      priority: 'HOT',
      reason: 'STAGE_CHANGE',
      missedFollowUpCount,
    };
  }

  // Default for INQUIRY and COUNSELLING stages: WARM
  return {
    priority: 'WARM',
    reason: 'AUTO_ASSIGNMENT',
    missedFollowUpCount,
  };
}

/**
 * Count missed follow-ups for an applicant
 * A follow-up is "missed" if:
 * - It's a TASK type communication
 * - It has a dueDate in the past
 * - It's not marked as COMPLETED or PENDING
 */
export async function countMissedFollowUps(applicantId: string): Promise<number> {
  const now = new Date();

  const missedFollowUps = await prisma.communicationLog.count({
    where: {
      applicantId,
      type: 'TASK',
      dueDate: {
        lt: now, // Due date is in the past
      },
      status: {
        notIn: ['COMPLETED', 'PENDING'], // Not completed or pending
      },
    },
  });

  return missedFollowUps;
}

/**
 * Get the most recent follow-up task's due date
 */
export async function getLastFollowUpDate(applicantId: string): Promise<Date | null> {
  const lastFollowUp = await prisma.communicationLog.findFirst({
    where: {
      applicantId,
      type: 'TASK',
      dueDate: { not: null },
    },
    orderBy: {
      dueDate: 'desc',
    },
    select: {
      dueDate: true,
    },
  });

  return lastFollowUp?.dueDate || null;
}

/**
 * Update an applicant's priority based on current state
 * Returns whether priority changed
 */
export async function updateApplicantPriority(
  applicantId: string,
  triggeredBy?: string
): Promise<boolean> {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      select: {
        pipelineStage: true,
        priority: true,
        missedFollowUpCount: true,
      },
    });

    if (!applicant) {
      return false;
    }

    // Count actual missed follow-ups
    const actualMissedCount = await countMissedFollowUps(applicantId);

    // Calculate new priority
    const result = calculatePriority(applicant.pipelineStage as PipelineStage, actualMissedCount);

    // Check if priority changed
    const priorityChanged = applicant.priority !== result.priority;

    if (priorityChanged) {
      // Get last follow-up date for context
      const lastFollowUpDate = await getLastFollowUpDate(applicantId);

      // Update applicant and create history log
      await Promise.all([
        prisma.applicant.update({
          where: { id: applicantId },
          data: {
            priority: result.priority,
            missedFollowUpCount: actualMissedCount,
            lastFollowUpDate,
            lastPriorityChangeAt: new Date(),
            priorityChangeReason: result.reason,
          },
        }),
        prisma.priorityChangeLog.create({
          data: {
            applicantId,
            oldPriority: applicant.priority,
            newPriority: result.priority,
            reason: result.reason,
            triggeredBy: triggeredBy || null,
            pipelineStage: applicant.pipelineStage,
            missedFollowUpCount: actualMissedCount,
            notes:
              actualMissedCount > 0
                ? `${actualMissedCount} missed follow-up(s). Last follow-up was due on ${
                    lastFollowUpDate?.toISOString().split('T')[0] || 'unknown date'
                  }`
                : undefined,
          },
        }),
      ]);

      return true;
    }

    // Even if priority didn't change, update the counts if they differ
    if (applicant.missedFollowUpCount !== actualMissedCount) {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: {
          missedFollowUpCount: actualMissedCount,
        },
      });
    }

    return false;
  } catch (error) {
    console.error(`Error updating priority for applicant ${applicantId}:`, error);
    return false;
  }
}

/**
 * Batch update priorities for all applicants in an organization
 * Useful for daily scheduled jobs
 */
export async function updateAllApplicantPriorities(organizationId: string): Promise<number> {
  try {
    const applicants = await prisma.applicant.findMany({
      where: { organizationId },
      select: { id: true },
    });

    let changedCount = 0;
    for (const applicant of applicants) {
      const changed = await updateApplicantPriority(applicant.id, null);
      if (changed) changedCount++;
    }

    console.log(
      `Updated priorities for ${applicants.length} applicants. ${changedCount} changed.`
    );
    return changedCount;
  } catch (error) {
    console.error('Error batch updating priorities:', error);
    return 0;
  }
}
