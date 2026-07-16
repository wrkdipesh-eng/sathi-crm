import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { CommunicationType } from '@prisma/client';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: applicantId } = params;
    const body = await req.json();
    const { type, title, content, dueDate } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Type, title, and content are required' }, { status: 400 });
    }

    if (!Object.values(CommunicationType).includes(type)) {
      return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
    }

    // Verify applicant access
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    if (applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create log
    const log = await prisma.communicationLog.create({
      data: {
        type,
        title,
        content,
        dueDate: dueDate ? new Date(dueDate) : null,
        senderName: authUser.name,
        applicantId,
        status: type === 'TASK' ? 'PENDING' : 'SENT',
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error('Create communication log error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
