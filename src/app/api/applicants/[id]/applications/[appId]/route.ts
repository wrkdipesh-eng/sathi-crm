import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { PipelineStage, CommunicationType } from '@prisma/client';
import { createCommissionIfVisaFiled } from '@/lib/commission';

// PATCH: Update secondary application details or stage
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string; appId: string }> }
) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId, appId } = params;
    const body = await req.json();
    const { targetCountry, targetCourse, targetUniversity, stage, makePrimary } = body;

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: { applicant: true },
    });

    if (!application || application.applicantId !== applicantId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify same organization
    if (application.applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (makePrimary) {
      const oldPrimaryCountry = application.applicant.targetCountry;
      const oldPrimaryCourse = application.applicant.targetCourse;
      const oldPrimaryUniversity = application.applicant.targetUniversity;
      const oldPrimaryStage = application.applicant.pipelineStage;
      const oldPrimaryDays = application.applicant.daysInCurrentStage;

      const newPrimaryCountry = application.targetCountry;
      const newPrimaryCourse = application.targetCourse;
      const newPrimaryUniversity = application.targetUniversity;
      const newPrimaryStage = application.stage;
      const newPrimaryDays = application.daysInStage;

      await prisma.applicant.update({
        where: { id: applicantId },
        data: {
          targetCountry: newPrimaryCountry,
          targetCourse: newPrimaryCourse,
          targetUniversity: newPrimaryUniversity,
          pipelineStage: newPrimaryStage,
          daysInCurrentStage: newPrimaryDays,
          stageUpdatedAt: new Date(),
        },
      });

      // Auto-create commission ledger entry if stage is VISA_FILED
      if (newPrimaryStage === PipelineStage.VISA_FILED) {
        await createCommissionIfVisaFiled(applicantId, prisma);
      }

      await prisma.application.update({
        where: { id: appId },
        data: {
          targetCountry: oldPrimaryCountry || 'Undecided',
          targetCourse: oldPrimaryCourse || 'Undecided',
          targetUniversity: oldPrimaryUniversity,
          stage: oldPrimaryStage,
          daysInStage: oldPrimaryDays,
        },
      });

      await prisma.communicationLog.create({
        data: {
          type: CommunicationType.NOTE,
          title: 'Primary Target Changed',
          content: `Promoted ${newPrimaryCountry} (${newPrimaryUniversity || 'N/A'}) to Primary Target. Demoted ${oldPrimaryCountry} (${oldPrimaryUniversity || 'N/A'}) to secondary.`,
          senderName: authUser.name,
          applicantId,
        },
      });

      return NextResponse.json({ success: true });
    }

    const oldStage = application.stage;

    // Update fields
    const updated = await prisma.application.update({
      where: { id: appId },
      data: {
        targetCountry: targetCountry !== undefined ? targetCountry : undefined,
        targetCourse: targetCourse !== undefined ? targetCourse : undefined,
        targetUniversity: targetUniversity !== undefined ? targetUniversity : undefined,
        stage: stage !== undefined ? (stage as PipelineStage) : undefined,
        daysInStage: stage !== undefined && stage !== oldStage ? 0 : undefined,
      },
    });

    // If stage changed, log a stage promotion in the communication timeline
    if (stage && stage !== oldStage) {
      await prisma.communicationLog.create({
        data: {
          type: CommunicationType.NOTE,
          title: 'Application Stage Updated',
          content: `Updated application for ${application.targetCountry} (${updated.targetUniversity || 'N/A'}) stage from ${oldStage.replace('_', ' ')} to ${stage.replace('_', ' ')}.`,
          senderName: authUser.name,
          applicantId,
        },
      });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove secondary application
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string; appId: string }> }
) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId, appId } = params;

    const application = await prisma.application.findUnique({
      where: { id: appId },
      include: { applicant: true },
    });

    if (!application || application.applicantId !== applicantId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify same organization
    if (application.applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete application record
    await prisma.application.delete({
      where: { id: appId },
    });

    // Seed timeline log for application deletion
    await prisma.communicationLog.create({
      data: {
        type: CommunicationType.NOTE,
        title: 'Application Removed',
        content: `Removed secondary target application for ${application.targetCountry} (${application.targetUniversity || 'N/A'}).`,
        senderName: authUser.name,
        applicantId,
      },
    });

    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (error: any) {
    console.error('Delete application error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
