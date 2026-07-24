'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  BookOpen, 
  Award, 
  FileText, 
  Clock, 
  Send, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Pencil,
  Star
} from 'lucide-react';
import { isValidEmailFormat, isValidPhone } from '@/lib/validation';

const PROMOTE_OPTIONS = [
  'INQUIRY',
  'COUNSELLING',
  'APPLICATION_SUBMITTED',
  'OFFER',
  'VISA_FILED',
  'VISA_GRANTED',
  'VISA_REFUSED',
  'PRE_DEPARTURE'
];

// Priority is fully auto-calculated (creation date, commitment date, missed
// follow-ups, pipeline stage) — this just translates the machine reason code
// into a sentence so it's clear *why* a lead is HOT/WARM/COLD, not just that.
function describePriorityReason(applicant: any): string {
  const reason = applicant?.priorityChangeReason;
  const missed = applicant?.missedFollowUpCount || 0;
  const commitDate = applicant?.committedSubmissionDate
    ? new Date(applicant.committedSubmissionDate).toLocaleDateString()
    : null;

  switch (reason) {
    case 'NEW_ENTRY':
      return 'New lead — created within the last 7 days.';
    case 'SUBMISSION_COMMITTED':
      return commitDate ? `Committed to submit by ${commitDate}.` : 'Has a future submission commitment.';
    case 'COMMITMENT_MISSED':
      return commitDate ? `Committed submission date (${commitDate}) passed without submitting.` : 'Missed their committed submission date.';
    case 'FOLLOWUP_MISSED':
      return `${missed} follow-up${missed === 1 ? '' : 's'} overdue and not yet completed.`;
    case 'CONVERTED':
      return 'Application already submitted — no longer tracked as a lead.';
    case 'RE_ENGAGE':
      return 'Visa was refused — reset to HOT in case they reapply.';
    case 'STAGE_STUCK':
      return 'Stuck in the same stage for 7+ days with no commitment date set.';
    case 'STATUS_CHANGE':
      return 'Pipeline stage changed; priority itself was unaffected.';
    case 'AUTO_ASSIGNMENT':
      return 'Engaged lead, older than 7 days with no commitment date set.';
    default:
      return 'Not yet evaluated.';
  }
}

export default function ApplicantDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { id } = params;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [applicant, setApplicant] = useState<any>(null);

  const STAGES = applicant 
    ? [
        'INQUIRY',
        'COUNSELLING',
        'APPLICATION_SUBMITTED',
        'OFFER',
        'VISA_FILED',
        applicant.pipelineStage === 'VISA_REFUSED' ? 'VISA_REFUSED' : 'VISA_GRANTED',
        'PRE_DEPARTURE'
      ]
    : [
        'INQUIRY',
        'COUNSELLING',
        'APPLICATION_SUBMITTED',
        'OFFER',
        'VISA_FILED',
        'VISA_GRANTED',
        'PRE_DEPARTURE'
      ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'profile' | 'applications' | 'documents' | 'timeline'
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'documents' | 'timeline'>('profile');

  const [applications, setApplications] = useState<any[]>([]);
  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({ targetCountry: '', targetCourse: '', targetUniversity: '' });
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editAppForm, setEditAppForm] = useState({ targetCountry: '', targetCourse: '', targetUniversity: '' });
  const [partnerUnis, setPartnerUnis] = useState<any[]>([]);

  // Metadata dropdowns
  const [branches, setBranches] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [subAgents, setSubAgents] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // Edit / Input States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [stageLoading, setStageLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editRepType, setEditRepType] = useState<string>('DIRECT');

  // New Note/Task Form State
  const [noteForm, setNoteForm] = useState({ type: 'NOTE', title: '', content: '', dueDate: '' });
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const isVisaFiledOrBeyond = applicant ? [
    'VISA_FILED',
    'VISA_GRANTED',
    'VISA_REFUSED',
    'PRE_DEPARTURE'
  ].includes(applicant.pipelineStage) : false;

  // Fetch applicant details
  const fetchApplicantDetails = async () => {
    try {
      const res = await fetch(`/api/applicants/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load details');
      }
      setApplicant(data.applicant);
      setEditRepType(data.applicant.representationType || 'DIRECT');
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initPage() {
      // Get user
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }

        // Get metadata
        const metaRes = await fetch('/api/branches');
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setBranches(metaData.branches);
          setCounselors(metaData.counselors);
          setSubAgents(metaData.subAgents);
        }

        const destRes = await fetch('/api/destinations');
        if (destRes.ok) {
          const destData = await destRes.json();
          setCountries(destData.destinations || []);
        }

        const uniRes = await fetch('/api/admin/universities');
        if (uniRes.ok) {
          const uniData = await uniRes.json();
          setPartnerUnis(uniData.universities || []);
        }
      } catch (err) {
        console.error(err);
      }
      
      fetchApplicantDetails();
      fetchApplications();
    }

    initPage();
  }, [id]);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`/api/applicants/${id}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Fetch applications error:', err);
    }
  };

  const handleDeleteApplicant = async () => {
    if (!window.confirm("Are you sure you want to delete this student profile? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert("Student profile deleted successfully.");
        router.push('/dashboard/applicants');
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete student profile.");
        setIsDeleting(false);
      }
    } catch (err) {
      alert("An error occurred while deleting the student profile.");
      setIsDeleting(false);
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.targetCountry || !appForm.targetCourse) {
      alert("Please fill out Target Country and Target Course.");
      return;
    }
    setIsSavingApp(true);
    try {
      const res = await fetch(`/api/applicants/${id}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appForm),
      });
      if (res.ok) {
        setShowAppModal(false);
        setAppForm({ targetCountry: '', targetCourse: '', targetUniversity: '' });
        fetchApplications();
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add application.');
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleAppStageChange = async (appId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/applicants/${id}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        fetchApplications();
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update application stage.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  const handleAppDelete = async (appId: string) => {
    if (!window.confirm("Are you sure you want to delete this target application? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/applicants/${id}/applications/${appId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchApplications();
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete application.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  const handleStartEdit = (appId: string, currentData: any) => {
    setEditingAppId(appId);
    setEditAppForm({
      targetCountry: currentData.targetCountry || '',
      targetCourse: currentData.targetCourse || '',
      targetUniversity: currentData.targetUniversity || '',
    });
  };

  const handleSaveEdit = async (appId: string) => {
    try {
      if (appId === 'primary') {
        const res = await fetch(`/api/applicants/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editAppForm),
        });
        if (!res.ok) throw new Error('Failed to update primary target');
      } else {
        const res = await fetch(`/api/applicants/${id}/applications/${appId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editAppForm),
        });
        if (!res.ok) throw new Error('Failed to update secondary target');
      }
      setEditingAppId(null);
      await fetchApplicantDetails();
      fetchApplications();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save changes');
    }
  };

  const handleMakePrimary = async (appId: string) => {
    try {
      const res = await fetch(`/api/applicants/${id}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makePrimary: true }),
      });
      if (!res.ok) throw new Error('Failed to make primary');
      await fetchApplicantDetails();
      fetchApplications();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to change primary target');
    }
  };

  // Stage transition promoter
  const handleStageChange = async (newStage: string) => {
    setStageLoading(true);
    try {
      const res = await fetch(`/api/applicants/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStage }),
      });

      if (res.ok) {
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update stage');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStageLoading(false);
    }
  };

  // Edit Profile Form Submit
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const emailVal = (fd.get('email') as string) || '';
    const phoneVal = (fd.get('phone') as string) || '';
    if (emailVal && !isValidEmailFormat(emailVal)) {
      alert('Email address format is invalid');
      return;
    }
    if (phoneVal && !isValidPhone(phoneVal)) {
      alert('Mobile number is not a valid phone number');
      return;
    }

    setIsSavingProfile(true);

    // Parse test scores
    const ieltsVal = fd.get('ielts');
    const pteVal = fd.get('pte');
    const testScores: any = {};
    if (ieltsVal) testScores.ielts = parseFloat(ieltsVal as string);
    if (pteVal) testScores.pte = parseFloat(pteVal as string);

    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      academicHistory: fd.get('academicHistory'),
      testScores,
      targetCountry: fd.get('targetCountry'),
      targetCourse: fd.get('targetCourse'),
      targetUniversity: fd.get('targetUniversity'),
      representationType: fd.get('representationType'),
      portalName: fd.get('representationType') === 'PORTAL' ? fd.get('portalName') : null,
      source: fd.get('source'),
      counselorId: fd.get('counselorId') || null,
      subAgentId: fd.get('subAgentId') || null,
      subAgentCommissionSplit: fd.get('subAgentCommissionSplit') || null,
      branchCommissionSplit: fd.get('branchCommissionSplit') || null,
    };

    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchApplicantDetails();
        alert('Profile updated successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Document status updater
  const handleDocStatusChange = async (docId: string, status: string, fileUrl?: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, fileUrl }),
      });

      if (res.ok) {
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update document');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Timeline note submission
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.content) return;
    setIsSavingNote(true);

    try {
      const res = await fetch(`/api/applicants/${id}/communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      });

      if (res.ok) {
        setNoteForm({ type: 'NOTE', title: '', content: '', dueDate: '' });
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save timeline log');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Mark a follow-up TASK as completed — this is the only thing that clears
  // it from the missed-follow-up count driving COLD priority.
  const handleCompleteTask = async (logId: string) => {
    setCompletingTaskId(logId);
    try {
      const res = await fetch(`/api/applicants/${id}/communication/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (res.ok) {
        fetchApplicantDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to mark task complete');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingTaskId(null);
    }
  };

  // WhatsApp Business API & Direct Integration
  const simulateWhatsAppSend = async () => {
    const message = prompt('Enter WhatsApp Message to send:');
    if (!message) return;
    
    try {
      const res = await fetch(`/api/applicants/${id}/communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'WHATSAPP',
          title: 'Sent WhatsApp Message',
          content: message
        }),
      });

      if (res.ok) {
        fetchApplicantDetails();
        
        // Format Nepali mobile number (e.g. 98XXXXXXXX -> 97798XXXXXXXX)
        let phoneNo = applicant.phone || '';
        phoneNo = phoneNo.replace(/\D/g, ''); // Remove non-numeric chars
        if (phoneNo.length === 10) {
          phoneNo = '977' + phoneNo;
        }
        
        // Open direct WhatsApp API link in a new tab
        const waUrl = `https://wa.me/${phoneNo}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStageBadgeColor = (stg: string) => {
    switch (stg) {
      case 'INQUIRY': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'COUNSELLING': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'APPLICATION_SUBMITTED': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'OFFER': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'VISA_FILED': return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
      case 'VISA_GRANTED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'VISA_REFUSED': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'PRE_DEPARTURE': return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Loading applicant folder...</span>
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="py-20 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-16 h-16 mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || 'This record does not exist or you do not have permissions to access it under branch isolation rules.'}
        </p>
        <Link href="/dashboard/applicants" className="inline-block py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-800">
          Back to List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Back & Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link 
            href="/dashboard/applicants" 
            className="p-2 rounded-xl bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{applicant.name}</h1>
              {applicant.priority ? (
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                  applicant.priority === 'HOT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                  applicant.priority === 'WARM' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                  'bg-sky-500/20 text-sky-400 border-sky-500/30'
                }`}>
                  {applicant.priority}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border bg-slate-800 text-slate-400 border-slate-700">
                  No Priority
                </span>
              )}
              {applicant.applicantStatus && applicant.applicantStatus !== 'INQUIRY' && (
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                  applicant.applicantStatus === 'REAL' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  'bg-slate-700/40 text-slate-300 border-slate-600'
                }`}>
                  {applicant.applicantStatus === 'REAL' ? 'Real Applicant' : applicant.applicantStatus}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>Target: <span className="font-semibold text-indigo-600">{applicant.targetCountry}</span></span>
              <span>•</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-850 rounded font-mono text-slate-400 uppercase">{applicant.source}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center">
              <span className="italic">{describePriorityReason(applicant)}</span>
            </div>
          </div>
        </div>

        {/* Action button stubs */}
        <div className="flex items-center space-x-2">
          {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'DIRECTOR' || (currentUser?.role === 'BRANCH_MANAGER' && currentUser?.branchId === applicant.branchId)) && (
            <button
              onClick={handleDeleteApplicant}
              disabled={isDeleting}
              className="flex items-center space-x-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Student'}</span>
            </button>
          )}

          <button
            onClick={simulateWhatsAppSend}
            className="flex items-center space-x-1.5 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-600/10 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Stage Progression</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Promote to:</span>
            <select
              value={applicant.pipelineStage}
              disabled={stageLoading}
              onChange={(e) => handleStageChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {PROMOTE_OPTIONS.map((stg) => (
                <option key={stg} value={stg}>{stg.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Steps display */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2">
          {STAGES.map((stg, index) => {
            const isCurrent = applicant.pipelineStage === stg;
            const isPassed = STAGES.indexOf(applicant.pipelineStage) > index;
            return (
              <React.Fragment key={stg}>
                <div className="flex-1 flex items-center space-x-3 md:flex-col md:space-x-0 md:space-y-2 md:text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isCurrent 
                      ? stg === 'VISA_REFUSED'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 scale-115 border border-rose-400'
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-115 border border-indigo-400' 
                      : isPassed 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}>
                    {isPassed ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : index + 1}
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold block ${
                      isCurrent 
                        ? stg === 'VISA_REFUSED'
                          ? 'text-rose-500'
                          : 'text-indigo-600' 
                        : isPassed 
                          ? 'text-emerald-600' 
                          : 'text-slate-400'
                    }`}>
                      {stg.replace('_', ' ')}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] text-slate-400 block font-mono mt-0.5">
                        {applicant.daysInCurrentStage} day{applicant.daysInCurrentStage !== 1 && 's'} here
                      </span>
                    )}
                  </div>
                </div>
                {index < STAGES.length - 1 && (
                  <ChevronRight className="hidden md:block w-4 h-4 text-slate-400 shrink-0 md:mt-2" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Commission Summary (read-only) — full create/edit/status workflow lives on the Finance page */}
      {['SUPERADMIN', 'DIRECTOR', 'ACCOUNTS', 'FINANCE'].includes(currentUser?.role) && applicant.commissions && applicant.commissions.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission</span>
            <Link href="/dashboard/finance" className="text-[10px] text-indigo-500 hover:text-indigo-400 font-semibold">
              Manage in Finance &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {applicant.commissions.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-850/50 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="font-bold text-slate-200 block">{c.partnerUniversity}</span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">
                    {c.currency} {c.commissionAmountForeign.toLocaleString()} &middot; Rs. {c.commissionAmountNpr.toLocaleString()} &middot; HQ net Rs. {c.hqAmountNpr.toLocaleString()}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ml-3 ${
                  c.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                  c.status === 'PAID_TO_SUBAGENT' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {c.status === 'PAID_TO_SUBAGENT' ? 'Fully Settled' : c.status === 'RECEIVED' ? 'Received' : 'Receivable'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Navigation Tabs */}
        <div className="lg:col-span-3 flex flex-col space-y-2 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <User className="w-4 h-4 text-indigo-500" />
            <span>Profile & Academics</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'applications' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Applications & Targets ({1 + (applications?.length || 0)})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'documents' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Required Documents ({applicant.documents.filter((d: any) => d.status === 'VERIFIED').length}/{applicant.documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'timeline' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Timeline / Logs ({applicant.communicationLogs.length})</span>
          </button>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="lg:col-span-9">
          
          {/* Tab: Applications & Targets */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              
              {isVisaFiledOrBeyond && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-3 text-amber-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold">Additional targets are locked</h4>
                    <p className="text-amber-500/80">Secondary target applications cannot be added because the primary visa has already been filed or decided.</p>
                  </div>
                </div>
              )}

              {/* Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">University Applications & Targets</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Manage multiple target universities and study destinations for this student.</p>
                </div>
                <button
                  disabled={isVisaFiledOrBeyond}
                  onClick={() => setShowAppModal(true)}
                  className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 ${
                    isVisaFiledOrBeyond
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-slate-950 cursor-pointer'
                  }`}
                  title={isVisaFiledOrBeyond ? "Cannot add targets once visa is filed" : "Add Target"}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Target</span>
                </button>
              </div>

              {/* Applications List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Primary Target Card */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-600/10 border-l border-b border-indigo-500/20 rounded-bl-xl text-[9px] font-bold text-indigo-400 uppercase tracking-wide">
                    Primary Target
                  </div>
                  
                  {editingAppId === 'primary' ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Target Country</label>
                        <select
                          value={editAppForm.targetCountry}
                          onChange={(e) => setEditAppForm(prev => ({ ...prev, targetCountry: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          {countries.map((c) => (
                            <option key={c.id} value={c.countryName}>{c.countryName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">University</label>
                        <input
                          type="text"
                          value={editAppForm.targetUniversity}
                          onChange={(e) => setEditAppForm(prev => ({ ...prev, targetUniversity: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Course / Degree</label>
                        <input
                          type="text"
                          value={editAppForm.targetCourse}
                          onChange={(e) => setEditAppForm(prev => ({ ...prev, targetCourse: e.target.value }))}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          onClick={() => setEditingAppId(null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-350 text-[10px] font-bold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit('primary')}
                          className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-750 text-white text-[10px] font-bold rounded-lg transition-all"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Target Country</span>
                          <span className="text-sm font-bold text-slate-200">{applicant.targetCountry}</span>
                        </div>
                        <button
                          onClick={() => handleStartEdit('primary', applicant)}
                          className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-indigo-400 rounded-lg transition-all cursor-pointer"
                          title="Edit Target Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">University</span>
                          <span className="text-xs text-slate-350">{applicant.targetUniversity || 'Undecided'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Course / Degree</span>
                          <span className="text-xs text-slate-350">{applicant.targetCourse || 'Undecided'}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Status Stage</span>
                          <select
                            value={applicant.pipelineStage}
                            onChange={(e) => handleStageChange(e.target.value)}
                            disabled={stageLoading}
                            className="bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] text-slate-100 rounded-lg focus:outline-none cursor-pointer disabled:opacity-50"
                          >
                            {PROMOTE_OPTIONS.map((stg) => (
                              <option key={stg} value={stg}>{stg.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-2">{applicant.daysInCurrentStage} days in stage</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. Secondary Applications */}
                {applications.map((app) => (
                  <div key={app.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative">
                    {editingAppId === app.id ? (
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Target Country</label>
                          <select
                            value={editAppForm.targetCountry}
                            onChange={(e) => setEditAppForm(prev => ({ ...prev, targetCountry: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          >
                            {countries.map((c) => (
                              <option key={c.id} value={c.countryName}>{c.countryName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">University</label>
                          <input
                            type="text"
                            value={editAppForm.targetUniversity}
                            onChange={(e) => setEditAppForm(prev => ({ ...prev, targetUniversity: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Course / Degree</label>
                          <input
                            type="text"
                            value={editAppForm.targetCourse}
                            onChange={(e) => setEditAppForm(prev => ({ ...prev, targetCourse: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            onClick={() => setEditingAppId(null)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-350 text-[10px] font-bold rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(app.id)}
                            className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-750 text-white text-[10px] font-bold rounded-lg transition-all"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-4 right-4 flex items-center space-x-1.5 font-bold z-10">
                          <button
                            onClick={() => handleMakePrimary(app.id)}
                            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-amber-500 rounded-lg transition-all cursor-pointer"
                            title="Set as Primary Target"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(app.id, app)}
                            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-indigo-400 rounded-lg transition-all cursor-pointer"
                            title="Edit Target Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAppDelete(app.id)}
                            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-rose-500 rounded-lg transition-all cursor-pointer"
                            title="Remove Target Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Target Country</span>
                          <span className="text-sm font-bold text-slate-200">{app.targetCountry}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">University</span>
                            <span className="text-xs text-slate-350">{app.targetUniversity || 'Undecided'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Course / Degree</span>
                            <span className="text-xs text-slate-350">{app.targetCourse || 'Undecided'}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Status Stage</span>
                            <select
                              value={app.stage}
                              onChange={(e) => handleAppStageChange(app.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] text-slate-100 rounded-lg focus:outline-none cursor-pointer"
                            >
                              {PROMOTE_OPTIONS.map((stg) => (
                                <option key={stg} value={stg}>{stg.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-2">{app.daysInStage} days in stage</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 1: Profile & Academics */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100">Academic Profile & Setup</h3>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Student Details */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Student Name</label>
                    <input type="text" name="name" defaultValue={applicant.name} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Email Address</label>
                    <input type="email" name="email" defaultValue={applicant.email || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Phone Number</label>
                    <input type="text" name="phone" defaultValue={applicant.phone || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Academic info */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Academic Summary</label>
                    <textarea name="academicHistory" rows={3} defaultValue={applicant.academicHistory || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  {/* Test Scores */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1.5">IELTS Overall Score</label>
                      <input type="text" name="ielts" defaultValue={applicant.testScores?.ielts || ''} placeholder="e.g. 7.0" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1.5">PTE Overall Score</label>
                      <input type="text" name="pte" defaultValue={applicant.testScores?.pte || ''} placeholder="e.g. 64" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Targets */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Target Country</label>
                    <select name="targetCountry" defaultValue={applicant.targetCountry} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                      {countries.map((c) => (
                        <option key={c.id} value={c.countryName}>{c.countryName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Target Course</label>
                    <input type="text" name="targetCourse" defaultValue={applicant.targetCourse || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Target University</label>
                    <input type="text" name="targetUniversity" defaultValue={applicant.targetUniversity || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Representation Type</label>
                    <select
                      name="representationType"
                      value={editRepType}
                      onChange={(e) => setEditRepType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      <option value="DIRECT">Direct Representation</option>
                      <option value="PORTAL">Portal Representation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Portal Name</label>
                    <input
                      type="text"
                      name="portalName"
                      disabled={editRepType !== 'PORTAL'}
                      key={`${applicant.id}-${editRepType}`}
                      defaultValue={editRepType === 'PORTAL' ? (applicant.portalName || '') : ''}
                      placeholder={editRepType === 'PORTAL' ? "e.g. educo, applyboard" : "N/A (Direct)"}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Settings */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Assigned Counselor</label>
                    <select name="counselorId" defaultValue={applicant.counselorId || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none disabled:opacity-50">
                      <option value="">Unassigned</option>
                      {counselors
                        .filter(c => c.branchId === applicant.branchId)
                        .filter(c =>
                          !(currentUser?.role === 'COUNSELOR' || currentUser?.role === 'SENIOR_COUNSELOR') ||
                          c.id === currentUser?.id
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {(currentUser?.role === 'COUNSELOR' || currentUser?.role === 'SENIOR_COUNSELOR') && (
                      <p className="text-[10px] text-slate-500 mt-1">You can only self-assign or unassign this lead.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Lead Ingestion Source</label>
                    <select name="source" defaultValue={applicant.source} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                      <option value="WALK_IN">Walk-in</option>
                      <option value="WEB_FORM">Web Form</option>
                      <option value="FACEBOOK_AD">Facebook Ad</option>
                      <option value="SUB_AGENT">Sub-agent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Lead Priority (auto)</label>
                    <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                      <span className={`font-bold ${
                        applicant.priority === 'HOT' ? 'text-rose-400' :
                        applicant.priority === 'WARM' ? 'text-orange-400' :
                        applicant.priority === 'COLD' ? 'text-sky-400' :
                        'text-slate-500'
                      }`}>
                        {applicant.priority || 'No Priority'}
                      </span>
                      <span className="text-slate-500 text-[10px]">not editable</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Calculated from creation date, commitment date, missed follow-ups, and pipeline stage — set a commitment date or mark follow-ups complete to change it.
                    </p>
                  </div>

                  {applicant.source === 'SUB_AGENT' ? (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Sub-Agent Partner</label>
                      <select name="subAgentId" defaultValue={applicant.subAgentId || ''} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none">
                        <option value="">Select Agent</option>
                        {subAgents.map((sa) => (
                          <option key={sa.id} value={sa.id}>{sa.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>                {/* Guardians List */}
                <div className="border-t border-slate-800 pt-6">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4">Guardian Details</h4>
                  {applicant.guardians.length === 0 ? (
                    <p className="text-xs text-slate-500">No guardian contact linked to this applicant.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicant.guardians.map((g: any) => (
                        <div key={g.id} className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-200 text-sm">{g.name}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold uppercase rounded">{g.relation}</span>
                          </div>
                          {g.phone && <div className="text-xs text-slate-450 flex items-center"><Phone className="w-3 h-3 text-slate-500 mr-1.5 shrink-0" />{g.phone}</div>}
                          {g.email && <div className="text-xs text-slate-450 flex items-center"><Mail className="w-3 h-3 text-slate-500 mr-1.5 shrink-0" />{g.email}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {currentUser?.role !== 'FINANCE' && currentUser?.role !== 'STUDENT_PORTAL' && (
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Tab 2: Required Documents */}
          {activeTab === 'documents' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100">{applicant.targetCountry} Visa Document Checklist</h3>
                <p className="text-[10px] text-slate-400 mt-1">Review student document uploads and verify state for compliance.</p>
              </div>

              <div className="space-y-3">
                {applicant.documents.map((doc: any) => {
                  return (
                    <div 
                      key={doc.id}
                      className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <FileText className="w-8 h-8 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                           <span className="font-semibold text-slate-200 text-sm block truncate max-w-[300px]">{doc.name}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 uppercase tracking-wide font-medium">{doc.type.replace('_', ' ')}</span>
                          {doc.fileUrl && (
                            <a 
                              href="#" 
                              onClick={(e) => { e.preventDefault(); alert(`Downloading stub document: ${doc.fileUrl}`); }}
                              className="text-[10px] text-indigo-600 hover:underline block mt-1"
                            >
                              Download Submitted Document
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          doc.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          doc.status === 'TRANSLATION_PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                          doc.status === 'EXPIRED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {doc.status.replace('_', ' ')}
                        </span>

                        {/* Status quick changer */}
                        {currentUser?.role !== 'STUDENT_PORTAL' && currentUser?.role !== 'SUB_AGENT' && (
                          <select
                            value={doc.status}
                            onChange={(e) => handleDocStatusChange(
                              doc.id, 
                              e.target.value,
                              e.target.value !== 'NOT_SUBMITTED' ? `https://storage.googleapis.com/sathi-crm-bucket/docs/${applicant.id}_${doc.type.toLowerCase()}.pdf` : undefined
                            )}
                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-350 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="NOT_SUBMITTED">Not Submitted</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="TRANSLATION_PENDING">Translation Pending</option>
                            <option value="EXPIRED">Expired</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Timeline & Communication Logs */}
          {activeTab === 'timeline' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Interaction & Note Timeline</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Unified timeline containing internal notes, tasks, and communications.</p>
                </div>
              </div>

              {/* Add Entry Form (Hide for Student Portal) */}
              {currentUser?.role !== 'STUDENT_PORTAL' && (
                <form onSubmit={handleNoteSubmit} className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                    <span className="text-xs font-bold text-indigo-600">Add Log / Note Entry</span>
                    <select
                      value={noteForm.type}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, type: e.target.value }))}
                      className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 px-2 py-1 rounded focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
                    >
                      <option value="NOTE">Internal Note</option>
                      <option value="TASK">Counseling Task</option>
                      <option value="SMS">Logged SMS</option>
                      <option value="EMAIL">Logged Email</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] text-slate-400 font-medium mb-1">Title / Action Summary</label>
                      <input
                        type="text"
                        required
                        placeholder={noteForm.type === 'TASK' ? 'e.g. Call parent for balance certificate' : 'e.g. Discussed target colleges'}
                        value={noteForm.title}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    {noteForm.type === 'TASK' && (
                      <div>
                        <label className="block text-[9px] text-slate-400 font-medium mb-1">Due Date</label>
                        <input
                          type="date"
                          required
                          value={noteForm.dueDate}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-medium mb-1">Content Details</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write notes or message content detail here..."
                      value={noteForm.content}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingNote}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post to Timeline</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline Feed */}
              <div className="relative border-l border-slate-800 pl-6 space-y-6 ml-3">
                {applicant.communicationLogs.map((log: any) => {
                  const isTask = log.type === 'TASK';
                  const isCompleted = isTask && log.status === 'COMPLETED';
                  const isOverdue = isTask && !isCompleted && log.dueDate && new Date(log.dueDate) < new Date();

                  return (
                    <div key={log.id} className="relative">
                      {/* Node Bullet */}
                      <span className={`absolute top-0.5 -left-[31px] w-4 h-4 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500' :
                        isOverdue ? 'bg-rose-500' :
                        log.type === 'NOTE' ? 'bg-indigo-500' :
                        log.type === 'TASK' ? 'bg-amber-500' :
                        log.type === 'WHATSAPP' ? 'bg-teal-500' :
                        'bg-slate-400'
                      }`} />

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-xs ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{log.title}</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-[8px] text-slate-400 rounded uppercase font-mono tracking-wide scale-90">
                            {log.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans pr-4">{log.content}</p>

                        {log.dueDate && (
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className={`text-[10px] flex items-center font-semibold ${
                              isCompleted ? 'text-slate-500' : isOverdue ? 'text-rose-400' : 'text-amber-500'
                            }`}>
                              <Calendar className="w-3 h-3 mr-1" />
                              Due: {new Date(log.dueDate).toLocaleDateString()}
                            </span>
                            {isCompleted ? (
                              <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold rounded flex items-center">
                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> COMPLETED
                              </span>
                            ) : isOverdue ? (
                              <span className="px-1.5 py-0.2 bg-rose-500/10 text-rose-400 text-[8px] font-bold rounded">OVERDUE</span>
                            ) : (
                              <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 text-[8px] font-bold rounded">PENDING</span>
                            )}
                            {isTask && !isCompleted && (
                              <button
                                onClick={() => handleCompleteTask(log.id)}
                                disabled={completingTaskId === log.id}
                                className="ml-auto flex items-center space-x-1 py-1 px-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>{completingTaskId === log.id ? 'Saving...' : 'Mark Complete'}</span>
                              </button>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 flex items-center space-x-2 pt-1 font-mono">
                          <span>By: {log.senderName || 'System'}</span>
                          <span>•</span>
                          <span>{new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}



        </div>
      </div>

      {/* Add Target Application Modal */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-100 flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5 text-indigo-500" />
                Add Target Application
              </span>
              <button
                onClick={() => setShowAppModal(false)}
                className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Select Represented University (Optional Auto-fill)</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val !== 'CUSTOM') {
                      const selected = partnerUnis.find(u => u.id === val);
                      if (selected) {
                        const repLabel = selected.type === 'PORTAL' ? ` [Portal: ${selected.portalName || 'N/A'}]` : ' [Direct]';
                        setAppForm({
                          targetCountry: selected.country,
                          targetCourse: selected.course,
                          targetUniversity: `${selected.name}${repLabel}`
                        });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Partner University Listing --</option>
                  {partnerUnis.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.course} - {uni.country}) {uni.type === 'PORTAL' ? `[Portal: ${uni.portalName || 'N/A'}]` : '[Direct]'}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom (Fill manual fields below)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Target Country *</label>
                <select
                  required
                  value={appForm.targetCountry}
                  onChange={(e) => setAppForm(prev => ({ ...prev, targetCountry: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.countryName}>{c.countryName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Target Course / Degree *</label>
                <input
                  type="text"
                  required
                  value={appForm.targetCourse}
                  onChange={(e) => setAppForm(prev => ({ ...prev, targetCourse: e.target.value }))}
                  placeholder="e.g. Master of Business Administration"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Target University</label>
                <input
                  type="text"
                  value={appForm.targetUniversity}
                  onChange={(e) => setAppForm(prev => ({ ...prev, targetUniversity: e.target.value }))}
                  placeholder="e.g. York University"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingApp}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingApp ? 'Saving...' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
