import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role } from '@prisma/client';

function checkDirector(authUser: any) {
  return authUser && authUser.role === Role.DIRECTOR;
}

// DELETE: Delete a checklist item or a destination country
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
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if id is a DestinationChecklist item
    const itemCheck = await prisma.destinationChecklist.findUnique({
      where: { id },
      include: { destination: true },
    });

    if (itemCheck) {
      if (itemCheck.destination.organizationId !== authUser!.organizationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      await prisma.destinationChecklist.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Checklist item deleted successfully' });
    }

    // Otherwise, check if id is a Destination country
    const destCheck = await prisma.destination.findUnique({
      where: { id },
    });

    if (destCheck) {
      if (destCheck.organizationId !== authUser!.organizationId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      await prisma.destination.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: 'Destination country deleted successfully' });
    }

    return NextResponse.json({ error: 'Checklist item or Destination not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Delete destination/checklist error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
