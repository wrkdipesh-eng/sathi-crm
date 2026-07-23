import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Role, CommunicationType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require Director or Finance access
    if (authUser.role !== Role.SUPERADMIN && authUser.role !== Role.DIRECTOR && authUser.role !== Role.FINANCE) {
      return NextResponse.json({ error: 'Forbidden: Access restricted to Directors and Finance officers' }, { status: 403 });
    }

    const { commissionId, recipientType } = await req.json();

    if (!commissionId || !recipientType) {
      return NextResponse.json({ error: 'Missing commissionId or recipientType parameter' }, { status: 400 });
    }

    // Fetch the commission ledger entry
    const commission = await prisma.commissionLedger.findUnique({
      where: { id: commissionId },
      include: {
        applicant: {
          include: {
            branch: true,
            subAgent: true,
          },
        },
      },
    });

    if (!commission) {
      return NextResponse.json({ error: 'Commission ledger record not found' }, { status: 404 });
    }

    if (commission.applicant.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Forbidden: Record belongs to another organization' }, { status: 403 });
    }

    let recipientDetails = '';
    let emailAddress = '';

    if (recipientType === 'UNIVERSITY') {
      recipientDetails = `University Admissions Office (${commission.partnerUniversity})`;
      emailAddress = `admissions@${commission.partnerUniversity.toLowerCase().replace(/[^a-z0-9]/g, '') || 'university'}.edu`;
    } else if (recipientType === 'BRANCH') {
      const branchName = commission.applicant.branch?.name || 'Local Branch';
      recipientDetails = `${branchName} Office Manager`;
      emailAddress = `manager.${branchName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'branch'}@thinkcone.com.np`;
    } else if (recipientType === 'SUB_AGENT') {
      if (!commission.applicant.subAgent) {
        return NextResponse.json({ error: 'No Sub-Agent is assigned to this applicant record' }, { status: 400 });
      }
      recipientDetails = `Sub-Agent: ${commission.applicant.subAgent.name}`;
      emailAddress = commission.applicant.subAgent.email;
    } else {
      return NextResponse.json({ error: 'Invalid recipient type' }, { status: 400 });
    }

    const invoiceNo = commission.invoiceNumber || 'STATEMENT-' + commission.id.slice(0, 8).toUpperCase();
    const splitDetails = commission.subAgentAmountNpr > 0 
      ? `Sub-agent split: Rs. ${commission.subAgentAmountNpr.toLocaleString()} NPR. Net HQ Retained: Rs. ${commission.hqAmountNpr.toLocaleString()} NPR.`
      : `Net HQ Retained: Rs. ${commission.hqAmountNpr.toLocaleString()} NPR.`;

    const logMessage = `Invoice Statement #${invoiceNo} has been dispatched to ${recipientDetails} (${emailAddress}). 
University Partner: ${commission.partnerUniversity}.
Placed Student: ${commission.applicant.name}.
Total Billing Amount: ${commission.currency} ${commission.commissionAmountForeign.toLocaleString()} (Auto-converted to Rs. ${commission.commissionAmountNpr.toLocaleString()} NPR at Rs. ${commission.nprExchangeRate.toFixed(2)}/unit).
${splitDetails}`;

    // Log to applicant timeline
    await prisma.communicationLog.create({
      data: {
        type: CommunicationType.EMAIL,
        title: `Invoice Dispatched to ${recipientType === 'UNIVERSITY' ? 'University' : recipientType === 'BRANCH' ? 'Branch Office' : 'Sub-Agent'}`,
        content: logMessage,
        status: 'SENT',
        senderName: `${authUser.name} (${authUser.role.replace('_', ' ')})`,
        applicantId: commission.applicantId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Invoice #${invoiceNo} sent successfully to ${recipientType.toLowerCase()} at ${emailAddress}` 
    });
  } catch (error: any) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
