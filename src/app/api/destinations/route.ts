import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET: Fetch list of study destinations for the organization
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
        orderBy: {
          countryName: 'asc',
        },
      });
    }

    return NextResponse.json({ success: true, destinations });
  } catch (error: any) {
    console.error('Fetch public destinations error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
