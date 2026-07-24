'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Award,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Globe,
  Loader2,
  Calendar,
  Flame,
  Zap,
  Snowflake,
  HelpCircle,
  UserPlus,
  BookOpen,
  Filter,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);

  // Inline drill-down: clicking any dashboard metric shows the matching leads
  // right here on the dashboard instead of navigating away, so a director can
  // track everything from one screen.
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [drill, setDrill] = useState<{ key: string; label: string; match: (a: any) => boolean } | null>(null);
  const drillPanelRef = React.useRef<HTMLDivElement | null>(null);

  const openDrill = (key: string, label: string, match: (a: any) => boolean) => {
    setDrill((prev) => (prev && prev.key === key ? null : { key, label, match }));
  };

  useEffect(() => {
    if (drill && drillPanelRef.current) {
      drillPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [drill]);

  useEffect(() => {
    async function loadUser() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }
        const branchRes = await fetch('/api/branches');
        if (branchRes.ok) {
          const branchData = await branchRes.json();
          setBranches(branchData.branches || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const reportParams = new URLSearchParams();
        if (selectedCountry) reportParams.set('country', selectedCountry);
        if (selectedBranch) reportParams.set('branchId', selectedBranch);
        const url = reportParams.toString() ? `/api/reports?${reportParams}` : '/api/reports';

        const leadParams = new URLSearchParams();
        if (selectedCountry) leadParams.set('targetCountry', selectedCountry);
        if (selectedBranch) leadParams.set('branchId', selectedBranch);
        const leadsUrl = leadParams.toString() ? `/api/applicants?${leadParams}` : '/api/applicants';

        const [reportsRes, leadsRes] = await Promise.all([fetch(url), fetch(leadsUrl)]);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setData(reportsData);
        }
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setAllLeads(leadsData.applicants || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
    setDrill(null);
  }, [selectedCountry, selectedBranch]);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Loading operations dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Failed to load dashboard metrics. Please reload the page.</p>
      </div>
    );
  }

  const {
    countries = [],
    kpis,
    counselorConversions,
    visaStats,
    agingLeads,
    leadsByCountry = [],
    leadsBySource = [],
    quickFilters = {
      hotCount: 0,
      warmCount: 0,
      coldCount: 0,
      noPriorityCount: 0,
      leadCount: 0,
      inquiringCount: 0,
      classEnrollmentCount: 0,
      abroadEnrollmentCount: 0,
      decisionCount: 0
    }
  } = data;

  // Overall visa approval rate across every decided case (granted / refused / pre-departure)
  const totalDecided = visaStats.reduce((sum: number, v: any) => sum + v.total, 0);
  const totalApproved = visaStats.reduce((sum: number, v: any) => sum + v.approved, 0);
  const approvalRate = totalDecided > 0 ? Math.round((totalApproved / totalDecided) * 100) : null;

  // The full journey a lead takes, left to right — same underlying counts the
  // old 5-card grid used, just presented as a single readable funnel.
  const funnelStages = [
    {
      key: 'LEAD',
      label: 'New Leads',
      sub: 'Just came in, not yet counselled',
      count: quickFilters.leadCount,
      match: (a: any) => a.pipelineStage === 'INQUIRY',
      bar: 'bg-rose-500', text: 'text-rose-400', dot: 'bg-rose-500',
    },
    {
      key: 'INQUIRING',
      label: 'In Counselling',
      sub: 'Actively being advised by a counselor',
      count: quickFilters.inquiringCount,
      match: (a: any) => a.pipelineStage === 'COUNSELLING',
      bar: 'bg-indigo-500', text: 'text-indigo-400', dot: 'bg-indigo-500',
    },
    {
      key: 'CLASS_ENROLLMENTS',
      label: 'Preparing to Apply',
      sub: 'Enrolled in language / test preparation',
      count: quickFilters.classEnrollmentCount,
      match: (a: any) => a.pipelineStage === 'CLASS_ENROLLMENT',
      bar: 'bg-sky-500', text: 'text-sky-400', dot: 'bg-sky-500',
    },
    {
      key: 'ABROAD_ENROLLMENTS',
      label: 'Applying & Visa Processing',
      sub: 'Application submitted through visa filed',
      count: quickFilters.abroadEnrollmentCount,
      match: (a: any) => ['APPLICATION_SUBMITTED', 'OFFER', 'VISA_FILED'].includes(a.pipelineStage),
      bar: 'bg-amber-500', text: 'text-amber-400', dot: 'bg-amber-500',
    },
    {
      key: 'DECISION',
      label: 'Decision Made',
      sub: 'Visa granted, refused, or preparing to depart',
      count: quickFilters.decisionCount,
      match: (a: any) => ['VISA_GRANTED', 'PRE_DEPARTURE'].includes(a.pipelineStage),
      bar: 'bg-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-500',
    },
  ];
  const funnelMax = Math.max(1, ...funnelStages.map((s) => s.count));

  // The leads behind the currently-selected metric, filtered client-side so
  // the inline list exactly matches the number shown on the card/stage.
  const drillLeads = drill ? allLeads.filter(drill.match) : [];

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">Operations Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="font-semibold text-slate-200">{currentUser?.name}</span> ({currentUser?.role})
            <span className="text-slate-600"> &middot; A snapshot of your leads, pipeline, and what needs attention today.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter — only for roles that span multiple branches, so a
              director/superadmin can view one branch's overview at a time */}
          {currentUser && !currentUser.branchId && ['SUPERADMIN', 'DIRECTOR', 'ACCOUNTS', 'FINANCE', 'DOCUMENTATION_OFFICER', 'FRONT_DESK_OFFICER', 'MANAGER'].includes(currentUser.role) && branches.length > 0 && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-400">Branch:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none text-slate-100 font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Country Filter */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-400">Target Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent border-none text-slate-100 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Countries</option>
              {countries.map((c: string) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Executive Summary — the four numbers a director cares about most.
          Clicking a card opens the matching leads inline below, not a new page. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => openDrill('total', 'All Leads', () => true)}
          className={`text-left p-6 rounded-2xl bg-slate-900 border shadow-sm transition-all group cursor-pointer ${drill?.key === 'total' ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800 hover:border-indigo-500/40'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-100 font-mono">{kpis.totalLeads}</h2>
          <p className="text-xs text-slate-500 mt-2">Every student who has ever entered the system</p>
        </button>

        <button
          type="button"
          onClick={() => openDrill('active', 'Active Pipeline', (a) => !['INQUIRY', 'PRE_DEPARTURE'].includes(a.pipelineStage))}
          className={`text-left p-6 rounded-2xl bg-slate-900 border shadow-sm transition-all group cursor-pointer ${drill?.key === 'active' ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-slate-800 hover:border-purple-500/40'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Pipeline</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-100 font-mono">{kpis.activePipelines}</h2>
          <p className="text-xs text-slate-500 mt-2">Currently being counselled, applying, or awaiting a decision</p>
        </button>

        <button
          type="button"
          onClick={() => openDrill('decided', 'Decided Cases (Visa Approval)', (a) => ['VISA_GRANTED', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(a.pipelineStage) || a.everRefused)}
          className={`text-left p-6 rounded-2xl bg-slate-900 border shadow-sm transition-all group cursor-pointer ${drill?.key === 'decided' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800 hover:border-emerald-500/40'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visa Approval Rate</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-100 font-mono">{approvalRate !== null ? `${approvalRate}%` : '—'}</h2>
          <p className="text-xs text-slate-500 mt-2">
            {totalDecided > 0 ? `${totalApproved} of ${totalDecided} decided cases approved` : 'No visa decisions logged yet'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => openDrill('stuck', 'Needs Attention (Stuck Leads)', (a) => (a.daysInCurrentStage || 0) >= 7)}
          className={`text-left p-6 rounded-2xl border shadow-sm transition-all group cursor-pointer ${
            drill?.key === 'stuck'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : kpis.stuckLeads > 0
              ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Attention</span>
            <div className={`p-2 rounded-xl group-hover:scale-105 transition-transform ${kpis.stuckLeads > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h2 className={`text-4xl font-extrabold font-mono ${kpis.stuckLeads > 0 ? 'text-amber-600' : 'text-slate-100'}`}>{kpis.stuckLeads}</h2>
          <p className="text-xs text-slate-500 mt-2">Leads stuck in the same stage for over a week</p>
        </button>
      </div>

      {/* Inline drill-down — the leads behind whatever metric was clicked */}
      {drill && (
        <div ref={drillPanelRef} className="rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-lg overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-indigo-500/5">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center">
                <Filter className="w-4 h-4 mr-2 text-indigo-500" />
                {drill.label}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {drillLeads.length} {drillLeads.length === 1 ? 'lead' : 'leads'}
                {selectedBranch ? ` · ${branches.find((b) => b.id === selectedBranch)?.name || 'Branch'}` : ''}
                {selectedCountry ? ` · ${selectedCountry}` : ''} · click a name to open the full profile
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrill(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {drillLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No leads in this category right now.</div>
          ) : (
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-950/60 backdrop-blur">
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Counselor / Branch</th>
                    <th className="px-6 py-3">Target</th>
                    <th className="px-6 py-3 text-right">Days in Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {drillLeads.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-850/40 transition-all">
                      <td className="px-6 py-3 font-semibold text-slate-200">
                        <Link href={`/dashboard/applicants/${a.id}`} className="hover:text-indigo-500 hover:underline">
                          {a.name}
                        </Link>
                        {(a.phone || a.email) && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{a.phone || a.email}</div>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                          {(a.pipelineStage || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {a.priority ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            a.priority === 'HOT' ? 'bg-rose-100 text-rose-700' :
                            a.priority === 'WARM' ? 'bg-orange-100 text-orange-700' :
                            'bg-sky-100 text-sky-700'
                          }`}>{a.priority}</span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {a.counselor?.name || 'Unassigned'}
                        <div className="text-[10px] text-slate-500">{a.branch?.name || ''}</div>
                      </td>
                      <td className="px-6 py-3 text-slate-400">{a.targetCountry || '—'}</td>
                      <td className={`px-6 py-3 text-right font-mono ${(a.daysInCurrentStage || 0) >= 7 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                        {a.daysInCurrentStage || 0}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Funnel — the single clearest picture of where every lead stands */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Where Are Our Leads Right Now?</h3>
          <p className="text-xs text-slate-500 mt-1">Every lead moves left to right through this journey — click a stage to see exactly who's in it.</p>
        </div>
        <div className="space-y-5">
          {funnelStages.map((stage) => {
            const pct = kpis.totalLeads > 0 ? Math.round((stage.count / kpis.totalLeads) * 100) : 0;
            const barWidth = stage.count > 0 ? Math.max(Math.round((stage.count / funnelMax) * 100), 3) : 0;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => openDrill(`stage-${stage.key}`, stage.label, stage.match)}
                className={`block w-full text-left group rounded-xl p-2 -m-2 transition-all cursor-pointer ${drill?.key === `stage-${stage.key}` ? 'bg-slate-850/60 ring-1 ring-indigo-500/40' : 'hover:bg-slate-850/30'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                    <span className="text-xs font-bold text-slate-200 group-hover:text-slate-100">{stage.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">{pct}% of total</span>
                    <span className={`text-sm font-extrabold font-mono ${stage.text}`}>{stage.count}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-850 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${stage.bar} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{stage.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lead Priority — grouped under one clear, plain-language header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Who Needs a Call Today?</h3>
          <p className="text-xs text-slate-500 mt-1">Priority is set automatically from commitment dates and follow-up activity — no manual guesswork.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => openDrill('prio-HOT', 'Hot Leads', (a) => a.priority === 'HOT')}
            className={`text-left w-full p-4 rounded-xl bg-slate-850/40 border flex justify-between items-start transition-all cursor-pointer group ${drill?.key === 'prio-HOT' ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800 hover:border-rose-500/40 hover:bg-rose-950/10'}`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hot</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-rose-400 transition-colors">{quickFilters.hotCount}</h3>
              <span className="text-[9px] text-slate-500 block">Ready to convert — call first</span>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => openDrill('prio-WARM', 'Warm Leads', (a) => a.priority === 'WARM')}
            className={`text-left w-full p-4 rounded-xl bg-slate-850/40 border flex justify-between items-start transition-all cursor-pointer group ${drill?.key === 'prio-WARM' ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-800 hover:border-orange-500/40 hover:bg-orange-950/10'}`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Warm</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-orange-400 transition-colors">{quickFilters.warmCount}</h3>
              <span className="text-[9px] text-slate-500 block">Engaged — needs regular follow-up</span>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => openDrill('prio-COLD', 'Cold Leads', (a) => a.priority === 'COLD')}
            className={`text-left w-full p-4 rounded-xl bg-slate-850/40 border flex justify-between items-start transition-all cursor-pointer group ${drill?.key === 'prio-COLD' ? 'border-sky-500 ring-2 ring-sky-500/30' : 'border-slate-800 hover:border-sky-500/40 hover:bg-sky-950/10'}`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cold</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-sky-400 transition-colors">{quickFilters.coldCount}</h3>
              <span className="text-[9px] text-slate-500 block">Missed follow-ups — needs re-engaging</span>
            </div>
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
              <Snowflake className="w-5 h-5" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => openDrill('prio-NONE', 'No Priority', (a) => !a.priority)}
            className={`text-left w-full p-4 rounded-xl bg-slate-850/40 border flex justify-between items-start transition-all cursor-pointer group ${drill?.key === 'prio-NONE' ? 'border-slate-500 ring-2 ring-slate-500/30' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'}`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No Priority</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-slate-300 transition-colors">{quickFilters.noPriorityCount}</h3>
              <span className="text-[9px] text-slate-500 block">Already applied — off the lead funnel</span>
            </div>
            <div className="p-2 bg-slate-800 rounded-xl text-slate-400 shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      {/* Demographics & Channel — side by side to use the space efficiently */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Leads by Target Country</h3>
              <p className="text-xs text-slate-500 mt-0.5">Where our students want to go</p>
            </div>
            <Globe className="w-5 h-5 text-indigo-500/60" />
          </div>
          <div className="space-y-3.5 pt-1">
            {leadsByCountry?.length === 0 ? (
              <p className="text-xs text-slate-500">No country data available.</p>
            ) : (
              leadsByCountry?.slice(0, 5).map((lc: any) => {
                const percent = kpis.totalLeads > 0 ? Math.round((lc.count / kpis.totalLeads) * 100) : 0;
                return (
                  <button
                    key={lc.country}
                    type="button"
                    onClick={() => openDrill(`country-${lc.country}`, `Leads — ${lc.country}`, (a) => a.targetCountry === lc.country)}
                    className={`block w-full text-left space-y-1.5 transition-all cursor-pointer p-1.5 -mx-1.5 rounded-lg ${drill?.key === `country-${lc.country}` ? 'bg-slate-850/60 ring-1 ring-indigo-500/40' : 'hover:bg-slate-850/40'}`}
                  >
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{lc.country}</span>
                      <span className="text-indigo-500">{lc.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Leads by Source</h3>
              <p className="text-xs text-slate-500 mt-0.5">Where our leads are coming from</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-500/60" />
          </div>
          <div className="space-y-3.5 pt-1">
            {leadsBySource.length === 0 ? (
              <p className="text-xs text-slate-500">No leads recorded.</p>
            ) : (
              leadsBySource.map((s: any) => {
                const percent = kpis.totalLeads > 0 ? Math.round((s.count / kpis.totalLeads) * 100) : 0;
                return (
                  <button
                    key={s.source}
                    type="button"
                    onClick={() => openDrill(`source-${s.source}`, `Leads — ${s.source.replace('_', ' ')}`, (a) => a.source === s.source)}
                    className={`block w-full text-left space-y-1.5 cursor-pointer p-1.5 -mx-1.5 rounded-lg transition-all ${drill?.key === `source-${s.source}` ? 'bg-slate-850/60 ring-1 ring-indigo-500/40' : 'hover:bg-slate-850/40'}`}
                  >
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{s.source.replace('_', ' ')}</span>
                      <span>{s.count} lead{s.count !== 1 && 's'} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Grid: Counselor Conversions & Visa Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Counselor Conversion Rankings */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100">Counselor Performance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Who's converting the most leads into applications</p>
          </div>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-2">Counselor Name</th>
                  <th className="pb-2">Assigned Leads</th>
                  <th className="pb-2">Converted (Offer+)</th>
                  <th className="pb-2 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {counselorConversions.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-500">No counselors on record yet.</td></tr>
                ) : counselorConversions.map((cc: any) => (
                  <tr
                    key={cc.counselorName}
                    className="hover:bg-slate-850/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/applicants?counselorId=${cc.counselorId}`)}
                  >
                    <td className="py-2.5 font-semibold text-slate-200">{cc.counselorName}</td>
                    <td className="py-2.5">{cc.total}</td>
                    <td className="py-2.5">{cc.converted}</td>
                    <td className="py-2.5 text-right font-bold text-indigo-400 font-mono">{cc.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visa Approvals by Target Country */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100">Visa Approval Ratios</h3>
            <p className="text-xs text-slate-500 mt-0.5">Approved vs. total decisions, by destination</p>
          </div>
          <div className="space-y-4 pt-2 text-xs">
            {visaStats.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No visa decisions logged.</p>
            ) : (
              visaStats.map((vs: any) => (
                <button
                  key={vs.country}
                  type="button"
                  onClick={() => openDrill(`visa-${vs.country}`, `Decided Cases — ${vs.country}`, (a) => a.targetCountry === vs.country && (['VISA_GRANTED', 'VISA_REFUSED', 'PRE_DEPARTURE'].includes(a.pipelineStage) || a.everRefused))}
                  className={`w-full text-left flex justify-between items-center p-3 bg-slate-850/50 rounded-xl border cursor-pointer transition-all ${drill?.key === `visa-${vs.country}` ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-indigo-500/30 hover:bg-slate-850/40'}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <div>
                      <span className="font-bold text-slate-200 block">{vs.country}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{vs.approved} approved out of {vs.total} cases</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-indigo-600 text-white font-bold font-mono text-sm shadow-sm">
                    {vs.rate}%
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stuck Leads Aging Card Report */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
              Leads That Need Immediate Attention
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 ml-6">Sitting in the same stage for over a week with no progress</p>
          </div>
          <Link href="/dashboard/applicants?stuck=true" className="text-xs text-indigo-600 hover:underline flex items-center font-semibold shrink-0">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {agingLeads.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-xs">Nothing stuck right now — every lead is moving forward on schedule.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-2">Student Name</th>
                  <th className="pb-2">Current Pipeline Stage</th>
                  <th className="pb-2">Assigned Counselor</th>
                  <th className="pb-2">Branch Office</th>
                  <th className="pb-2 text-right">Days Stuck</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {agingLeads.map((al: any) => (
                  <tr key={al.id} className="hover:bg-slate-850/50">
                    <td className="py-2.5 font-bold text-slate-200">
                      <Link href={`/dashboard/applicants/${al.id}`} className="hover:text-indigo-600 hover:underline">
                        {al.name}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 bg-slate-850 text-[9px] rounded font-semibold text-slate-400">
                        {al.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5">{al.counselor}</td>
                    <td className="py-2.5 text-slate-400">{al.branch}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-amber-600">{al.days} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
