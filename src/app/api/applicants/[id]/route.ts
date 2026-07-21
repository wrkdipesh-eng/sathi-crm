import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, canWriteApplicant } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET: Retrieve single applicant with full relations
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        counselor: { select: { id: true, name: true } },
        subAgent: { select: { id: true, name: true, subAgentCommissionSplit: true } },
        guardians: true,
        documents: { orderBy: { createdAt: 'asc' } },
        communicationLogs: { orderBy: { createdAt: 'desc' } },
        commissions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Enforce read access control
    // If Sub-agent: can only see their own leads
    if (authUser.role === Role.SUB_AGENT && applicant.subAgentId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If Counselor: can only see their assigned leads
    if (authUser.role === Role.COUNSELOR && applicant.counselorId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If Branch Manager: can only see leads in their branch
    if (
      authUser.role === Role.BRANCH_MANAGER &&
      applicant.branchId !== authUser.branchId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check Organization matches
    if (applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, applicant });
  } catch (error: any) {
    console.error('Fetch applicant detail error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH: Edit applicant details
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const applicant = await prisma.applicant.findUnique({
      where: { id },
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

    // Extract update data fields (excluding sensitive or specific transition endpoints)
    const {
      name,
      email,
      phone,
      academicHistory,
      testScores,
      targetCountry,
      targetCourse,
      targetUniversity,
      representationType,
      portalName,
      source,
      counselorId,
      subAgentId,
      subAgentCommissionSplit,
      branchCommissionSplit,
      priority,
    } = body;

    const updatedApplicant = await prisma.applicant.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        academicHistory,
        testScores: testScores || undefined,
        targetCountry,
        targetCourse,
        targetUniversity,
        representationType: representationType !== undefined ? (representationType || null) : undefined,
        portalName: portalName !== undefined ? (portalName || null) : undefined,
        source,
        counselorId: counselorId !== undefined ? counselorId : undefined,
        subAgentId: source === 'SUB_AGENT' ? subAgentId : (source !== undefined ? null : undefined),
        subAgentCommissionSplit: source === 'SUB_AGENT' 
          ? (subAgentCommissionSplit ? parseFloat(subAgentCommissionSplit) : null) 
          : (source !== undefined ? null : undefined),
        branchCommissionSplit: branchCommissionSplit !== undefined
          ? (branchCommissionSplit ? parseFloat(branchCommissionSplit) : null)
          : undefined,
        priority: priority !== undefined ? (priority || null) : undefined,
      },
    });

    return NextResponse.json({ success: true, applicant: updatedApplicant });
  } catch (error: any) {
    console.error('Update applicant error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove applicant
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const applicant = await prisma.applicant.findUnique({
      where: { id },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Restrict deletion to DIRECTORS or BRANCH_MANAGERS of the same branch
    const isDirector = authUser.role === Role.DIRECTOR;
    const isBranchManager = authUser.role === Role.BRANCH_MANAGER && authUser.branchId === applicant.branchId;

    if (!isDirector && !isBranchManager) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    await prisma.applicant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Applicant deleted successfully' });
  } catch (error: any) {
    console.error('Delete applicant error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
