import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

function checkDirector(authUser: any) {
  return authUser && (authUser.role === Role.DIRECTOR || authUser.role === Role.SUPERADMIN);
}

// GET: Retrieve organization customization details
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: authUser!.organizationId },
      select: {
        id: true,
        name: true,
        tagline: true,
        logoUrl: true,
        logoIcon: true,
        faviconUrl: true,
        titleTag: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    console.error('Fetch organization details error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update organization branding details
export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, tagline, logoUrl, logoIcon, faviconUrl, titleTag } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization Name is required' }, { status: 400 });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: authUser!.organizationId },
      data: {
        name: name.trim(),
        tagline: tagline ? tagline.trim() : null,
        logoUrl: logoUrl ? logoUrl.trim() : null,
        logoIcon: logoIcon ? logoIcon.trim() : null,
        faviconUrl: faviconUrl ? faviconUrl.trim() : null,
        titleTag: titleTag ? titleTag.trim() : null,
      },
    });

    return NextResponse.json({ success: true, organization: updatedOrg });
  } catch (error: any) {
    console.error('Update organization branding error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
