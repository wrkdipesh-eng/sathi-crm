import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

function checkDirector(authUser: any) {
  return authUser && authUser.role === Role.DIRECTOR;
}

// DELETE: Delete a checklist item
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const authUser = getAuthUser(req);
    if (!checkDirector(authUser)) {
      return NextResponse.json({ error: 'Forbidden: Director privileges required' }, { status: 403 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Checklist item ID is required' }, { status: 400 });
    }

    // Verify checklist item belongs to user's organization destination
    const itemCheck = await prisma.destinationChecklist.findUnique({
      where: { id },
      include: { destination: true },
    });

    if (!itemCheck || itemCheck.destination.organizationId !== authUser!.organizationId) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
    }

    await prisma.destinationChecklist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Checklist item deleted successfully' });
  } catch (error: any) {
    console.error('Delete destination checklist item error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
