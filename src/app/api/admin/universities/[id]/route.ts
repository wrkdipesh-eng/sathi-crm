import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// PATCH: Update a partner university's details
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require Director access
    if (authUser.role !== Role.DIRECTOR) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, country, course, tuitionFee, intakes, commissionPercentage, type, portalName } = body;

    const university = await prisma.partnerUniversity.findUnique({
      where: { id },
    });

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    if (university.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.partnerUniversity.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        country: country !== undefined ? country.trim() : undefined,
        course: course !== undefined ? course.trim() : undefined,
        tuitionFee: tuitionFee !== undefined ? tuitionFee.trim() : undefined,
        intakes: intakes !== undefined ? intakes.trim() : undefined,
        commissionPercentage: commissionPercentage !== undefined 
          ? (commissionPercentage !== null && commissionPercentage !== '' && !isNaN(parseFloat(commissionPercentage)) ? parseFloat(commissionPercentage) : null)
          : undefined,
        type: type !== undefined ? (type === 'PORTAL' ? 'PORTAL' : 'DIRECT') : undefined,
        portalName: type !== undefined 
          ? (type === 'PORTAL' ? (portalName || '').trim() : null)
          : (portalName !== undefined ? portalName : undefined),
      },
    });

    return NextResponse.json({ success: true, university: updated });
  } catch (error: any) {
    console.error('Update university error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a partner university
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require Director access
    if (authUser.role !== Role.DIRECTOR) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = params;

    const university = await prisma.partnerUniversity.findUnique({
      where: { id },
    });

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    if (university.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.partnerUniversity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'University deleted successfully' });
  } catch (error: any) {
    console.error('Delete university error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
