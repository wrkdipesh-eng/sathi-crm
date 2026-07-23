import prisma from '@/lib/prisma';
import { PipelineStage } from '@prisma/client';

export interface PriorityResult {
  priority: string | null;
  reason: string;
  missedFollowUpCount: number;
}

/**
 * Calculate priority based on engagement, commitment, and follow-ups
 *
 * PRIORITY Logic (Urgency/Engagement Level) — only applies while the
 * applicant is still a lead (INQUIRY/COUNSELLING/CLASS_ENROLLMENT):
 * - NEW ENTRY (INQUIRY) → HOT (reason: NEW_ENTRY)
 * - COMMITMENT set + not expired → HOT (reason: SUBMISSION_COMMITTED)
 * - Commitment date passed unmet → WARM (reason: COMMITMENT_MISSED)
 * - 2+ missed follow-ups → COLD (reason: FOLLOWUP_MISSED)
 * - Default engaged leads → WARM
 *
 * Once the applicant is off the lead-conversion track, priority stops
 * measuring "urgency to convert" and either clears or resets:
 * - Application submitted or beyond (REAL) → no priority (reason: CONVERTED)
 * - Visa refused (REJECTED) → HOT (reason: RE_ENGAGE) — they may reapply to
 *   the same or a different destination, so they surface again as a fresh
 *   lead rather than disappearing from the priority filters.
 *
 * APPLICANT STATUS (whether they're real/verified):
 * - APPLICATION_SUBMITTED or beyond → REAL (separate field)
 * - INQUIRY/COUNSELLING → INQUIRY
 * - VISA_REFUSED → REJECTED
 */
export function calculatePriority(
  pipelineStage: PipelineStage,
  missedFollowUpCount: number,
  committedSubmissionDate?: Date | null,
  applicantCreatedAt?: Date
): PriorityResult {
  const now = new Date();
  const status = calculateApplicantStatus(pipelineStage);

  // RULE 0a: Already converted to a real applicant — priority measures
  // conversion urgency, which no longer applies once they've converted.
  if (status === 'REAL') {
    return {
      priority: null,
      reason: 'CONVERTED',
      missedFollowUpCount,
    };
  }

  // RULE 0b: Visa refused — reset to HOT as a fresh re-engagement
  // opportunity rather than a dead lead, since they may reapply.
  if (status === 'REJECTED') {
    return {
      priority: 'HOT',
      reason: 'RE_ENGAGE',
      missedFollowUpCount,
    };
  }

  // RULE 1: If 2+ missed follow-ups → COLD (override everything below)
  if (missedFollowUpCount >= 2) {
    return {
      priority: 'COLD',
      reason: 'FOLLOWUP_MISSED',
      missedFollowUpCount,
    };
  }

  // RULE 2: Check commitment status
  if (committedSubmissionDate) {
    if (committedSubmissionDate > now) {
      // Commitment date still in future → HOT
      return {
        priority: 'HOT',
        reason: 'SUBMISSION_COMMITTED',
        missedFollowUpCount,
      };
    } else {
      // Commitment date has passed → WARM (missed commitment)
      return {
        priority: 'WARM',
        reason: 'COMMITMENT_MISSED',
        missedFollowUpCount,
      };
    }
  }

  // RULE 3: NEW ENTRY (very recent, no commitment yet)
  if (applicantCreatedAt) {
    const daysSinceCreation = Math.floor((now.getTime() - applicantCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    // If less than 7 days old and no commitment → HOT (new entry)
    if (daysSinceCreation <= 7 && !committedSubmissionDate) {
      return {
        priority: 'HOT',
        reason: 'NEW_ENTRY',
        missedFollowUpCount,
      };
    }
  }

  // DEFAULT: Engaged but not new/committed → WARM
  return {
    priority: 'WARM',
    reason: 'AUTO_ASSIGNMENT',
    missedFollowUpCount,
  };
}

/**
 * Calculate applicant status (verification level)
 *
 * - APPLICATION_SUBMITTED or beyond → REAL (verified applicant)
 * - VISA_REFUSED → REJECTED
 * - Default → INQUIRY
 */
export function calculateApplicantStatus(pipelineStage: PipelineStage): string {
  if (pipelineStage === PipelineStage.APPLICATION_SUBMITTED ||
      pipelineStage === PipelineStage.OFFER ||
      pipelineStage === PipelineStage.VISA_FILED ||
      pipelineStage === PipelineStage.VISA_GRANTED ||
      pipelineStage === PipelineStage.PRE_DEPARTURE) {
    return 'REAL';
  }

  if (pipelineStage === PipelineStage.VISA_REFUSED) {
    return 'REJECTED';
  }

  return 'INQUIRY';
}

/**
 * Count missed follow-ups for an applicant
 * A follow-up is "missed" if:
 * - It's a TASK type communication
 * - It has a dueDate in the past
 * - It's not marked as COMPLETED
 *
 * A TASK stays PENDING from creation until someone marks it COMPLETED (via
 * PATCH /api/applicants/[id]/communication/[logId]) — there's no separate
 * "overdue" status a due date crossing flips it to. So PENDING-but-overdue
 * is exactly what "missed" means here, not something to exclude.
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
        not: 'COMPLETED',
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
 * Update an applicant's priority and status based on current state
 * Returns whether priority or status changed
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
        applicantStatus: true,
        missedFollowUpCount: true,
        committedSubmissionDate: true,
        createdAt: true,
      },
    });

    if (!applicant) {
      return false;
    }

    // Count actual missed follow-ups
    const actualMissedCount = await countMissedFollowUps(applicantId);

    // Calculate new priority
    const result = calculatePriority(
      applicant.pipelineStage as PipelineStage,
      actualMissedCount,
      applicant.committedSubmissionDate,
      applicant.createdAt
    );

    // Calculate new applicant status
    const newApplicantStatus = calculateApplicantStatus(applicant.pipelineStage as PipelineStage);

    // Check if priority or status changed
    const priorityChanged = applicant.priority !== result.priority;
    const statusChanged = applicant.applicantStatus !== newApplicantStatus;

    if (priorityChanged || statusChanged) {
      // Get last follow-up date for context
      const lastFollowUpDate = await getLastFollowUpDate(applicantId);
      // Log reason reflects whatever actually changed, so it never goes stale
      const logReason = priorityChanged ? result.reason : 'STATUS_CHANGE';

      // Update applicant and create history log (log fires on priority OR status change)
      await Promise.all([
        prisma.applicant.update({
          where: { id: applicantId },
          data: {
            priority: result.priority,
            applicantStatus: newApplicantStatus,
            missedFollowUpCount: actualMissedCount,
            lastFollowUpDate,
            lastPriorityChangeAt: new Date(),
            priorityChangeReason: logReason,
          },
        }),
        prisma.priorityChangeLog.create({
          data: {
            applicantId,
            oldPriority: applicant.priority,
            newPriority: result.priority,
            reason: logReason,
            triggeredBy: triggeredBy || null,
            pipelineStage: applicant.pipelineStage,
            missedFollowUpCount: actualMissedCount,
            notes:
              result.reason === 'COMMITMENT_MISSED'
                ? `Committed submission date (${applicant.committedSubmissionDate?.toISOString().split('T')[0]}) has passed unmet`
                : result.reason === 'FOLLOWUP_MISSED'
                ? `${actualMissedCount} missed follow-up(s). Last follow-up was due on ${
                    lastFollowUpDate?.toISOString().split('T')[0] || 'unknown date'
                  }`
                : result.reason === 'CONVERTED'
                ? `Applicant reached "${applicant.pipelineStage}" — priority cleared, no longer tracked as a lead`
                : result.reason === 'RE_ENGAGE'
                ? `Visa refused — reset to HOT in case the applicant reapplies to the same or a different destination`
                : !priorityChanged && statusChanged
                ? `Status changed from "${applicant.applicantStatus || 'none'}" to "${newApplicantStatus}" (priority unchanged: ${result.priority})`
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
      where: { organizationId, deletedAt: null },
      select: { id: true },
    });

    let changedCount = 0;
    for (const applicant of applicants) {
      const changed = await updateApplicantPriority(applicant.id, undefined);
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
