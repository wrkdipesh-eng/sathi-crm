import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, getVisitorAccessQueryFilter } from '@/lib/auth';
import { verifyEmailDomain, isValidPhone } from '@/lib/validation';

const VALID_STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'NOT_INTERESTED'];

// GET: List visitors, branch-scoped by role
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const accessFilter = getVisitorAccessQueryFilter(authUser);

    const where: any = {
      AND: [
        accessFilter,
        { deletedAt: null },
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        status ? { status } : {},
        branchId ? { branchId } : {},
      ],
    };

    const visitors = await prisma.visitor.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, visitors });
  } catch (error: any) {
    console.error('Fetch visitors error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Log a new visitor (fast-capture -- only name is strictly required)
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SUB_AGENT / STUDENT_PORTAL have no visitor access at all
    const accessFilter = getVisitorAccessQueryFilter(authUser);
    if ((accessFilter as any).id === 'NONE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, source, note, branchId, status } = body;

    if (!name || !source) {
      return NextResponse.json({ error: 'Name and source are required' }, { status: 400 });
    }

    // Branch-scoped roles can only log a visitor at their own branch
    const resolvedBranchId = (accessFilter as any).branchId || branchId;
    if (!resolvedBranchId) {
      return NextResponse.json({ error: 'Branch is required' }, { status: 400 });
    }
    if ((accessFilter as any).branchId && (accessFilter as any).branchId !== branchId && branchId) {
      return NextResponse.json({ error: 'Forbidden: Cannot log a visitor outside your own branch' }, { status: 403 });
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
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (email) {
      const existingVisitor = await prisma.visitor.findFirst({
        where: { email, organizationId: authUser.organizationId },
      });
      if (existingVisitor) {
        return NextResponse.json({ error: 'A visitor with this email already exists' }, { status: 400 });
      }
    }
    if (phone) {
      const existingVisitor = await prisma.visitor.findFirst({
        where: { phone, organizationId: authUser.organizationId },
      });
      if (existingVisitor) {
        return NextResponse.json({ error: 'A visitor with this phone number already exists' }, { status: 400 });
      }
    }

    const visitor = await prisma.visitor.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        source,
        note: note || null,
        status: status || 'NEW',
        branchId: resolvedBranchId,
        organizationId: authUser.organizationId,
        loggedById: authUser.userId,
      },
      include: {
        branch: { select: { id: true, name: true } },
        loggedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, visitor });
  } catch (error: any) {
    console.error('Create visitor error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
