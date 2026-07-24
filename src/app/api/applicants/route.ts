import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, getAccessQueryFilter } from '@/lib/auth';
import { PipelineStage, DocumentStatus, CommunicationType, Role } from '@prisma/client';
import { verifyEmailDomain, isValidPhone } from '@/lib/validation';

// Helper: Seed checklist based on country (dynamic from DB)
async function createChecklistDocs(applicantId: string, country: string, organizationId: string) {
  const destination = await prisma.destination.findFirst({
    where: {
      countryName: country,
      organizationId,
    },
    include: {
      checklists: true,
    },
  });

  if (destination && destination.checklists.length > 0) {
    for (const item of destination.checklists) {
      const existing = await prisma.document.findFirst({
        where: {
          applicantId,
          name: item.documentName,
        },
      });
      if (!existing) {
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
  } else {
    const fallbacks = [
      { name: 'Passport Copy', type: 'PASSPORT' },
      { name: 'Academic Transcripts', type: 'ACADEMIC_TRANSCRIPT' },
    ];
    for (const doc of fallbacks) {
      const existing = await prisma.document.findFirst({
        where: {
          applicantId,
          name: doc.name,
        },
      });
      if (!existing) {
        await prisma.document.create({
          data: {
            name: doc.name,
            type: doc.type,
            status: DocumentStatus.NOT_SUBMITTED,
            applicantId,
          },
        });
      }
    }
  }
}

// GET: List and filter applicants with RBAC & branch isolation
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') as PipelineStage | null;
    const branchId = searchParams.get('branchId');
    const counselorId = searchParams.get('counselorId');
    const source = searchParams.get('source');
    const university = searchParams.get('university');
    const stuck = searchParams.get('stuck') === 'true';
    const stuckThreshold = parseInt(searchParams.get('stuckThreshold') || '7', 10);
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const targetCountry = searchParams.get('targetCountry');

    // Enforce data-isolation filter criteria
    const accessFilter = getAccessQueryFilter(authUser);
    
    // Build search query conditions
    const where: any = {
      AND: [
        accessFilter,
        { deletedAt: null },
        // Search condition (Name, Email, or Phone)
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        // Filter by stage
        stage ? { pipelineStage: stage } : {},
        // Filter by priority
        priority
          ? priority === 'NONE'
            ? { priority: null }
            : { priority }
          : {},
        // Filter by category
        category
          ? category === 'LEAD'
            ? { pipelineStage: 'INQUIRY' }
            : category === 'INQUIRING'
            ? { pipelineStage: 'COUNSELLING' }
            : category === 'CLASS_ENROLLMENTS' || category === 'CLASS_ENROLLMENT'
            ? { pipelineStage: 'CLASS_ENROLLMENT' }
            : category === 'ABROAD_ENROLLMENTS' || category === 'ABROAD_ENROLLMENT'
            ? { pipelineStage: { in: ['APPLICATION_SUBMITTED', 'OFFER', 'VISA_FILED'] } }
            : category === 'VISA_GRANTED'
            ? { pipelineStage: { in: ['VISA_GRANTED', 'PRE_DEPARTURE'] } }
            : category === 'VISA_REFUSED'
            ? { OR: [{ pipelineStage: 'VISA_REFUSED' }, { everRefused: true }] }
            : {}
          : {},
        // Filter by target country
        targetCountry ? { targetCountry } : {},
        // Filter by branch
        branchId ? { branchId } : {},
        // Filter by counselor
        counselorId ? { counselorId } : {},
        // Filter by source
        source ? { source } : {},
        // Filter by university (primary or secondary)
        university
          ? {
              OR: [
                { targetUniversity: { contains: university, mode: 'insensitive' } },
                {
                  applications: {
                    some: {
                      targetUniversity: { contains: university, mode: 'insensitive' },
                    },
                  },
                },
              ],
            }
          : {},
        // Filter by stuck (days in stage exceeds threshold)
        stuck ? { daysInCurrentStage: { gte: stuckThreshold } } : {},
      ],
    };

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        counselor: { select: { id: true, name: true } },
        subAgent: { select: { id: true, name: true } },
        applications: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, applicants });
  } catch (error: any) {
    console.error('Fetch applicants error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new applicant & seed checklists
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      academicHistory,
      testScores, // object e.g. { ielts: 6.5 }
      targetCountry,
      targetCourse,
      targetUniversity,
      representationType,
      portalName,
      source,
      branchId,
      counselorId,
      subAgentId,
      subAgentCommissionSplit,
      branchCommissionSplit,
      priority,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianEmail,
    } = body;

    if (!name || !targetCountry || !source || !branchId) {
      return NextResponse.json(
        { error: 'Name, target country, source, and branch are required' },
        { status: 400 }
      );
    }

    // Counselors/Senior Counselors can self-assign or leave a new lead
    // unassigned, but cannot hand it directly to a different counselor.
    if (
      (authUser.role === Role.COUNSELOR || authUser.role === Role.SENIOR_COUNSELOR) &&
      counselorId &&
      counselorId !== authUser.userId
    ) {
      return NextResponse.json(
        { error: 'Counselors cannot assign a lead to another counselor' },
        { status: 403 }
      );
    }

    if (email) {
      const emailCheck = await verifyEmailDomain(email);
      if (!emailCheck.valid) {
        return NextResponse.json({ error: emailCheck.reason || 'Invalid email address' }, { status: 400 });
      }
    }
    if (guardianEmail) {
      const guardianEmailCheck = await verifyEmailDomain(guardianEmail);
      if (!guardianEmailCheck.valid) {
        return NextResponse.json({ error: guardianEmailCheck.reason || 'Invalid guardian email address' }, { status: 400 });
      }
    }
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Mobile number is not a valid phone number' }, { status: 400 });
    }
    if (guardianPhone && !isValidPhone(guardianPhone)) {
      return NextResponse.json({ error: 'Guardian phone number is not a valid phone number' }, { status: 400 });
    }

    if (email) {
      const existingApplicant = await prisma.applicant.findFirst({
        where: { email, organizationId: authUser.organizationId },
      });
      if (existingApplicant) {
        return NextResponse.json({ error: 'An applicant with this email already exists' }, { status: 400 });
      }
    }
    if (phone) {
      const existingApplicant = await prisma.applicant.findFirst({
        where: { phone, organizationId: authUser.organizationId },
      });
      if (existingApplicant) {
        return NextResponse.json({ error: 'An applicant with this phone number already exists' }, { status: 400 });
      }
    }

    // Determine subAgentId and custom split if source is SUB_AGENT
    const resolvedSubAgentId = source === 'SUB_AGENT' ? subAgentId : null;
    const resolvedSplit = source === 'SUB_AGENT' && subAgentCommissionSplit ? parseFloat(subAgentCommissionSplit) : null;

    // Create applicant
    const applicant = await prisma.applicant.create({
      data: {
        name,
        email,
        phone,
        academicHistory,
        testScores: testScores || {},
        targetCountry,
        targetCourse,
        targetUniversity,
        representationType: representationType || null,
        portalName: portalName || null,
        source,
        pipelineStage: PipelineStage.INQUIRY,
        daysInCurrentStage: 0,
        stageUpdatedAt: new Date(),
        organizationId: authUser.organizationId,
        branchId,
        counselorId: counselorId || null,
        creatorId: authUser.userId,
        subAgentId: resolvedSubAgentId || null,
        subAgentCommissionSplit: resolvedSplit || null,
        branchCommissionSplit: branchCommissionSplit ? parseFloat(branchCommissionSplit) : null,
        priority: priority || 'HOT', // Auto-assign HOT for new entries
        applicantStatus: 'INQUIRY', // Default status for new entries
        lastPriorityChangeAt: new Date(),
        priorityChangeReason: 'NEW_ENTRY',
        missedFollowUpCount: 0,
        // Optional Guardian
        guardians: guardianName && guardianRelation ? {
          create: {
            name: guardianName,
            relation: guardianRelation,
            phone: guardianPhone || null,
            email: guardianEmail || null,
          }
        } : undefined,
        // Log the first stage entry
        pipelineStageLogs: {
          create: {
            stage: PipelineStage.INQUIRY,
            enteredAt: new Date(),
          }
        },
        // Auto-seed communication log
        communicationLogs: {
          create: {
            type: CommunicationType.NOTE,
            title: 'Lead Created',
            content: `Applicant profile created. Target: ${targetCountry}, Course: ${targetCourse || 'N/A'}, Source: ${source}.`,
            senderName: authUser.name,
          }
        }
      },
    });

    // Auto-seed documents based on target country
    await createChecklistDocs(applicant.id, targetCountry, authUser.organizationId);

    // Return created applicant with all priority system fields
    return NextResponse.json({ success: true, applicant });
  } catch (error: any) {
    console.error('Create applicant error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
