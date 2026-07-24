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
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  useEffect(() => {
    async function loadUser() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
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
        const url = selectedCountry
          ? `/api/reports?country=${encodeURIComponent(selectedCountry)}`
          : '/api/reports';
        const reportsRes = await fetch(url);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setData(reportsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [selectedCountry]);

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
      href: '/dashboard/applicants?category=LEAD',
      bar: 'bg-rose-500', text: 'text-rose-400', dot: 'bg-rose-500',
    },
    {
      key: 'INQUIRING',
      label: 'In Counselling',
      sub: 'Actively being advised by a counselor',
      count: quickFilters.inquiringCount,
      href: '/dashboard/applicants?category=INQUIRING',
      bar: 'bg-indigo-500', text: 'text-indigo-400', dot: 'bg-indigo-500',
    },
    {
      key: 'CLASS_ENROLLMENTS',
      label: 'Preparing to Apply',
      sub: 'Enrolled in language / test preparation',
      count: quickFilters.classEnrollmentCount,
      href: '/dashboard/applicants?category=CLASS_ENROLLMENTS',
      bar: 'bg-sky-500', text: 'text-sky-400', dot: 'bg-sky-500',
    },
    {
      key: 'ABROAD_ENROLLMENTS',
      label: 'Applying & Visa Processing',
      sub: 'Application submitted through visa filed',
      count: quickFilters.abroadEnrollmentCount,
      href: '/dashboard/applicants?category=ABROAD_ENROLLMENTS',
      bar: 'bg-amber-500', text: 'text-amber-400', dot: 'bg-amber-500',
    },
    {
      key: 'DECISION',
      label: 'Decision Made',
      sub: 'Visa granted, refused, or preparing to depart',
      count: quickFilters.decisionCount,
      href: '/dashboard/applicants?category=DECISION',
      bar: 'bg-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-500',
    },
  ];
  const funnelMax = Math.max(1, ...funnelStages.map((s) => s.count));

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

        {/* Country Filter */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-300">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-slate-400">Target Country:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-transparent border-none text-slate-105 font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Countries</option>
            {countries.map((c: string) => (
              <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Executive Summary — the four numbers a director cares about most */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/dashboard/applicants"
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-indigo-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-100 font-mono">{kpis.totalLeads}</h2>
          <p className="text-xs text-slate-500 mt-2">Every student who has ever entered the system</p>
        </Link>

        <Link
          href="/dashboard/applicants?category=ACTIVE_PIPELINES"
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-purple-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Pipeline</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-slate-100 font-mono">{kpis.activePipelines}</h2>
          <p className="text-xs text-slate-500 mt-2">Currently being counselled, applying, or awaiting a decision</p>
        </Link>

        <Link
          href="/dashboard/applicants?category=DECISION"
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all group"
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
        </Link>

        <Link
          href="/dashboard/applicants?stuck=true"
          className={`p-6 rounded-2xl border shadow-sm transition-all group ${
            kpis.stuckLeads > 0
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
          <h2 className={`text-4xl font-extrabold font-mono ${kpis.stuckLeads > 0 ? 'text-amber-500' : 'text-slate-100'}`}>{kpis.stuckLeads}</h2>
          <p className="text-xs text-slate-500 mt-2">Leads stuck in the same stage for over a week</p>
        </Link>
      </div>

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
              <Link key={stage.key} href={stage.href} className="block group">
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
              </Link>
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
          <Link
            href="/dashboard/applicants?priority=HOT"
            className="p-4 rounded-xl bg-slate-850/40 border border-slate-800 flex justify-between items-start hover:border-rose-500/40 hover:bg-rose-950/10 transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hot</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-rose-400 transition-colors">{quickFilters.hotCount}</h3>
              <span className="text-[9px] text-slate-500 block">Ready to convert — call first</span>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/dashboard/applicants?priority=WARM"
            className="p-4 rounded-xl bg-slate-850/40 border border-slate-800 flex justify-between items-start hover:border-orange-500/40 hover:bg-orange-950/10 transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Warm</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-orange-400 transition-colors">{quickFilters.warmCount}</h3>
              <span className="text-[9px] text-slate-500 block">Engaged — needs regular follow-up</span>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/dashboard/applicants?priority=COLD"
            className="p-4 rounded-xl bg-slate-850/40 border border-slate-800 flex justify-between items-start hover:border-sky-500/40 hover:bg-sky-950/10 transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cold</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-sky-400 transition-colors">{quickFilters.coldCount}</h3>
              <span className="text-[9px] text-slate-500 block">Missed follow-ups — needs re-engaging</span>
            </div>
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
              <Snowflake className="w-5 h-5" />
            </div>
          </Link>

          <Link
            href="/dashboard/applicants?priority=NONE"
            className="p-4 rounded-xl bg-slate-850/40 border border-slate-800 flex justify-between items-start hover:border-slate-700 hover:bg-slate-850/60 transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No Priority</span>
              <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-slate-300 transition-colors">{quickFilters.noPriorityCount}</h3>
              <span className="text-[9px] text-slate-500 block">Already applied — off the lead funnel</span>
            </div>
            <div className="p-2 bg-slate-800 rounded-xl text-slate-400 shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
          </Link>
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
                  <Link
                    key={lc.country}
                    href={`/dashboard/applicants?targetCountry=${encodeURIComponent(lc.country)}`}
                    className="block space-y-1.5 hover:opacity-100 opacity-90 hover:opacity-100 transition-all cursor-pointer p-1.5 -mx-1.5 rounded-lg hover:bg-slate-850/40"
                  >
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{lc.country}</span>
                      <span className="text-indigo-400">{lc.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </Link>
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
                  <Link
                    key={s.source}
                    href={`/dashboard/applicants?source=${encodeURIComponent(s.source)}`}
                    className="block space-y-1.5 cursor-pointer p-1.5 -mx-1.5 rounded-lg hover:bg-slate-850/40 transition-all"
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
                  </Link>
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
                <Link
                  key={vs.country}
                  href={`/dashboard/applicants?targetCountry=${encodeURIComponent(vs.country)}&category=DECISION`}
                  className="flex justify-between items-center p-3 bg-slate-850/50 rounded-xl border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-850/40 cursor-pointer transition-all"
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
                </Link>
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
