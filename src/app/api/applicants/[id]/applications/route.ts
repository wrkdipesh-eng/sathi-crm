import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { PipelineStage, DocumentStatus, CommunicationType } from '@prisma/client';

// GET: List all applications for a student (excluding primary fields)
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId } = params;

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Verify same organization
    if (applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('List applications error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new university application target for a student
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId } = params;
    const body = await req.json();
    const { targetCountry, targetCourse, targetUniversity } = body;

    if (!targetCountry || !targetCourse) {
      return NextResponse.json({ error: 'Target country and target course are required' }, { status: 400 });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Verify same organization
    if (applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate if primary pipeline stage is VISA_FILED or beyond
    const blockStages: PipelineStage[] = [
      PipelineStage.VISA_FILED,
      PipelineStage.VISA_GRANTED,
      PipelineStage.VISA_REFUSED,
      PipelineStage.PRE_DEPARTURE,
    ];
    if (blockStages.includes(applicant.pipelineStage)) {
      return NextResponse.json(
        { error: 'Cannot add a secondary target once the primary target has filed for a visa.' },
        { status: 400 }
      );
    }

    // Create the Application record
    const application = await prisma.application.create({
      data: {
        applicantId,
        targetCountry,
        targetCourse,
        targetUniversity: targetUniversity || null,
        stage: PipelineStage.INQUIRY,
        daysInStage: 0,
      },
    });

    // Automatically seed any missing checklist documents for the new target country
    const destination = await prisma.destination.findFirst({
      where: {
        countryName: targetCountry,
        organizationId: authUser.organizationId,
      },
      include: {
        checklists: true,
      },
    });

    if (destination && destination.checklists.length > 0) {
      for (const item of destination.checklists) {
        // Prevent duplicate documents in the student's global checklist repository
        const existingDoc = await prisma.document.findFirst({
          where: {
            applicantId,
            name: item.documentName,
          },
        });
        if (!existingDoc) {
          await prisma.document.create({
            data: {
              name: item.documentName,
              type: item.documentType,
              status: DocumentStatus.NOT_SUBMITTED,
              applicantId,
            },
          });
        }
      }
    }

    // Seed timeline log for application creation
    await prisma.communicationLog.create({
      data: {
        type: CommunicationType.NOTE,
        title: 'New Application Added',
        content: `Added secondary target application. Country: ${targetCountry}, Course: ${targetCourse}, University: ${targetUniversity || 'N/A'}.`,
        senderName: authUser.name,
        applicantId,
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
