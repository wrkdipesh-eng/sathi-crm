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
  X
} from 'lucide-react';

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
    academicHistory: '',
    testType: 'IELTS',
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
          if (!['VISA_GRANTED', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(stage)) return false;
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
    setIsSubmitting(true);
    setFormError(null);

    // Build the request body with formatted test scores
    const requestData = {
      ...formData,
      testScores: formData.testScore ? { [formData.testType.toLowerCase()]: parseFloat(formData.testScore) } : {},
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

      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        academicHistory: '',
        testType: 'IELTS',
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
  const decisionCount = allApplicants.filter(a => ['VISA_GRANTED', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(a.pipelineStage)).length;

  const totalLeadsCount = allApplicants.length;
  const activePipelinesCount = allApplicants.filter(a => !['INQUIRY', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(a.pipelineStage)).length;
  const stuckLeadsCount = allApplicants.filter(a => a.daysInCurrentStage >= stuckThreshold).length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Applicants & Leads</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage and track candidate pipelines from counseling to visa approval.
          </p>
        </div>
        {currentUser?.role !== 'FINANCE' && currentUser?.role !== 'STUDENT_PORTAL' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Applicant</span>
          </button>
        )}
      </div>

      {/* Filters Section */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Stage Filter */}
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

          {/* Branch Filter (only visible for Directors/HQ or read-only) */}
          {currentUser?.role === 'DIRECTOR' ? (
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

          {/* Counselor Filter (HQ and Manager role only) */}
          {(currentUser?.role === 'DIRECTOR' || currentUser?.role === 'BRANCH_MANAGER') && (
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
          )}

          {/* Source Filter */}
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

          {/* Target Country Filter */}
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

          {/* University Filter */}
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

        {/* Stuck Leads Filter */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/60 pt-4 gap-4">
          <div className="flex items-center space-x-3">
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
          <span className="text-[10px] text-slate-500 font-mono">
            Showing {applicants.length} record{applicants.length !== 1 && 's'}
          </span>
        </div>
      </div>

      {/* Horizontal Quick-Filter Pill Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
          <span className="text-xs font-bold text-slate-400">Quick Filters</span>
          {(priorityFilter || categoryFilter || stuckFilter) && (
            <button
              onClick={() => {
                setPriorityFilter('');
                setCategoryFilter('');
                setStuckFilter(false);
              }}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer transition-all select-none animate-fade-in"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          {/* Priority Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Priority</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPriorityFilter(priorityFilter === 'HOT' ? '' : 'HOT')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  priorityFilter === 'HOT'
                    ? 'bg-rose-500/20 text-rose-455 border-rose-500/50'
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
                    ? 'bg-orange-500/20 text-orange-455 border-orange-500/50'
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
                    ? 'bg-sky-500/20 text-sky-455 border-sky-500/50'
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
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Pipeline</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCategoryFilter(categoryFilter === 'LEAD' ? '' : 'LEAD')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'LEAD'
                    ? 'bg-rose-500/20 text-rose-455 border-rose-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Lead Stage ({leadCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'INQUIRING' ? '' : 'INQUIRING')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'INQUIRING'
                    ? 'bg-indigo-500/20 text-indigo-455 border-indigo-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Inquiring ({inquiringCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'CLASS_ENROLLMENTS' ? '' : 'CLASS_ENROLLMENTS')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'CLASS_ENROLLMENTS'
                    ? 'bg-sky-500/20 text-sky-455 border-sky-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Class Enrollments ({classEnrollmentCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'ABROAD_ENROLLMENTS' ? '' : 'ABROAD_ENROLLMENTS')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'ABROAD_ENROLLMENTS'
                    ? 'bg-amber-500/20 text-amber-455 border-amber-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Abroad Enrollments ({abroadEnrollmentCount})</span>
              </button>

              <button
                onClick={() => setCategoryFilter(categoryFilter === 'DECISION' ? '' : 'DECISION')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  categoryFilter === 'DECISION'
                    ? 'bg-emerald-500/20 text-emerald-455 border-emerald-500/40'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Decision ({decisionCount})</span>
              </button>
            </div>
          </div>

          {/* Stats Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">Overview</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPriorityFilter('');
                  setCategoryFilter('');
                  setStuckFilter(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  (!priorityFilter && !categoryFilter && !stuckFilter)
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
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
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Active Pipelines ({activePipelinesCount})</span>
              </button>

              <button
                onClick={() => {
                  setStuckFilter(!stuckFilter);
                  setCategoryFilter('');
                  setPriorityFilter('');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                  stuckFilter
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Stuck Leads ({stuckLeadsCount})</span>
              </button>
            </div>
          </div>
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
                  <th className="px-6 py-4">Stage Age</th>
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
                          ? 'bg-amber-950/15 hover:bg-amber-900/25 border-l-2 border-l-amber-500/60' 
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
                              app.priority === 'HOT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              app.priority === 'WARM' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-sky-500/20 text-sky-400 border border-sky-500/30'
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
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="px-1 py-0.2 bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 text-[8px] rounded uppercase font-bold tracking-wide">
                              Primary
                            </span>
                            <span className="text-[10px] text-indigo-400 font-semibold">{app.targetCountry}</span>
                          </div>
                        </div>
                        
                        {/* Secondary Targets */}
                        {app.applications && app.applications.map((otherApp: any) => (
                          <div key={otherApp.id} className="mt-2 pt-2 border-t border-slate-800/40">
                            <span className="text-slate-300 text-[11px] truncate block max-w-[200px] font-medium" title={otherApp.targetCourse}>
                              {otherApp.targetCourse || 'Undecided'}
                            </span>
                            <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px]">
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

      {/* Add Applicant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">Add New Student Profile</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
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

              {/* 2. Academic & Tests */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  2. Academic & Test Scores
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="academicHistory">
                      Academic History (Latest qualification & GPA/Percentage)
                    </label>
                    <input
                      id="academicHistory"
                      type="text"
                      name="academicHistory"
                      value={formData.academicHistory}
                      onChange={handleInputChange}
                      placeholder="e.g. +2 Science, GPA 3.25 / BBS, 62%"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                        <option value="IELTS">IELTS</option>
                        <option value="PTE">PTE</option>
                        <option value="SAT">SAT</option>
                        <option value="TOEFL">TOEFL</option>
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
                        placeholder="e.g. 7.5 / 64"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Study Abroad Intent */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                  3. Study Abroad Placement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-slate-400 font-medium mb-1 font-mono">Select Represented University (Optional Auto-fill)</label>
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
                      {partnerUnis.map((uni) => (
                        <option key={uni.id} value={uni.id}>
                          {uni.name} ({uni.course} - {uni.country}) {uni.type === 'PORTAL' ? `[Portal: ${uni.portalName || 'N/A'}]` : '[Direct]'}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom (Fill manual fields below)</option>
                    </select>
                  </div>

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

                  {currentUser?.role === 'DIRECTOR' ? (
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
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>



                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1" htmlFor="priority">
                      Lead Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">No Priority</option>
                      <option value="HOT">🔥 Hot</option>
                      <option value="WARM">⚡ Warm</option>
                      <option value="COLD">❄️ Cold</option>
                    </select>
                  </div>

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
                  onClick={() => setIsModalOpen(false)}
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
