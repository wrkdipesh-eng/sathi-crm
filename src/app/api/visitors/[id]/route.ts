import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, getVisitorAccessQueryFilter } from '@/lib/auth';
import { verifyEmailDomain, isValidPhone } from '@/lib/validation';

const VALID_STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'NOT_INTERESTED'];

async function checkAccess(authUser: any, visitor: { organizationId: string; branchId: string }) {
  if (visitor.organizationId !== authUser.organizationId) return false;
  const accessFilter = getVisitorAccessQueryFilter(authUser) as any;
  if (accessFilter.id === 'NONE') return false;
  if (accessFilter.branchId && accessFilter.branchId !== visitor.branchId) return false;
  return true;
}

// PATCH: Update a visitor's details/status, or mark it converted into an Applicant
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    if (!(await checkAccess(authUser, visitor))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, source, note, status, convertedApplicantId } = body;

    if (email) {
      const emailCheck = await verifyEmailDomain(email);
      if (!emailCheck.valid) {
        return NextResponse.json({ error: emailCheck.reason || 'Invalid email address' }, { status: 400 });
      }
    }
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Mobile number is not a valid phone number' }, { status: 400 });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (convertedApplicantId !== undefined && status !== 'CONVERTED') {
      return NextResponse.json({ error: 'convertedApplicantId can only be set alongside status: CONVERTED' }, { status: 400 });
    }

    const updated = await prisma.visitor.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        source: source !== undefined ? source : undefined,
        note: note !== undefined ? note : undefined,
        status: status !== undefined ? status : undefined,
        convertedApplicantId: convertedApplicantId !== undefined ? convertedApplicantId : undefined,
      },
      include: {
        branch: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, visitor: updated });
  } catch (error: any) {
    console.error('Update visitor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a visitor log entry (e.g. duplicate/junk entry)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    if (!(await checkAccess(authUser, visitor))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.visitor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete visitor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
