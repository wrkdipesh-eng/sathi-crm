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
    if (!visitor || visitor.deletedAt) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    if (!(await checkAccess(authUser, visitor))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, source, note, status, convertedApplicantId, branchId } = body;

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
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
    if (email && email !== visitor.email) {
      const existingVisitor = await prisma.visitor.findFirst({
        where: { email, organizationId: visitor.organizationId, id: { not: id } },
      });
      if (existingVisitor) {
        return NextResponse.json({ error: 'A visitor with this email already exists' }, { status: 400 });
      }
    }
    if (phone && phone !== visitor.phone) {
      const existingVisitor = await prisma.visitor.findFirst({
        where: { phone, organizationId: visitor.organizationId, id: { not: id } },
      });
      if (existingVisitor) {
        return NextResponse.json({ error: 'A visitor with this phone number already exists' }, { status: 400 });
      }
    }

    const accessFilter = getVisitorAccessQueryFilter(authUser) as any;
    if (branchId !== undefined) {
      if (!branchId) {
        return NextResponse.json({ error: 'Branch is required' }, { status: 400 });
      }
      if (accessFilter.branchId && accessFilter.branchId !== branchId) {
        return NextResponse.json({ error: 'Forbidden: Cannot move a visitor outside your own branch' }, { status: 403 });
      }
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
        branchId: branchId !== undefined ? branchId : undefined,
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

// DELETE: Soft-delete a visitor log entry -- moves it to the Trash section
// instead of destroying it. Only a SUPERADMIN can restore or permanently
// delete it from there (see /api/trash/visitors).
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const visitor = await prisma.visitor.findUnique({ where: { id } });
    if (!visitor || visitor.deletedAt) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    if (!(await checkAccess(authUser, visitor))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.visitor.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: authUser.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete visitor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
