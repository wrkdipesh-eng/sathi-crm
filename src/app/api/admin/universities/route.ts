import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role, UniversityType } from '@prisma/client';

// GET: Retrieve all partner universities for the organization
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const universities = await prisma.partnerUniversity.findMany({
      where: { organizationId: authUser.organizationId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, universities });
  } catch (error: any) {
    console.error('List partner universities error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add new university (supports single creation or bulk array upload)
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require Director access
    if (authUser.role !== Role.DIRECTOR && authUser.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    if (Array.isArray(body)) {
      // Bulk insert
      const records = body.map((item: any) => ({
        name: item.name?.trim() || '',
        country: item.country?.trim() || '',
        course: item.course?.trim() || '',
        tuitionFee: item.tuitionFee?.trim() || '',
        intakes: item.intakes?.trim() || '',
        commissionPercentage: item.commissionPercentage !== undefined && item.commissionPercentage !== null && !isNaN(parseFloat(item.commissionPercentage)) ? parseFloat(item.commissionPercentage) : null,
        type: (item.type === 'PORTAL' ? 'PORTAL' : 'DIRECT') as UniversityType,
        portalName: item.type === 'PORTAL' ? (item.portalName || '').trim() : null,
        baseCommissionType: item.baseCommissionType || null,
        baseCommissionValue: item.baseCommissionValue !== undefined && item.baseCommissionValue !== null && !isNaN(parseFloat(item.baseCommissionValue)) ? parseFloat(item.baseCommissionValue) : null,
        bonusType: item.bonusType || null,
        bonusValue: item.bonusValue !== undefined && item.bonusValue !== null && !isNaN(parseFloat(item.bonusValue)) ? parseFloat(item.bonusValue) : null,
        slabs: item.slabs || null,
        organizationId: authUser.organizationId,
      })).filter((item: any) => item.name && item.country && item.course);

      if (records.length === 0) {
        return NextResponse.json({ error: 'No valid records to import. Name, Country, and Course are required fields.' }, { status: 400 });
      }

      const created = await prisma.partnerUniversity.createMany({
        data: records,
      });

      return NextResponse.json({ success: true, count: created.count });
    } else {
      // Single insert
      const {
        name,
        country,
        course,
        tuitionFee,
        intakes,
        commissionPercentage,
        type,
        portalName,
        baseCommissionType,
        baseCommissionValue,
        bonusType,
        bonusValue,
        slabs
      } = body;

      if (!name || !country || !course) {
        return NextResponse.json({ error: 'Name, country, and course are required fields' }, { status: 400 });
      }

      const created = await prisma.partnerUniversity.create({
        data: {
          name: name.trim(),
          country: country.trim(),
          course: course.trim(),
          tuitionFee: (tuitionFee || '').trim(),
          intakes: (intakes || '').trim(),
          commissionPercentage: commissionPercentage !== undefined && commissionPercentage !== null && commissionPercentage !== '' && !isNaN(parseFloat(commissionPercentage)) ? parseFloat(commissionPercentage) : null,
          type: type === 'PORTAL' ? 'PORTAL' : 'DIRECT',
          portalName: type === 'PORTAL' ? (portalName || '').trim() : null,
          baseCommissionType: baseCommissionType || null,
          baseCommissionValue: baseCommissionValue !== undefined && baseCommissionValue !== null && baseCommissionValue !== '' && !isNaN(parseFloat(baseCommissionValue)) ? parseFloat(baseCommissionValue) : null,
          bonusType: bonusType || null,
          bonusValue: bonusValue !== undefined && bonusValue !== null && bonusValue !== '' && !isNaN(parseFloat(bonusValue)) ? parseFloat(bonusValue) : null,
          slabs: slabs || undefined,
          organizationId: authUser.organizationId,
        },
      });

      return NextResponse.json({ success: true, university: created });
    }
  } catch (error: any) {
    console.error('Create partner university error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
