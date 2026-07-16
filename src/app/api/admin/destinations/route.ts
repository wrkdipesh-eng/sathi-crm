import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

function checkDirector(authUser: any) {
  return authUser && authUser.role === Role.DIRECTOR;
}

// GET: Retrieve all destinations and their checklists
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let destinations = await prisma.destination.findMany({
      where: {
        organizationId: authUser.organizationId,
      },
      include: {
        checklists: {
          orderBy: {
            documentName: 'asc',
          },
        },
      },
      orderBy: {
        countryName: 'asc',
      },
    });

    // Auto-seed default destinations for this organization if none exist
    if (destinations.length === 0) {
      const defaults = [
        {
          countryName: 'Australia',
          checklists: [
            { documentName: 'Passport Copy', documentType: 'PASSPORT' },
            { documentName: 'Academic Transcripts & Character Certificates', documentType: 'ACADEMIC_TRANSCRIPT' },
            { documentName: 'IELTS/PTE Score Card', documentType: 'ACADEMIC_TRANSCRIPT' },
            { documentName: 'No Objection Certificate (NOC)', documentType: 'NOC' },
            { documentName: '3-Month Bank Statement / Education Loan', documentType: 'BANK_STATEMENT' },
          ]
        },
        {
          countryName: 'Canada',
          checklists: [
            { documentName: 'Passport Copy', documentType: 'PASSPORT' },
            { documentName: 'Academic Transcripts', documentType: 'ACADEMIC_TRANSCRIPT' },
            { documentName: 'IELTS/PTE Score Card', documentType: 'ACADEMIC_TRANSCRIPT' },
            { documentName: 'GIC Deposit Receipt', documentType: 'BANK_STATEMENT' },
            { documentName: 'Letter of Explanation (SOP)', documentType: 'OTHER' },
          ]
        },
        {
          countryName: 'UK',
          checklists: [
            { documentName: 'Passport Copy', documentType: 'PASSPORT' },
            { documentName: 'Academic Transcripts', documentType: 'ACADEMIC_TRANSCRIPT' },
            { documentName: 'Confirmation of Acceptance for Studies (CAS)', documentType: 'OTHER' },
            { documentName: 'TB Test Report', documentType: 'OTHER' },
            { documentName: 'Bank Statement (28-day rule)', documentType: 'BANK_STATEMENT' },
          ]
        },
        {
          countryName: 'USA',
          checklists: [
            { documentName: 'Passport Copy', documentType: 'PASSPORT' },
            { documentName: 'Academic Transcripts', documentType: 'ACADEMIC_TRANSCRIPT' },
            { documentName: 'I-20 Form', documentType: 'OTHER' },
            { documentName: 'DS-160 Confirmation Page', documentType: 'OTHER' },
            { documentName: 'SEVIS Fee Receipt', documentType: 'OTHER' },
            { documentName: 'Bank Balance Certificate & Sponsor Letters', documentType: 'BANK_STATEMENT' },
          ]
        }
      ];

      for (const item of defaults) {
        // Double check in case of race condition
        const existing = await prisma.destination.findFirst({
          where: {
            countryName: item.countryName,
            organizationId: authUser.organizationId,
          }
        });
        if (!existing) {
          await prisma.destination.create({
            data: {
              countryName: item.countryName,
              organizationId: authUser.organizationId,
              checklists: {
                create: item.checklists
              }
            }
          });
        }
      }

      // Re-fetch destinations after creation
      destinations = await prisma.destination.findMany({
        where: {
          organizationId: authUser.organizationId,
        },
        include: {
          checklists: {
            orderBy: {
              documentName: 'asc',
            },
          },
        },
        orderBy: {
          countryName: 'asc',
        },
      });
    }

    return NextResponse.json({ success: true, destinations });
  } catch (error: any) {
    console.error('Fetch destinations error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a new checklist item or a new destination country
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { destinationId, name, type, countryName } = body;

    // Handle creating a new Destination Country
    if (countryName) {
      const existing = await prisma.destination.findFirst({
        where: {
          countryName,
          organizationId: authUser!.organizationId
        }
      });

      if (existing) {
        return NextResponse.json({ error: 'Destination already exists' }, { status: 400 });
      }

      const dest = await prisma.destination.create({
        data: {
          countryName,
          organizationId: authUser!.organizationId
        }
      });

      return NextResponse.json({ success: true, destination: dest });
    }

    // Handle creating a checklist item
    if (!destinationId || !name || !type) {
      return NextResponse.json({ error: 'Missing destinationId, name, or type' }, { status: 400 });
    }

    // Check that the destination belongs to the user's organization
    const dest = await prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!dest || dest.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
    }

    const item = await prisma.destinationChecklist.create({
      data: {
        destinationId,
        documentName: name,
        documentType: type,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Create destination/checklist item error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update an existing checklist item
export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, type } = body;

    if (!id || !name || !type) {
      return NextResponse.json({ error: 'Missing id, name, or type' }, { status: 400 });
    }

    // Verify checklist item belongs to user's organization destination
    const itemCheck = await prisma.destinationChecklist.findUnique({
      where: { id },
      include: { destination: true },
    });

    if (!itemCheck || itemCheck.destination.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    const item = await prisma.destinationChecklist.update({
      where: { id },
      data: {
        documentName: name,
        documentType: type,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Update destination checklist item error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
