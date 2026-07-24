'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  UserPlus,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  AlertTriangle,
  Loader2,
  BookOpen,
  X,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { isValidEmailFormat, isValidPhone } from '@/lib/validation';
import { canCreateApplicant } from '@/lib/auth';

const STAGES = [
  'INQUIRY',
  'COUNSELLING',
  'APPLICATION_SUBMITTED',
  'OFFER',
  'VISA_FILED',
  'VISA_GRANTED',
  'VISA_REFUSED',
  'PRE_DEPARTURE'
];

const SOURCES = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'WEB_FORM', label: 'Web Form' },
  { value: 'FACEBOOK_AD', label: 'Facebook Ad' },
  { value: 'SUB_AGENT', label: 'Sub-agent' }
];

export default function ApplicantsListPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [allApplicants, setAllApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [counselorFilter, setCounselorFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [targetCountryFilter, setTargetCountryFilter] = useState('');

  const [stuckFilter, setStuckFilter] = useState(false);
  const [stuckThreshold, setStuckThreshold] = useState(7);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [initialized, setInitialized] = useState(false);
  // Advanced filters (Counselor, Lead Source, Target Country, University,
  // exact stage, stuck-leads threshold) are hidden by default -- most staff
  // only ever need Search, Branch, and the category/priority pills below.
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Metadata for select dropdowns
  const [branches, setBranches] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [subAgents, setSubAgents] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [partnerUnis, setPartnerUnis] = useState<any[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    applyingForLevel: '',
    plusTwoCourse: '',
    plusTwoGpa: '',
    bachelorCourse: '',
    bachelorGpa: '',
    masterCourse: '',
    masterGpa: '',
    academicHistory: '',
    testType: '',
    testTypeOther: '',
    testScore: '',
    targetCountry: '',
    targetCourse: '',
    targetUniversity: '',
    representationType: 'DIRECT',
    portalName: '',
    source: 'WALK_IN',
    branchId: '',
    counselorId: '',
    subAgentId: '',
    subAgentCommissionSplit: '',
    branchCommissionSplit: '',
    priority: '',
    guardianName: '',
    guardianRelation: 'Father',
    guardianPhone: '',
    guardianEmail: '',
  });

  // Leads / Visitors tab switcher
  const [activeSection, setActiveSection] = useState<'LEADS' | 'VISITORS'>('LEADS');

  // Visitor state -- a lightweight walk-in/inquiry log, separate from Applicant
  const [visitors, setVisitors] = useState<any[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorsInitialized, setVisitorsInitialized] = useState(false);
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorStatusFilter, setVisitorStatusFilter] = useState('');
  const [visitorBranchFilter, setVisitorBranchFilter] = useState('');
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isSavingVisitor, setIsSavingVisitor] = useState(false);
  const [visitorFormError, setVisitorFormError] = useState<string | null>(null);
  const [visitorForm, setVisitorForm] = useState({ name: '', phone: '', email: '', source: 'WALK_IN', note: '', branchId: '' });
  const [visitorStatusUpdatingId, setVisitorStatusUpdatingId] = useState<string | null>(null);
  // Set when editing an existing visitor's details (typo fixes etc.) rather
  // than logging a brand new one -- reuses the same modal/form in edit mode.
  const [editingVisitorId, setEditingVisitorId] = useState<string | null>(null);
  // Set when "Convert to Lead" opens the Add Applicant modal pre-filled from a
  // visitor -- links the two records together once the applicant is created.
  const [convertingVisitorId, setConvertingVisitorId] = useState<string | null>(null);

  // Fetch current user and metadata
  useEffect(() => {
    async function initPage() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
          // Set default branch for form
          if (userData.user.branchId) {
            setFormData(prev => ({ ...prev, branchId: userData.user.branchId }));
            setVisitorForm(prev => ({ ...prev, branchId: userData.user.branchId }));
          }
        }

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
          if (destData.destinations && destData.destinations.length > 0) {
            setFormData(prev => ({ ...prev, targetCountry: destData.destinations[0].countryName }));
          }
        }

        const uniRes = await fetch('/api/admin/universities');
        if (uniRes.ok) {
          const uniData = await uniRes.json();
          setPartnerUnis(uniData.universities || []);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initPage();
  }, []);

  // Fetch applicants based on filter
  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stage) params.append('stage', stage);
      if (branchFilter) params.append('branchId', branchFilter);
      if (counselorFilter) params.append('counselorId', counselorFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (universityFilter) params.append('university', universityFilter);
      if (targetCountryFilter) params.append('targetCountry', targetCountryFilter);
      if (stuckFilter) {
        params.append('stuck', 'true');
        params.append('stuckThreshold', stuckThreshold.toString());
      }

      const res = await fetch(`/api/applicants?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error('Fetch applicants error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pri = params.get('priority');
      const cat = params.get('category');
      const stuck = params.get('stuck');
      const counselor = params.get('counselorId');
      const src = params.get('source');
      const country = params.get('targetCountry') || params.get('country');

      if (pri) setPriorityFilter(pri);
      if (cat) setCategoryFilter(cat);
      if (stuck === 'true') setStuckFilter(true);
      if (counselor) setCounselorFilter(counselor);
      if (src) setSourceFilter(src);
      if (country) setTargetCountryFilter(country);
      
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (initialized) {
      fetchApplicants();
    }
  }, [initialized, search, stage, branchFilter, counselorFilter, sourceFilter, universityFilter, stuckFilter, stuckThreshold, targetCountryFilter]);

  // Fetch visitors based on filter
  const fetchVisitors = async () => {
    setVisitorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (visitorSearch) params.append('search', visitorSearch);
      if (visitorStatusFilter) params.append('status', visitorStatusFilter);
      if (visitorBranchFilter) params.append('branchId', visitorBranchFilter);

      const res = await fetch(`/api/visitors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors || []);
      }
    } catch (err) {
      console.error('Fetch visitors error:', err);
    } finally {
      setVisitorsLoading(false);
    }
  };

  // Lazy-load visitors only once the Visitors tab is actually opened
  useEffect(() => {
    if (activeSection === 'VISITORS' && !visitorsInitialized) {
      setVisitorsInitialized(true);
    }
  }, [activeSection, visitorsInitialized]);

  useEffect(() => {
    if (visitorsInitialized) {
      fetchVisitors();
    }
  }, [visitorsInitialized, visitorSearch, visitorStatusFilter, visitorBranchFilter]);

  const handleLogVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorFormError(null);

    if (!visitorForm.name.trim()) {
      setVisitorFormError('Name is required');
      return;
    }
    if (visitorForm.phone && !isValidPhone(visitorForm.phone)) {
      setVisitorFormError('Mobile number is not a valid phone number');
      return;
    }
    if (visitorForm.email && !isValidEmailFormat(visitorForm.email)) {
      setVisitorFormError('Email address format is invalid');
      return;
    }

    setIsSavingVisitor(true);
    try {
      const res = await fetch(
        editingVisitorId ? `/api/visitors/${editingVisitorId}` : '/api/visitors',
        {
          method: editingVisitorId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitorForm),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save visitor');
      }

      setIsVisitorModalOpen(false);
      setEditingVisitorId(null);
      setVisitorForm({ name: '', phone: '', email: '', source: 'WALK_IN', note: '', branchId: currentUser?.branchId || '' });
      fetchVisitors();
    } catch (err: any) {
      setVisitorFormError(err.message || 'Error occurred while saving');
    } finally {
      setIsSavingVisitor(false);
    }
  };

  // Opens the Log Visitor modal pre-filled with an existing visitor's details
  // so front desk staff can fix typos in name/contact/etc.
  const handleEditVisitorClick = (visitor: any) => {
    setVisitorForm({
      name: visitor.name,
      phone: visitor.phone || '',
      email: visitor.email || '',
      source: visitor.source,
      note: visitor.note || '',
      branchId: visitor.branchId,
    });
    setEditingVisitorId(visitor.id);
    setVisitorFormError(null);
    setIsVisitorModalOpen(true);
  };

  const handleVisitorStatusChange = async (id: string, status: string) => {
    setVisitorStatusUpdatingId(id);
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchVisitors();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update visitor');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVisitorStatusUpdatingId(null);
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    if (!confirm('Delete this visitor entry? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVisitors();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete visitor');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Opens the existing Add Applicant modal pre-filled with this visitor's
  // details -- submitting it creates a real Applicant and marks this visitor
  // CONVERTED, linked to the new record.
  const handleConvertVisitor = (visitor: any) => {
    setFormData(prev => ({
      ...prev,
      name: visitor.name,
      email: visitor.email || '',
      phone: visitor.phone || '',
      source: visitor.source,
      branchId: visitor.branchId,
    }));
    setConvertingVisitorId(visitor.id);
    setIsModalOpen(true);
  };

  const visitorNewCount = visitors.filter(v => v.status === 'NEW').length;
  const visitorContactedCount = visitors.filter(v => v.status === 'CONTACTED').length;
  const visitorConvertedCount = visitors.filter(v => v.status === 'CONVERTED').length;
  const visitorNotInterestedCount = visitors.filter(v => v.status === 'NOT_INTERESTED').length;

  useEffect(() => {
    const filtered = allApplicants.filter(app => {
      // Priority filter
      if (priorityFilter) {
        if (priorityFilter === 'NONE') {
          if (app.priority) return false;
        } else {
          if (app.priority !== priorityFilter) return false;
        }
      }
      // Category filter
      if (categoryFilter) {
        const stage = app.pipelineStage;
        if (categoryFilter === 'LEAD') {
          if (stage !== 'INQUIRY') return false;
        } else if (categoryFilter === 'INQUIRING') {
          if (stage !== 'COUNSELLING') return false;
        } else if (categoryFilter === 'CLASS_ENROLLMENTS') {
          if (stage !== 'CLASS_ENROLLMENT') return false;
        } else if (categoryFilter === 'ABROAD_ENROLLMENTS') {
          if (!['APPLICATION_SUBMITTED', 'OFFER', 'VISA_FILED'].includes(stage)) return false;
        } else if (categoryFilter === 'DECISION') {
          if (!['VISA_GRANTED', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(stage) && !app.everRefused) return false;
        } else if (categoryFilter === 'ACTIVE_PIPELINES') {
          if (!['COUNSELLING', 'CLASS_ENROLLMENT', 'APPLICATION_SUBMITTED', 'OFFER', 'VISA_FILED', 'VISA_GRANTED'].includes(stage)) return false;
        } else if (categoryFilter === 'PRE_DEPARTURE') {
          if (stage !== 'PRE_DEPARTURE') return false;
        }
      }
      return true;
    });
    setApplicants(filtered);
  }, [allApplicants, priorityFilter, categoryFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.email && !isValidEmailFormat(formData.email)) {
      setFormError('Email address format is invalid');
      return;
    }
    if (formData.guardianEmail && !isValidEmailFormat(formData.guardianEmail)) {
      setFormError('Guardian email address format is invalid');
      return;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      setFormError('Mobile number is not a valid phone number');
      return;
    }
    if (formData.guardianPhone && !isValidPhone(formData.guardianPhone)) {
      setFormError('Guardian phone number is not a valid phone number');
      return;
    }

    setIsSubmitting(true);

    // Build the request body with formatted test scores -- test info is
    // entirely optional (many leads apply without having sat a test yet),
    // and "Other" lets counselors record test types not in the fixed list.
    const effectiveTestType = (formData.testType === 'OTHER' ? formData.testTypeOther.trim() : formData.testType) || '';
    const scoreValue = formData.testScore.trim();
    const numericScore = parseFloat(scoreValue);
    // Build the single academicHistory string the backend stores from
    // whichever prior-qualification fields apply to the program level the
    // applicant is applying for (+2 for Bachelor's, +2 & Bachelor's for
    // Master's, +2 & Bachelor's & Master's for Doctoral).
    const academicParts: string[] = [];
    if (formData.plusTwoCourse.trim() || formData.plusTwoGpa.trim()) {
      academicParts.push(`+2: ${formData.plusTwoCourse.trim()}${formData.plusTwoGpa.trim() ? `, ${formData.plusTwoGpa.trim()}` : ''}`);
    }
    if ((formData.applyingForLevel === 'MASTERS' || formData.applyingForLevel === 'DOCTORAL') && (formData.bachelorCourse.trim() || formData.bachelorGpa.trim())) {
      academicParts.push(`Bachelor's: ${formData.bachelorCourse.trim()}${formData.bachelorGpa.trim() ? `, ${formData.bachelorGpa.trim()}` : ''}`);
    }
    if (formData.applyingForLevel === 'DOCTORAL' && (formData.masterCourse.trim() || formData.masterGpa.trim())) {
      academicParts.push(`Master's: ${formData.masterCourse.trim()}${formData.masterGpa.trim() ? `, ${formData.masterGpa.trim()}` : ''}`);
    }
    const combinedAcademicHistory = academicParts.join(' | ');

    const requestData = {
      ...formData,
      academicHistory: combinedAcademicHistory,
      testScores: (effectiveTestType && scoreValue)
        ? { [effectiveTestType.toLowerCase().replace(/\s+/g, '_')]: isNaN(numericScore) ? scoreValue : numericScore }
        : {},
    };

    try {
      const res = await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lead');
      }

      // If this creation was a visitor conversion, link the two records
      if (convertingVisitorId) {
        await fetch(`/api/visitors/${convertingVisitorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONVERTED', convertedApplicantId: data.applicant.id }),
        }).catch((err) => console.error('Failed to link converted visitor:', err));
        setConvertingVisitorId(null);
        fetchVisitors();
      }

      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        applyingForLevel: '',
        plusTwoCourse: '',
        plusTwoGpa: '',
        bachelorCourse: '',
        bachelorGpa: '',
        masterCourse: '',
        masterGpa: '',
        academicHistory: '',
        testType: '',
        testTypeOther: '',
        testScore: '',
        targetCountry: 'Australia',
        targetCourse: '',
        targetUniversity: '',
        representationType: 'DIRECT',
        portalName: '',
        source: 'WALK_IN',
        branchId: currentUser?.branchId || '',
        counselorId: '',
        subAgentId: '',
        subAgentCommissionSplit: '',
        branchCommissionSplit: '',
        priority: '',
        guardianName: '',
        guardianRelation: 'Father',
        guardianPhone: '',
        guardianEmail: '',
      });
      fetchApplicants();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageBadgeColor = (stg: string) => {
    switch (stg) {
      case 'INQUIRY': return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'COUNSELLING': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'APPLICATION_SUBMITTED': return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
      case 'OFFER': return 'bg-orange-50 text-orange-700 border border-orange-100';
      case 'VISA_FILED': return 'bg-pink-50 text-pink-700 border border-pink-100';
      case 'VISA_GRANTED': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'VISA_REFUSED': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'PRE_DEPARTURE': return 'bg-teal-50 text-teal-700 border border-teal-100';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Real-time counts computed from the fetched (scope-filtered) list
  const hotCount = allApplicants.filter(a => a.priority === 'HOT').length;
  const warmCount = allApplicants.filter(a => a.priority === 'WARM').length;
  const coldCount = allApplicants.filter(a => a.priority === 'COLD').length;
  const noPriorityCount = allApplicants.filter(a => !a.priority).length;

  const leadCount = allApplicants.filter(a => a.pipelineStage === 'INQUIRY').length;
  const inquiringCount = allApplicants.filter(a => a.pipelineStage === 'COUNSELLING').length;
  const classEnrollmentCount = allApplicants.filter(a => a.pipelineStage === 'CLASS_ENROLLMENT').length;
  const abroadEnrollmentCount = allApplicants.filter(a => ['APPLICATION_SUBMITTED', 'OFFER', 'VISA_FILED'].includes(a.pipelineStage)).length;
  const decisionCount = allApplicants.filter(a => ['VISA_GRANTED', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(a.pipelineStage) || a.everRefused).length;

  const totalLeadsCount = allApplicants.length;
  const activePipelinesCount = allApplicants.filter(a => !['INQUIRY', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(a.pipelineStage)).length;
  const stuckLeadsCount = allApplicants.filter(a => a.daysInCurrentStage >= stuckThreshold).length;

  // Plain-language names for the category quick-filter codes, reused by the active-filter chips below
  const CATEGORY_LABELS: Record<string, string> = {
    LEAD: 'New Leads',
    INQUIRING: 'In Counselling',
    CLASS_ENROLLMENTS: 'Preparing to Apply',
    ABROAD_ENROLLMENTS: 'Applying & Visa',
    DECISION: 'Decision Made',
    ACTIVE_PIPELINES: 'Currently Active',
    PRE_DEPARTURE: 'Pre-Departure',
  };

  // Every filter currently applied, shown as removable chips so it's always
  // obvious at a glance what's being viewed — and how to undo it.
  const activeFilterChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (search) activeFilterChips.push({ key: 'search', label: `Search: "${search}"`, onRemove: () => setSearch('') });
  if (stage) activeFilterChips.push({ key: 'stage', label: `Stage: ${stage.replace(/_/g, ' ')}`, onRemove: () => setStage('') });
  if (branchFilter) {
    const b = branches.find(x => x.id === branchFilter);
    activeFilterChips.push({ key: 'branch', label: `Branch: ${b?.name || 'Selected'}`, onRemove: () => setBranchFilter('') });
  }
  if (counselorFilter) {
    const c = counselors.find(x => x.id === counselorFilter);
    activeFilterChips.push({ key: 'counselor', label: `Counselor: ${c?.name || 'Selected'}`, onRemove: () => setCounselorFilter('') });
  }
  if (sourceFilter) {
    const s = SOURCES.find(x => x.value === sourceFilter);
    activeFilterChips.push({ key: 'source', label: `Source: ${s?.label || sourceFilter}`, onRemove: () => setSourceFilter('') });
  }
  if (universityFilter) activeFilterChips.push({ key: 'university', label: `University: "${universityFilter}"`, onRemove: () => setUniversityFilter('') });
  if (targetCountryFilter) activeFilterChips.push({ key: 'country', label: `Country: ${targetCountryFilter}`, onRemove: () => setTargetCountryFilter('') });
  if (stuckFilter) activeFilterChips.push({ key: 'stuck', label: `Stuck Only (${stuckThreshold}+ days)`, onRemove: () => setStuckFilter(false) });
  if (priorityFilter) activeFilterChips.push({ key: 'priority', label: `Priority: ${priorityFilter === 'NONE' ? 'No Priority' : priorityFilter}`, onRemove: () => setPriorityFilter('') });
  if (categoryFilter) activeFilterChips.push({ key: 'category', label: CATEGORY_LABELS[categoryFilter] || categoryFilter, onRemove: () => setCategoryFilter('') });

  const clearAllFilters = () => {
    setSearch('');
    setStage('');
    setBranchFilter('');
    setCounselorFilter('');
    setSourceFilter('');
    setUniversityFilter('');
    setTargetCountryFilter('');
    setStuckFilter(false);
    setPriorityFilter('');
    setCategoryFilter('');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            {activeSection === 'LEADS' ? 'Applicants & Leads' : 'Visitors'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeSection === 'LEADS'
              ? 'Manage and track candidate pipelines from counseling to visa approval.'
              : 'Fast-log walk-ins and inquiries before they’re qualified into a full lead.'}
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          {currentUser && (
            <button
              onClick={() => {
                setEditingVisitorId(null);
                setVisitorForm({ name: '', phone: '', email: '', source: 'WALK_IN', note: '', branchId: currentUser?.branchId || '' });
                setIsVisitorModalOpen(true);
              }}
              className="flex items-center space-x-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-teal-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Visitor</span>
            </button>
          )}
          {currentUser && canCreateApplicant(currentUser) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Applicant</span>
            </button>
          )}
        </div>
      </div>

      {/* Leads / Visitors tab switcher */}
      <div className="flex items-center space-x-1 border-b border-slate-800">
        <button
          onClick={() => setActiveSection('LEADS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer border-b-2 -mb-px ${
            activeSection === 'LEADS'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Leads ({totalLeadsCount})
        </button>
        <button
          onClick={() => setActiveSection('VISITORS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer border-b-2 -mb-px ${
            activeSection === 'VISITORS'
              ? 'text-teal-400 border-teal-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Visitors {visitorsInitialized ? `(${visitors.length})` : ''}
        </button>
      </div>

      {activeSection === 'LEADS' && (
      <>
      {/* Active Filters — always-visible summary of exactly what's being viewed right now */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider shrink-0">Showing:</span>
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.onRemove}
              className="flex items-center space-x-1.5 pl-3 pr-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold hover:border-rose-500/50 hover:text-rose-300 transition-all cursor-pointer group"
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3 text-slate-500 group-hover:text-rose-400" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 underline underline-offset-4 cursor-pointer ml-1"
          >
            Clear all
          </button>
          <span className="text-[10px] text-slate-500 font-mono ml-auto">
            {applicants.length} of {allApplicants.length} lead{allApplicants.length !== 1 && 's'} match
          </span>
        </div>
      )}

      {/* Filters Section -- Search + Branch stay visible at all times; the
          category pills below answer "which leads do I want to see" in
          plain language; anything more technical (exact stage, counselor,
          source, country, university, stuck-leads threshold) is tucked
          behind "More filters" so the page isn't overwhelming by default. */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Find a Lead</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search bar */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Search by Name, Email or Phone</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Branch Filter (visible for org-wide roles) */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Branch</label>
            {['SUPERADMIN', 'DIRECTOR', 'ACCOUNTS', 'FINANCE', 'DOCUMENTATION_OFFICER', 'FRONT_DESK_OFFICER'].includes(currentUser?.role) ? (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center px-3 py-2 bg-slate-950 border border-slate-800/40 rounded-xl text-slate-500 text-xs select-none">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-600 shrink-0" />
                <span className="truncate">{currentUser?.branchName || 'HQ Rollup'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick pill filters */}
        <div className="space-y-3.5 border-t border-slate-800/60 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400">Quick Filters</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Tap any group to show just those students below.</p>
            </div>
            {(priorityFilter || categoryFilter || stuckFilter) && (
              <button
                onClick={() => {
                  setPriorityFilter('');
                  setCategoryFilter('');
                  setStuckFilter(false);
                }}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer transition-all select-none animate-fade-in"
              >
                Clear category filters
              </button>
            )}
          </div>

          {/* Priority Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-24 shrink-0">Urgency</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPriorityFilter(priorityFilter === 'HOT' ? '' : 'HOT')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  priorityFilter === 'HOT'
                    ? 'bg-rose-500/20 text-rose-700 border-rose-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-rose-400 hover:border-rose-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Hot ({hotCount})</span>
              </button>

              <button
                onClick={() => setPriorityFilter(priorityFilter === 'WARM' ? '' : 'WARM')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  priorityFilter === 'WARM'
                    ? 'bg-orange-500/20 text-orange-700 border-orange-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-orange-405 hover:border-orange-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>Warm ({warmCount})</span>
              </button>

              <button
                onClick={() => setPriorityFilter(priorityFilter === 'COLD' ? '' : 'COLD')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  priorityFilter === 'COLD'
                    ? 'bg-sky-500/20 text-sky-700 border-sky-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-sky-400 hover:border-sky-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Cold ({coldCount})</span>
              </button>

              <button
                onClick={() => setPriorityFilter(priorityFilter === 'NONE' ? '' : 'NONE')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  priorityFilter === 'NONE'
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>No Priority ({noPriorityCount})</span>
              </button>
            </div>
          </div>

          {/* Pipeline Stage Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-24 shrink-0">Journey Stage</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCategoryFilter(categoryFilter === 'LEAD' ? '' : 'LEAD')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'LEAD'
                    ? 'bg-rose-500/20 text-rose-700 border-rose-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>New Leads ({leadCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'INQUIRING' ? '' : 'INQUIRING')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'INQUIRING'
                    ? 'bg-indigo-500/20 text-indigo-700 border-indigo-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>In Counselling ({inquiringCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'CLASS_ENROLLMENTS' ? '' : 'CLASS_ENROLLMENTS')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'CLASS_ENROLLMENTS'
                    ? 'bg-sky-500/20 text-sky-700 border-sky-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Preparing to Apply ({classEnrollmentCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'ABROAD_ENROLLMENTS' ? '' : 'ABROAD_ENROLLMENTS')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'ABROAD_ENROLLMENTS'
                    ? 'bg-amber-500/20 text-amber-700 border-amber-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Applying &amp; Visa ({abroadEnrollmentCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'DECISION' ? '' : 'DECISION')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'DECISION'
                    ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Decision Made ({decisionCount})</span>
              </button>
            </div>
          </div>

          {/* Stats Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-24 shrink-0">Quick Views</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPriorityFilter('');
                  setCategoryFilter('');
                  setStuckFilter(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  (!priorityFilter && !categoryFilter && !stuckFilter)
                    ? 'bg-indigo-500/20 text-indigo-700 border-indigo-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Total Leads ({totalLeadsCount})</span>
              </button>

              <button
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'ACTIVE_PIPELINES' ? '' : 'ACTIVE_PIPELINES');
                  setStuckFilter(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'ACTIVE_PIPELINES'
                    ? 'bg-purple-500/20 text-purple-700 border-purple-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Currently Active ({activePipelinesCount})</span>
              </button>

              <button
                onClick={() => {
                  setStuckFilter(!stuckFilter);
                  setCategoryFilter('');
                  setPriorityFilter('');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  stuckFilter
                    ? 'bg-amber-500/20 text-amber-700 border-amber-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Needs Attention ({stuckLeadsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced filters -- collapsed by default */}
        <div className="border-t border-slate-800/60 pt-4">
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showMoreFilters ? 'Fewer filters' : 'More filters'}</span>
            {!showMoreFilters && <span className="text-slate-600 font-normal normal-case">(counselor, source, country, university, exact stage)</span>}
          </button>

          {showMoreFilters && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Stage Filter (exact) */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Exact Pipeline Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="">All Pipeline Stages</option>
                    {STAGES.map((stg) => (
                      <option key={stg} value={stg}>{stg.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Counselor Filter (org-wide and manager roles only) */}
                {['SUPERADMIN', 'DIRECTOR', 'ACCOUNTS', 'BRANCH_MANAGER', 'MANAGER'].includes(currentUser?.role) && (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Counselor</label>
                    <select
                      value={counselorFilter}
                      onChange={(e) => setCounselorFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">All Counselors</option>
                      {counselors.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Source Filter */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Lead Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="">All Lead Sources</option>
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Target Country Filter */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Country</label>
                  <select
                    value={targetCountryFilter}
                    onChange={(e) => setTargetCountryFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="">All Target Countries</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.countryName}>{c.countryName}</option>
                    ))}
                  </select>
                </div>

                {/* University Filter */}
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">University</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter by University"
                      value={universityFilter}
                      onChange={(e) => setUniversityFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Stuck Leads Filter */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center space-x-2 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stuckFilter}
                    onChange={(e) => setStuckFilter(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded bg-slate-950 border-slate-800 focus:ring-indigo-500/20"
                  />
                  <span className="flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Show Stuck Leads Only</span>
                  </span>
                </label>

                {stuckFilter && (
                  <div className="flex items-center space-x-2 animate-fade-in">
                    <span className="text-[10px] text-slate-400">Threshold (days):</span>
                    <input
                      type="number"
                      min="1"
                      value={stuckThreshold}
                      onChange={(e) => setStuckThreshold(Math.max(1, parseInt(e.target.value) || 7))}
                      className="w-14 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono text-center"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-right text-[10px] text-slate-500 font-mono border-t border-slate-800/60 pt-3">
          Showing {applicants.length} record{applicants.length !== 1 && 's'}
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">Loading applicant ledger...</span>
          </div>
        ) : applicants.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p className="text-sm font-semibold">No applicants found</p>
            <p className="text-xs text-slate-600 mt-1">Try resetting filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Applicant Name</th>
                  <th className="px-6 py-4">Target Course / Country</th>
                  <th className="px-6 py-4">Counselor / Branch</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Pipeline Stage</th>
                  <th className="px-6 py-4">Days in Stage</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs text-slate-350">
                {applicants.map((app) => {
                  const isStuck = app.daysInCurrentStage >= stuckThreshold;
                  return (
                    <tr 
                      key={app.id} 
                      className={`transition-all border-b border-slate-800/40 ${
                        isStuck
                          ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-2 border-l-amber-500/60'
                          : 'hover:bg-slate-850/40'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-200">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/dashboard/applicants/${app.id}`}
                            className="hover:text-indigo-600 font-bold transition-all block text-sm"
                          >
                            {app.name}
                          </Link>
                          {app.priority && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase ${
                              app.priority === 'HOT' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              app.priority === 'WARM' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              'bg-sky-100 text-sky-700 border border-sky-200'
                            }`}>
                              {app.priority}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{app.phone || app.email || 'No contact'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {/* Primary Target */}
                        <div className="mb-2">
                          <span className="font-semibold text-slate-200 truncate block max-w-[200px]" title={app.targetCourse}>
                            {app.targetCourse || 'Undecided'}
                          </span>
                          {app.targetUniversity && (
                            <span className="text-slate-350 text-[11px] font-medium block truncate max-w-[200px] mt-0.5">
                              {app.targetUniversity}
                            </span>
                          )}
                          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                            <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] rounded uppercase font-bold tracking-wide">
                              Primary
                            </span>
                            <span className="text-[10px] text-indigo-400 font-semibold">{app.targetCountry}</span>
                            {app.representationType && (
                              <span className="px-1.5 py-0.2 bg-slate-900 text-slate-400 border border-slate-800 text-[8px] rounded-full uppercase font-bold tracking-wide">
                                {app.representationType === 'PORTAL' ? `Portal: ${app.portalName || 'N/A'}` : 'Direct'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Secondary Targets */}
                        {app.applications && app.applications.map((otherApp: any) => (
                          <div key={otherApp.id} className="mt-2.5 pt-2.5 border-t border-slate-800/40">
                            <span className="text-slate-300 text-[11px] truncate block max-w-[200px] font-medium" title={otherApp.targetCourse}>
                              {otherApp.targetCourse || 'Undecided'}
                            </span>
                            {otherApp.targetUniversity && (
                              <span className="text-slate-400 text-[10px] block truncate max-w-[200px] mt-0.5">
                                {otherApp.targetUniversity}
                              </span>
                            )}
                            <div className="flex items-center flex-wrap gap-1 mt-1 text-[10px]">
                              <span className="px-1 py-0.2 bg-slate-800 text-slate-400 border border-slate-700/60 text-[8px] rounded uppercase font-bold tracking-wide">
                                Secondary
                              </span>
                              <span className="text-slate-400 font-semibold">{otherApp.targetCountry}</span>
                              {otherApp.stage && (
                                <span className="px-1.5 py-0.2 bg-slate-900 text-slate-400 border border-slate-800 text-[8px] rounded-full uppercase font-bold tracking-wide ml-0.5">
                                  {otherApp.stage.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300">{app.counselor?.name || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{app.branch?.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-850 text-[10px] text-slate-400 rounded-md font-medium border border-slate-800">
                          {app.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStageBadgeColor(app.pipelineStage)}`}>
                          {app.pipelineStage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isStuck ? (
                          <span className="flex items-center space-x-1 text-amber-600 font-bold animate-pulse text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-600 mr-0.5" />
                            <span>{app.daysInCurrentStage} days (Stuck)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">{app.daysInCurrentStage} day{app.daysInCurrentStage !== 1 && 's'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/applicants/${app.id}`}
                          className="whitespace-nowrap px-3 py-1.5 bg-slate-850 hover:bg-indigo-50 text-indigo-600 border border-slate-800 text-[10px] font-bold rounded-lg transition-all"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeSection === 'VISITORS' && (
        <>
          {/* Visitor Filters */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Name, email, phone..."
                    value={visitorSearch}
                    onChange={(e) => setVisitorSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</label>
                <select
                  value={visitorStatusFilter}
                  onChange={(e) => setVisitorStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-teal-500 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                </select>
              </div>

              {['SUPERADMIN', 'DIRECTOR', 'ACCOUNTS', 'FINANCE', 'DOCUMENTATION_OFFICER', 'FRONT_DESK_OFFICER'].includes(currentUser?.role) && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Branch</label>
                  <select
                    value={visitorBranchFilter}
                    onChange={(e) => setVisitorBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-teal-500 transition-all"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-4">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-16 shrink-0">Status</span>
              <button
                onClick={() => setVisitorStatusFilter(visitorStatusFilter === 'NEW' ? '' : 'NEW')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  visitorStatusFilter === 'NEW'
                    ? 'bg-amber-500/20 text-amber-700 border-amber-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>New ({visitorNewCount})</span>
              </button>
              <button
                onClick={() => setVisitorStatusFilter(visitorStatusFilter === 'CONTACTED' ? '' : 'CONTACTED')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  visitorStatusFilter === 'CONTACTED'
                    ? 'bg-indigo-500/20 text-indigo-700 border-indigo-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-indigo-400 hover:border-indigo-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Contacted ({visitorContactedCount})</span>
              </button>
              <button
                onClick={() => setVisitorStatusFilter(visitorStatusFilter === 'CONVERTED' ? '' : 'CONVERTED')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  visitorStatusFilter === 'CONVERTED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-emerald-400 hover:border-emerald-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Converted ({visitorConvertedCount})</span>
              </button>
              <button
                onClick={() => setVisitorStatusFilter(visitorStatusFilter === 'NOT_INTERESTED' ? '' : 'NOT_INTERESTED')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  visitorStatusFilter === 'NOT_INTERESTED'
                    ? 'bg-slate-700 text-slate-200 border-slate-600'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>Not Interested ({visitorNotInterestedCount})</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono ml-auto">
                Showing {visitors.length} record{visitors.length !== 1 && 's'}
              </span>
            </div>
          </div>

          {/* Visitor Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            {visitorsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                <span className="text-xs">Loading visitor log...</span>
              </div>
            ) : visitors.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p className="text-sm font-semibold">No visitors logged</p>
                <p className="text-xs text-slate-600 mt-1">Try resetting filters, or log a new walk-in above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Logged By</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-350">
                    {visitors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-850/40 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {v.name}
                          {v.note && <div className="text-[10px] text-slate-500 font-normal mt-0.5 max-w-[220px] truncate" title={v.note}>{v.note}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {v.phone || <span className="text-slate-600">—</span>}
                          {v.email && <div className="text-[10px] text-slate-500 mt-0.5">{v.email}</div>}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{v.branch?.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-850 text-[10px] text-slate-400 rounded-md font-medium border border-slate-800">
                            {v.source}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            v.status === 'NEW' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            v.status === 'CONTACTED' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                            v.status === 'CONVERTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {v.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{v.loggedBy?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{new Date(v.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-1.5">
                            {v.status === 'CONVERTED' && v.convertedApplicantId ? (
                              <Link
                                href={`/dashboard/applicants/${v.convertedApplicantId}`}
                                className="whitespace-nowrap px-3 py-1.5 bg-slate-850 hover:bg-emerald-50 text-emerald-500 border border-slate-800 text-[10px] font-bold rounded-lg transition-all"
                              >
                                View Lead
                              </Link>
                            ) : v.status === 'NOT_INTERESTED' ? (
                              <button
                                onClick={() => handleVisitorStatusChange(v.id, 'NEW')}
                                disabled={visitorStatusUpdatingId === v.id}
                                className="whitespace-nowrap px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                              >
                                Reopen
                              </button>
                            ) : (
                              <>
                                {v.status === 'NEW' && (
                                  <button
                                    onClick={() => handleVisitorStatusChange(v.id, 'CONTACTED')}
                                    disabled={visitorStatusUpdatingId === v.id}
                                    className="whitespace-nowrap px-2.5 py-1.5 bg-slate-850 hover:bg-indigo-50 text-indigo-500 border border-slate-800 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                                    title="Mark as contacted"
                                  >
                                    Contacted
                                  </button>
                                )}
                                <button
                                  onClick={() => handleConvertVisitor(v)}
                                  className="whitespace-nowrap px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all"
                                >
                                  Convert to Lead
                                </button>
                                <button
                                  onClick={() => handleVisitorStatusChange(v.id, 'NOT_INTERESTED')}
                                  disabled={visitorStatusUpdatingId === v.id}
                                  className="p-1.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-colors disabled:opacity-50"
                                  title="Not interested"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditVisitorClick(v)}
                              className="p-1.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-500 hover:text-teal-400 hover:border-teal-500/40 transition-colors"
                              title="Edit visitor details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVisitor(v.id)}
                              className="p-1.5 rounded-lg bg-slate-850 border border-slate-800 text-rose-500 hover:border-rose-500/40 transition-colors"
                              title="Delete visitor entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Log Visitor Modal */}
      {isVisitorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100">
                <UserPlus className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-sm">{editingVisitorId ? 'Edit Visitor' : 'Log Visitor'}</h3>
              </div>
              <button
                onClick={() => { setIsVisitorModalOpen(false); setEditingVisitorId(null); }}
                className="text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogVisitor} className="p-6 space-y-4">
              {visitorFormError && (
                <div className="p-3 bg-rose-100 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                  {visitorFormError}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={visitorForm.name}
                  onChange={(e) => setVisitorForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sujan Bhattarai"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={visitorForm.phone}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Email</label>
                  <input
                    type="text"
                    value={visitorForm.email}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="optional"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Source</label>
                <select
                  value={visitorForm.source}
                  onChange={(e) => setVisitorForm(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {['SUPERADMIN', 'DIRECTOR', 'ACCOUNTS', 'FINANCE', 'DOCUMENTATION_OFFICER', 'FRONT_DESK_OFFICER'].includes(currentUser?.role) ? (
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Branch</label>
                  <select
                    value={visitorForm.branchId}
                    onChange={(e) => setVisitorForm(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center px-3 py-2 bg-slate-950 border border-slate-800/40 rounded-xl text-slate-500 text-xs select-none">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-600 shrink-0" />
                  <span>{currentUser?.branchName || 'Your branch'}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Note</label>
                <textarea
                  value={visitorForm.note}
                  onChange={(e) => setVisitorForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="What are they interested in?"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsVisitorModalOpen(false); setEditingVisitorId(null); }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisitor}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingVisitor ? 'Saving...' : editingVisitorId ? 'Save Changes' : 'Log Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Applicant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">{convertingVisitorId ? 'Convert Visitor to Lead' : 'Add New Student Profile'}</h3>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setConvertingVisitorId(null); }}
                className="text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* 1. Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  1. Basic Contact Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="name">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Sameer Giri"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. sameer@gmail.com"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="phone">
                      Mobile Number
                    </label>
                    <input
                      id="phone"
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9841XXXXXX"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Academic & Tests -- entirely optional; most leads walk in
                  before they've sat any English/entry test */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  2. Academic & Test Scores
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="applyingForLevel">
                      Applying For (Program Level) *
                    </label>
                    <select
                      id="applyingForLevel"
                      name="applyingForLevel"
                      required
                      value={formData.applyingForLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      <option value="">Select Program Level</option>
                      <option value="BACHELORS">Bachelor's Degree</option>
                      <option value="MASTERS">Master's Degree</option>
                      <option value="DOCTORAL">PhD / DBA / MRes (Doctoral)</option>
                    </select>
                    <p className="text-[9px] text-slate-500 mt-1">
                      {formData.applyingForLevel === 'DOCTORAL'
                        ? "Needs +2, Bachelor's, and Master's academic records."
                        : formData.applyingForLevel === 'MASTERS'
                        ? "Needs +2 and Bachelor's academic records."
                        : 'Needs +2 academic records (minimum eligibility).'}
                    </p>
                  </div>

                  {formData.applyingForLevel && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="plusTwoCourse">
                          +2 / A-Levels Stream
                        </label>
                        <input
                          id="plusTwoCourse"
                          type="text"
                          name="plusTwoCourse"
                          value={formData.plusTwoCourse}
                          onChange={handleInputChange}
                          placeholder="e.g. Science"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="plusTwoGpa">
                          +2 GPA / Percentage
                        </label>
                        <input
                          id="plusTwoGpa"
                          type="text"
                          name="plusTwoGpa"
                          value={formData.plusTwoGpa}
                          onChange={handleInputChange}
                          placeholder="e.g. GPA 3.25 or 62%"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </>
                  )}

                  {(formData.applyingForLevel === 'MASTERS' || formData.applyingForLevel === 'DOCTORAL') && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="bachelorCourse">
                          Bachelor's Course
                        </label>
                        <input
                          id="bachelorCourse"
                          type="text"
                          name="bachelorCourse"
                          value={formData.bachelorCourse}
                          onChange={handleInputChange}
                          placeholder="e.g. BBS"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="bachelorGpa">
                          Bachelor's GPA / Percentage
                        </label>
                        <input
                          id="bachelorGpa"
                          type="text"
                          name="bachelorGpa"
                          value={formData.bachelorGpa}
                          onChange={handleInputChange}
                          placeholder="e.g. GPA 3.1 or 62%"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </>
                  )}

                  {formData.applyingForLevel === 'DOCTORAL' && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="masterCourse">
                          Master's Course
                        </label>
                        <input
                          id="masterCourse"
                          type="text"
                          name="masterCourse"
                          value={formData.masterCourse}
                          onChange={handleInputChange}
                          placeholder="e.g. Master of IT"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="masterGpa">
                          Master's GPA / Percentage
                        </label>
                        <input
                          id="masterGpa"
                          type="text"
                          name="masterGpa"
                          value={formData.masterGpa}
                          onChange={handleInputChange}
                          placeholder="e.g. GPA 3.6 or 70%"
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-3 border-t border-slate-800/60 pt-4" />

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Test Type
                    </label>
                    <select
                      name="testType"
                      value={formData.testType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      <option value="">No Test Taken Yet</option>
                      <option value="IELTS">IELTS</option>
                      <option value="PTE">PTE</option>
                      <option value="TOEFL">TOEFL</option>
                      <option value="Duolingo">Duolingo</option>
                      <option value="SAT">SAT</option>
                      <option value="OTHER">Other (specify)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="testScore">
                      Score
                    </label>
                    <input
                      id="testScore"
                      type="text"
                      name="testScore"
                      value={formData.testScore}
                      onChange={handleInputChange}
                      disabled={!formData.testType}
                      placeholder={formData.testType ? 'e.g. 7.5 / 64' : 'N/A'}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:bg-slate-900"
                    />
                  </div>

                  {formData.testType === 'OTHER' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="testTypeOther">
                        Specify Test Name
                      </label>
                      <input
                        id="testTypeOther"
                        type="text"
                        name="testTypeOther"
                        value={formData.testTypeOther}
                        onChange={handleInputChange}
                        placeholder="e.g. CAEL, CELPIP, MOI"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Study Abroad Intent -- country first, then the partner
                  university listing filters down to just that country's
                  courses (set up under Control Panel > Partner Universities) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  3. Study Abroad Placement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Target Country *
                    </label>
                    <select
                      name="targetCountry"
                      value={formData.targetCountry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      {countries.map((c) => (
                        <option key={c.id} value={c.countryName}>{c.countryName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1 font-mono">
                      Select Partner University & Course ({formData.targetCountry || 'choose a country first'})
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && val !== 'CUSTOM') {
                          const selected = partnerUnis.find(u => u.id === val);
                          if (selected) {
                            const repLabel = selected.type === 'PORTAL' ? ` [Portal: ${selected.portalName || 'N/A'}]` : ' [Direct]';
                            setFormData(prev => ({
                              ...prev,
                              targetCountry: selected.country,
                              targetCourse: selected.course,
                              targetUniversity: `${selected.name}${repLabel}`,
                              representationType: selected.type,
                              portalName: selected.portalName || ''
                            }));
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Partner University Listing --</option>
                      {partnerUnis
                        .filter((uni) => !formData.targetCountry || uni.country === formData.targetCountry)
                        .map((uni) => (
                          <option key={uni.id} value={uni.id}>
                            {uni.name} ({uni.course}) {uni.type === 'PORTAL' ? `[Portal: ${uni.portalName || 'N/A'}]` : '[Direct]'}
                          </option>
                        ))}
                      <option value="CUSTOM">Custom (Fill manual fields below)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="targetCourse">
                      Intended Course
                    </label>
                    <input
                      id="targetCourse"
                      type="text"
                      name="targetCourse"
                      value={formData.targetCourse}
                      onChange={handleInputChange}
                      placeholder="e.g. Master of IT"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="targetUniversity">
                      Intended University / College
                    </label>
                    <input
                      id="targetUniversity"
                      type="text"
                      name="targetUniversity"
                      value={formData.targetUniversity}
                      onChange={handleInputChange}
                      placeholder="e.g. Macquarie University"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Representation Type
                    </label>
                    <select
                      name="representationType"
                      value={formData.representationType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="DIRECT">Direct Representation</option>
                      <option value="PORTAL">Portal Representation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="portalName">
                      Portal Name
                    </label>
                    <input
                      id="portalName"
                      type="text"
                      name="portalName"
                      value={formData.portalName}
                      onChange={handleInputChange}
                      disabled={formData.representationType !== 'PORTAL'}
                      placeholder={formData.representationType === 'PORTAL' ? "e.g. educo, applyboard" : "N/A (Direct)"}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Processing Assignment */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  4. Assignment & Ingestion Source
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Source *
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      {SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'DIRECTOR') ? (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Branch Assignment *
                      </label>
                      <select
                        name="branchId"
                        required
                        value={formData.branchId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Assigned Branch
                      </label>
                      <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800/40 rounded-xl text-slate-500 text-xs">
                        {currentUser?.branchName || 'HQ'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Assigned Counselor
                    </label>
                    <select
                      name="counselorId"
                      value={formData.counselorId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {counselors
                        .filter(c => !formData.branchId || c.branchId === formData.branchId)
                        .filter(c =>
                          !(currentUser?.role === 'COUNSELOR' || currentUser?.role === 'SENIOR_COUNSELOR') ||
                          c.id === currentUser?.id
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {(currentUser?.role === 'COUNSELOR' || currentUser?.role === 'SENIOR_COUNSELOR') && (
                      <p className="text-[10px] text-slate-500 mt-1">You can only self-assign or leave this unassigned.</p>
                    )}
                  </div>

                  {/* Lead Priority is not set manually here -- it's assigned
                      automatically (new entries start HOT and move based on
                      follow-up/commitment activity), consistent with the
                      priority automation set up for this org. */}

                  {/* Sub-agent section, only active when source is SUB_AGENT */}
                  {formData.source === 'SUB_AGENT' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1">
                        Sub-Agent Partner *
                      </label>
                      <select
                        name="subAgentId"
                        required
                        value={formData.subAgentId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                      >
                        <option value="">Select Agent</option>
                        {subAgents.map((sa) => (
                          <option key={sa.id} value={sa.id}>{sa.name} ({(sa.subAgentCommissionSplit * 100).toFixed(0)}%)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Guardian Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  5. Guardian / Parent Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="guardianName">
                      Guardian Name
                    </label>
                    <input
                      id="guardianName"
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      placeholder="e.g. Hari Prasad Giri"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1">
                      Relation
                    </label>
                    <select
                      name="guardianRelation"
                      value={formData.guardianRelation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="guardianPhone">
                      Guardian Mobile
                    </label>
                    <input
                      id="guardianPhone"
                      type="text"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9801XXXXXX"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="guardianEmail">
                      Guardian Email
                    </label>
                    <input
                      id="guardianEmail"
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleInputChange}
                      placeholder="e.g. parent@gmail.com"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setConvertingVisitorId(null); }}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Create Profile</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
