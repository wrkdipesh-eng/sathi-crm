import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || (authUser.role !== 'SUPERADMIN' && authUser.role !== 'DIRECTOR' && authUser.role !== 'FINANCE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceNumber, updates, status } = body; 

    if (!invoiceNumber || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invoice number and updates array are required' }, { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(
      updates.map((up: any) =>
        prisma.commissionLedger.update({
          where: { id: up.id },
          data: {
            invoiceNumber,
            invoiceGeneratedAt: now,
            commissionAmountForeign: parseFloat(up.commissionAmountForeign),
            commissionAmountNpr: parseFloat(up.commissionAmountNpr),
            subAgentAmountNpr: parseFloat(up.subAgentAmountNpr),
            branchAmountNpr: parseFloat(up.branchAmountNpr),
            hqAmountNpr: parseFloat(up.hqAmountNpr),
            status: status || undefined,
          },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Bulk invoice generated and commissions updated successfully' });
  } catch (error: any) {
    console.error('Bulk invoice creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
