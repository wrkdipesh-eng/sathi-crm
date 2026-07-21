import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, canWriteApplicant } from '@/lib/auth';
import { PipelineStage, CommunicationType } from '@prisma/client';
import { createCommissionIfVisaFiled } from '@/lib/commission';

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

      // 2. Open new stage log
      await tx.pipelineStageLog.create({
        data: {
          applicantId: id,
          stage: newStage,
          enteredAt: now,
        },
      });

      // 3. Update applicant stage fields
      const updated = await tx.applicant.update({
        where: { id },
        data: {
          pipelineStage: newStage,
          daysInCurrentStage: 0,
          stageUpdatedAt: now,
        },
      });

      // Auto-create commission ledger entry if stage is VISA_FILED
      if (newStage === PipelineStage.VISA_FILED) {
        await createCommissionIfVisaFiled(id, tx);
      }

      // 4. Create timeline transition log note
      await tx.communicationLog.create({
        data: {
          type: CommunicationType.NOTE,
          title: 'Stage Transitioned',
          content: `Pipeline stage updated from "${oldStage}" to "${newStage}".`,
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
