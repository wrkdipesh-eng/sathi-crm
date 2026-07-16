import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { DocumentStatus } from '@prisma/client';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, fileUrl } = body;

    if (status && !Object.values(DocumentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid document status' }, { status: 400 });
    }

    // Find the document and check if it belongs to this org
    const document = await prisma.document.findUnique({
      where: { id },
      include: { applicant: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update document
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: status || undefined,
        fileUrl: fileUrl || undefined,
        verifiedById: status === DocumentStatus.VERIFIED ? authUser.userId : undefined,
      },
    });

    // Create a timeline note about the document change
    await prisma.communicationLog.create({
      data: {
        type: 'NOTE',
        title: 'Document Updated',
        content: `Document "${document.name}" status updated to "${status || document.status}".`,
        senderName: authUser.name,
        applicantId: document.applicantId,
      },
    });

    return NextResponse.json({ success: true, document: updatedDoc });
  } catch (error: any) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
