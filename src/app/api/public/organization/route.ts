import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({
      select: {
        name: true,
        tagline: true,
        logoUrl: true,
        logoIcon: true,
      },
    });

    if (!org) {
      return NextResponse.json({
        success: true,
        organization: {
          name: 'Thinkcone CRM',
          tagline: 'Designed for Nepali consultancies to manage branch operations, tracking applications from initial inquiry through visa decisions, document management, and sub-agent commission ledgers.',
          logoUrl: null,
          logoIcon: 'ShieldCheck',
        },
      });
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    console.error('Fetch public organization info error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
