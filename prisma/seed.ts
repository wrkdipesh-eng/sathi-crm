import 'dotenv/config';
import { PrismaClient, Role, PipelineStage, DocumentStatus, CommunicationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.commissionLedger.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.pipelineStageLog.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.destinationChecklist.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Existing data cleared.');

  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Thinkcone Study Abroad',
    },
  });

  console.log(`Created Organization: ${org.name}`);

  // 2b. Seed Destinations & Checklists
  console.log('Seeding dynamic destinations and checklists...');
  await prisma.destination.create({
    data: {
      countryName: 'Australia',
      organizationId: org.id,
      checklists: {
        create: [
          { documentName: 'Passport Copy', documentType: 'PASSPORT' },
          { documentName: 'Academic Transcripts & Character Certificates', documentType: 'ACADEMIC_TRANSCRIPT' },
          { documentName: 'IELTS/PTE Score Card', documentType: 'ACADEMIC_TRANSCRIPT' },
          { documentName: 'No Objection Certificate (NOC)', documentType: 'NOC' },
          { documentName: '3-Month Bank Statement / Education Loan', documentType: 'BANK_STATEMENT' },
        ]
      }
    }
  });

  await prisma.destination.create({
    data: {
      countryName: 'Canada',
      organizationId: org.id,
      checklists: {
        create: [
          { documentName: 'Passport Copy', documentType: 'PASSPORT' },
          { documentName: 'Academic Transcripts', documentType: 'ACADEMIC_TRANSCRIPT' },
          { documentName: 'IELTS/PTE Score Card', documentType: 'ACADEMIC_TRANSCRIPT' },
          { documentName: 'GIC Deposit Receipt', documentType: 'BANK_STATEMENT' },
          { documentName: 'Letter of Explanation (SOP)', documentType: 'OTHER' },
        ]
      }
    }
  });

  await prisma.destination.create({
    data: {
      countryName: 'UK',
      organizationId: org.id,
      checklists: {
        create: [
          { documentName: 'Passport Copy', documentType: 'PASSPORT' },
          { documentName: 'Academic Transcripts', documentType: 'ACADEMIC_TRANSCRIPT' },
          { documentName: 'Confirmation of Acceptance for Studies (CAS)', documentType: 'OTHER' },
          { documentName: 'TB Test Report', documentType: 'OTHER' },
          { documentName: 'Bank Statement (28-day rule)', documentType: 'BANK_STATEMENT' },
        ]
      }
    }
  });

  await prisma.destination.create({
    data: {
      countryName: 'USA',
      organizationId: org.id,
      checklists: {
        create: [
          { documentName: 'Passport Copy', documentType: 'PASSPORT' },
          { documentName: 'Academic Transcripts', documentType: 'ACADEMIC_TRANSCRIPT' },
          { documentName: 'I-20 Form', documentType: 'OTHER' },
          { documentName: 'DS-160 Confirmation Page', documentType: 'OTHER' },
          { documentName: 'SEVIS Fee Receipt', documentType: 'OTHER' },
          { documentName: 'Bank Balance Certificate & Sponsor Letters', documentType: 'BANK_STATEMENT' },
        ]
      }
    }
  });

  console.log('Finished seeding destinations.');

  // 3. Create Branches
  const ktmBranch = await prisma.branch.create({
    data: {
      name: 'Kathmandu HQ',
      organizationId: org.id,
    },
  });

  const pokharaBranch = await prisma.branch.create({
    data: {
      name: 'Pokhara Branch',
      organizationId: org.id,
    },
  });

  const butwalBranch = await prisma.branch.create({
    data: {
      name: 'Butwal Branch',
      organizationId: org.id,
    },
  });

  console.log('Created branches.');

  // 4. Create Users (passwords = 'password123')
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const director = await prisma.user.create({
    data: {
      email: 'director@thinkcone.com.np',
      passwordHash,
      name: 'Binod Adhikari',
      role: Role.DIRECTOR,
      organizationId: org.id,
    },
  });

  const ktmMgr = await prisma.user.create({
    data: {
      email: 'ktm.mgr@thinkcone.com.np',
      passwordHash,
      name: 'Sushil Kafle',
      role: Role.BRANCH_MANAGER,
      organizationId: org.id,
      branchId: ktmBranch.id,
    },
  });

  const pokharaMgr = await prisma.user.create({
    data: {
      email: 'pokhara.mgr@thinkcone.com.np',
      passwordHash,
      name: 'Tara Sharma',
      role: Role.BRANCH_MANAGER,
      organizationId: org.id,
      branchId: pokharaBranch.id,
    },
  });

  const counselor1 = await prisma.user.create({
    data: {
      email: 'counselor.ktm1@thinkcone.com.np',
      passwordHash,
      name: 'Pooja Shrestha',
      role: Role.COUNSELOR,
      organizationId: org.id,
      branchId: ktmBranch.id,
    },
  });

  const counselor2 = await prisma.user.create({
    data: {
      email: 'counselor.pokhara1@thinkcone.com.np',
      passwordHash,
      name: 'Ramesh Thapa',
      role: Role.COUNSELOR,
      organizationId: org.id,
      branchId: pokharaBranch.id,
    },
  });

  const finance = await prisma.user.create({
    data: {
      email: 'finance@thinkcone.com.np',
      passwordHash,
      name: 'Niranjan Poudel',
      role: Role.FINANCE,
      organizationId: org.id,
      branchId: ktmBranch.id,
    },
  });

  const subAgent = await prisma.user.create({
    data: {
      email: 'subagent.ram@thinkcone.com.np',
      passwordHash,
      name: 'Ram Prasad District Agent',
      role: Role.SUB_AGENT,
      organizationId: org.id,
      subAgentCommissionSplit: 0.40, // 40% split
    },
  });

  console.log('Created users/roles.');

  // 5. Create Applicants
  // Applicant 1: Stuck in INQUIRY for 12 days in Kathmandu HQ
  const app1 = await prisma.applicant.create({
    data: {
      name: 'Aayush Bhandari',
      email: 'aayush.bhandari@gmail.com',
      phone: '9841234567',
      academicHistory: '+2 Science from CCRC, GPA 3.4',
      testScores: { ielts: 6.5, listening: 7.0, reading: 6.0, writing: 6.0, speaking: 7.0 },
      targetCountry: 'Australia',
      targetCourse: 'Bachelor of Information Technology',
      targetUniversity: 'Macquarie University',
      source: 'WALK_IN',
      pipelineStage: PipelineStage.INQUIRY,
      daysInCurrentStage: 12,
      stageUpdatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      branchId: ktmBranch.id,
      counselorId: counselor1.id,
      creatorId: ktmMgr.id,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      guardians: {
        create: {
          name: 'Hari Prasad Bhandari',
          relation: 'Father',
          phone: '9801234567',
          email: 'hari.bhandari@gmail.com',
        },
      },
    },
  });

  // Applicant 2: Counselling stage in Kathmandu
  const app2 = await prisma.applicant.create({
    data: {
      name: 'Bipana Karki',
      email: 'bipana.karki@outlook.com',
      phone: '9851098765',
      academicHistory: 'BBS from Shanker Dev Campus, 65%',
      testScores: { pte: 58, listening: 56, reading: 60, writing: 58, speaking: 58 },
      targetCountry: 'Canada',
      targetCourse: 'Post Graduate Diploma in Global Business Management',
      targetUniversity: 'Humber College',
      source: 'FACEBOOK_AD',
      pipelineStage: PipelineStage.COUNSELLING,
      daysInCurrentStage: 4,
      stageUpdatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      branchId: ktmBranch.id,
      counselorId: counselor1.id,
      creatorId: counselor1.id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      guardians: {
        create: {
          name: 'Saraswati Karki',
          relation: 'Mother',
          phone: '9811223344',
        },
      },
    },
  });

  // Applicant 3: Stuck in APPLICATION_SUBMITTED for 15 days in Pokhara
  const app3 = await prisma.applicant.create({
    data: {
      name: 'Chandan Gurung',
      email: 'chandan.g@gmail.com',
      phone: '9866123456',
      academicHistory: '+2 Management from Pokhara Academy, GPA 3.1',
      testScores: { ielts: 6.0, listening: 6.0, reading: 5.5, writing: 6.0, speaking: 6.5 },
      targetCountry: 'UK',
      targetCourse: 'BA (Hons) Business Administration',
      targetUniversity: 'Coventry University',
      source: 'WEB_FORM',
      pipelineStage: PipelineStage.APPLICATION_SUBMITTED,
      daysInCurrentStage: 15,
      stageUpdatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      branchId: pokharaBranch.id,
      counselorId: counselor2.id,
      creatorId: counselor2.id,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      guardians: {
        create: {
          name: 'Man Bahadur Gurung',
          relation: 'Father',
          phone: '9846123456',
        },
      },
    },
  });

  // Applicant 4: Lead from Sub-agent Ram in Butwal (OFFER stage)
  const app4 = await prisma.applicant.create({
    data: {
      name: 'Deepak Thapa',
      email: 'deepak.thapa@gmail.com',
      phone: '9847123456',
      academicHistory: 'BSc CSIT from Butwal Multiple Campus, GPA 3.65',
      testScores: { gre: 312, toefl: 98 },
      targetCountry: 'USA',
      targetCourse: 'Master of Science in Computer Science',
      targetUniversity: 'University of Texas at Arlington',
      source: 'SUB_AGENT',
      pipelineStage: PipelineStage.OFFER,
      daysInCurrentStage: 3,
      stageUpdatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      branchId: butwalBranch.id,
      subAgentId: subAgent.id,
      counselorId: counselor1.id, // Assigned to KTM Counselor for processing
      creatorId: subAgent.id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      guardians: {
        create: {
          name: 'Prem Thapa',
          relation: 'Father',
          phone: '9807123456',
        },
      },
    },
  });

  // Applicant 5: Visa Filed in Kathmandu
  const app5 = await prisma.applicant.create({
    data: {
      name: 'Elina Rijal',
      email: 'elina.rijal@gmail.com',
      phone: '9818877665',
      academicHistory: 'B.E. Civil Engineering from Pulchowk Campus, GPA 3.2',
      testScores: { pte: 69, listening: 65, reading: 70, writing: 72, speaking: 68 },
      targetCountry: 'Australia',
      targetCourse: 'Master of Engineering Science',
      targetUniversity: 'UNSW Sydney',
      source: 'WALK_IN',
      pipelineStage: PipelineStage.VISA_FILED,
      daysInCurrentStage: 8,
      stageUpdatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      branchId: ktmBranch.id,
      counselorId: counselor1.id,
      creatorId: counselor1.id,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      guardians: {
        create: {
          name: 'Gopal Rijal',
          relation: 'Father',
          phone: '9841334455',
        },
      },
    },
  });

  // Applicant 6: Visa Decision (Approved) in Pokhara
  const app6 = await prisma.applicant.create({
    data: {
      name: 'Futi Sherpa',
      email: 'futi.sherpa@gmail.com',
      phone: '9803123456',
      academicHistory: 'B.Sc. Nursing from Pokhara University, GPA 3.5',
      testScores: { ielts: 7.0 },
      targetCountry: 'Canada',
      targetCourse: 'Master of Nursing',
      targetUniversity: 'University of British Columbia',
      source: 'SUB_AGENT',
      subAgentId: subAgent.id,
      pipelineStage: PipelineStage.VISA_GRANTED,
      daysInCurrentStage: 2,
      stageUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      branchId: pokharaBranch.id,
      counselorId: counselor2.id,
      creatorId: counselor2.id,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      guardians: {
        create: {
          name: 'Nima Sherpa',
          relation: 'Father',
          phone: '9803009988',
        },
      },
    },
  });

  console.log('Created applicants.');

  // 6. Pre-seed checklist template documents from database templates
  const seedDocs = async (applicantId: string, country: string) => {
    const dest = await prisma.destination.findFirst({
      where: { countryName: country },
      include: { checklists: true },
    });

    const list = dest?.checklists || [];
    for (const item of list) {
      let status: DocumentStatus = DocumentStatus.NOT_SUBMITTED;
      if (item.documentName === 'Passport Copy') {
        status = DocumentStatus.VERIFIED;
      } else if (item.documentName.includes('Academic') || item.documentName.includes('Score Card')) {
        status = DocumentStatus.VERIFIED;
      } else if (item.documentName.includes('NOC') || item.documentName.includes('Bank') || item.documentName.includes('GIC') || item.documentName.includes('I-20')) {
        status = DocumentStatus.SUBMITTED;
      }
      
      await prisma.document.create({
        data: {
          name: item.documentName,
          type: item.documentType,
          status,
          applicantId,
          fileUrl: status !== DocumentStatus.NOT_SUBMITTED ? `https://storage.googleapis.com/sathi-crm-bucket/docs/${applicantId}_${item.documentType.toLowerCase()}.pdf` : null,
        },
      });
    }
  };

  const allApplicants = [app1, app2, app3, app4, app5, app6];
  for (const app of allApplicants) {
    await seedDocs(app.id, app.targetCountry);
  }

  console.log('Seeded documents checklists.');

  // 7. Create Communication Logs (Timeline entries)
  for (const app of allApplicants) {
    // Basic walk-in notes
    await prisma.communicationLog.create({
      data: {
        type: CommunicationType.NOTE,
        title: 'Initial Inquiry Note',
        content: `Walked in/submitted form expressing interest to study in ${app.targetCountry}. Expressed interest in ${app.targetCourse} at ${app.targetUniversity || 'various institutions'}. Academics and test scores discussed.`,
        senderName: 'System / Form',
        applicantId: app.id,
        createdAt: new Date(app.createdAt.getTime() + 1 * 60 * 60 * 1000),
      },
    });

    // Follow up task
    await prisma.communicationLog.create({
      data: {
        type: CommunicationType.TASK,
        title: 'Document collection follow-up',
        content: 'Follow up with student to collect remaining academic documents, transcripts, and financial papers.',
        status: app.pipelineStage !== PipelineStage.INQUIRY ? 'COMPLETED' : 'PENDING',
        senderName: 'System',
        applicantId: app.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(app.createdAt.getTime() + 2 * 60 * 60 * 1000),
      },
    });

    // Message log
    await prisma.communicationLog.create({
      data: {
        type: CommunicationType.WHATSAPP,
        title: 'Sent Checklist via WhatsApp',
        content: `Dear ${app.name}, hope you are doing well. Please find the document checklist for your ${app.targetCountry} student visa application attached here. Let us know if you have any questions. - Thinkcone Study Abroad`,
        status: 'SENT',
        senderName: 'System',
        applicantId: app.id,
        createdAt: new Date(app.createdAt.getTime() + 24 * 60 * 60 * 1000),
      },
    });
  }

  // Extra entries for App 5 (Visa Filed)
  await prisma.communicationLog.create({
    data: {
      type: CommunicationType.NOTE,
      title: 'Visa Application Filed',
      content: 'Biometrics completed and visa file successfully submitted to the immigration portal. Fees paid.',
      senderName: 'Pooja Shrestha',
      applicantId: app5.id,
      createdAt: new Date(app5.stageUpdatedAt),
    },
  });

  // Extra entries for App 6 (Visa Decision)
  await prisma.communicationLog.create({
    data: {
      type: CommunicationType.NOTE,
      title: 'Visa Approved!',
      content: 'Passport received back with positive visa decision sticker. Student notified and extremely happy.',
      senderName: 'Ramesh Thapa',
      applicantId: app6.id,
      createdAt: new Date(app6.stageUpdatedAt),
    },
  });

  console.log('Seeded communication/timeline logs.');

  // 8. Create Commission Ledger
  // For App 5 (Visa Filed) - PENDING Commission
  await prisma.commissionLedger.create({
    data: {
      applicantId: app5.id,
      partnerUniversity: app5.targetUniversity || 'UNSW Sydney',
      commissionAmountForeign: 2500.0, // AUD
      currency: 'AUD',
      nprExchangeRate: 89.20, // snapshot at time of visa filed
      commissionAmountNpr: 2500.0 * 89.20, // 223,000 NPR
      subAgentAmountNpr: 0.0, // No sub-agent for this lead
      hqAmountNpr: 2500.0 * 89.20,
      status: 'PENDING',
      createdAt: new Date(app5.stageUpdatedAt),
    },
  });

  // For App 6 (Visa Decision / Approved) - RECEIVED Commission with Sub-agent split
  const totalCommissionAud = 3000.0;
  const exchangeRate = 89.45;
  const totalCommissionNpr = totalCommissionAud * exchangeRate; // 268,350 NPR
  const splitPercent = 0.40;
  const subAgentAmount = totalCommissionNpr * splitPercent; // 107,340 NPR
  const hqAmount = totalCommissionNpr - subAgentAmount; // 161,010 NPR

  await prisma.commissionLedger.create({
    data: {
      applicantId: app6.id,
      partnerUniversity: app6.targetUniversity || 'University of British Columbia',
      commissionAmountForeign: totalCommissionAud, // CAD
      currency: 'CAD',
      nprExchangeRate: exchangeRate,
      commissionAmountNpr: totalCommissionNpr,
      subAgentAmountNpr: subAgentAmount,
      hqAmountNpr: hqAmount,
      invoiceNumber: 'INV-2026-0001',
      invoiceGeneratedAt: new Date(app6.stageUpdatedAt),
      status: 'RECEIVED',
      createdAt: new Date(app6.stageUpdatedAt),
    },
  });

  console.log('Seeded commission ledger.');

  // 9. Create Pipeline Stage Logs to track historical transitions
  const logsToCreate = [
    { applicantId: app1.id, stage: PipelineStage.INQUIRY, enteredAt: app1.createdAt },
    { applicantId: app2.id, stage: PipelineStage.INQUIRY, enteredAt: app2.createdAt, exitedAt: new Date(app2.createdAt.getTime() + 6 * 24 * 60 * 60 * 1000), durationDays: 6 },
    { applicantId: app2.id, stage: PipelineStage.COUNSELLING, enteredAt: new Date(app2.createdAt.getTime() + 6 * 24 * 60 * 60 * 1000) },
    { applicantId: app3.id, stage: PipelineStage.INQUIRY, enteredAt: app3.createdAt, exitedAt: new Date(app3.createdAt.getTime() + 4 * 24 * 60 * 60 * 1000), durationDays: 4 },
    { applicantId: app3.id, stage: PipelineStage.COUNSELLING, enteredAt: new Date(app3.createdAt.getTime() + 4 * 24 * 60 * 60 * 1000), exitedAt: new Date(app3.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000), durationDays: 6 },
    { applicantId: app3.id, stage: PipelineStage.APPLICATION_SUBMITTED, enteredAt: new Date(app3.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000) },
  ];

  for (const logItem of logsToCreate) {
    await prisma.pipelineStageLog.create({
      data: logItem,
    });
  }

  console.log('Seeded pipeline stage logs.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
