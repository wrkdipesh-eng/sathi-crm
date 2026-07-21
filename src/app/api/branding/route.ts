import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const org = await prisma.organization.findFirst({
      select: {
        name: true,
        tagline: true,
        logoUrl: true,
        logoIcon: true,
        faviconUrl: true,
        titleTag: true,
      },
    });

    if (!org) {
      return NextResponse.json({ success: false, error: 'No organization found' });
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    console.error('Fetch public branding error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
