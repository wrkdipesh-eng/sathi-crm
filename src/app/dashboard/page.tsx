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
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }

        const reportsRes = await fetch('/api/reports');
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
    loadDashboard();
  }, []);

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
    kpis, 
    leadsBySource, 
    revenueByBranch, 
    counselorConversions, 
    visaStats, 
    agingLeads,
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

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">Operations Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="font-semibold text-slate-200">{currentUser?.name}</span> ({currentUser?.role})
          </p>
        </div>
      </div>

      {/* Priority KPI Cards Grid (Row 1: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hot Leads Card */}
        <Link 
          href="/dashboard/applicants?priority=HOT"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-rose-500/40 hover:bg-rose-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hot Leads</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-rose-455 transition-colors">{quickFilters.hotCount}</h3>
            <span className="text-[9px] text-slate-500 block">High conversion priority</span>
          </div>
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-450 shrink-0 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5" />
          </div>
        </Link>

        {/* Warm Leads Card */}
        <Link 
          href="/dashboard/applicants?priority=WARM"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-orange-500/40 hover:bg-orange-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Warm Leads</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-orange-455 transition-colors">{quickFilters.warmCount}</h3>
            <span className="text-[9px] text-slate-500 block">Active follow-up required</span>
          </div>
          <div className="p-2 bg-orange-500/10 rounded-xl text-orange-455 shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
        </Link>

        {/* Cold Leads Card */}
        <Link 
          href="/dashboard/applicants?priority=COLD"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-sky-500/40 hover:bg-sky-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cold Leads</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-sky-455 transition-colors">{quickFilters.coldCount}</h3>
            <span className="text-[9px] text-slate-500 block">Monitor & re-engage</span>
          </div>
          <div className="p-2 bg-sky-500/10 rounded-xl text-sky-455 shrink-0 group-hover:scale-105 transition-transform">
            <Snowflake className="w-5 h-5" />
          </div>
        </Link>

        {/* No Priority Leads Card */}
        <Link 
          href="/dashboard/applicants?priority=NONE"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-slate-700 hover:bg-slate-850/30 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No Priority</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-slate-300 transition-colors">{quickFilters.noPriorityCount}</h3>
            <span className="text-[9px] text-slate-500 block">Unassigned priority leads</span>
          </div>
          <div className="p-2 bg-slate-800 rounded-xl text-slate-400 shrink-0 group-hover:scale-105 transition-transform">
            <HelpCircle className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Pipeline Stage KPI Cards Grid (Row 2: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Lead Category Card */}
        <Link 
          href="/dashboard/applicants?category=LEAD"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-rose-500/40 hover:bg-rose-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Stage</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-rose-455 transition-colors">{quickFilters.leadCount}</h3>
            <span className="text-[9px] text-slate-500 block">Initial inquiry leads</span>
          </div>
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5" />
          </div>
        </Link>

        {/* Inquiring Category Card */}
        <Link 
          href="/dashboard/applicants?category=INQUIRING"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-indigo-500/40 hover:bg-indigo-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inquiring</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-indigo-455 transition-colors">{quickFilters.inquiringCount}</h3>
            <span className="text-[9px] text-slate-500 block">Active counseling stage</span>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </Link>

        {/* Class Enrollments Category Card */}
        <Link 
          href="/dashboard/applicants?category=CLASS_ENROLLMENTS"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-sky-500/40 hover:bg-sky-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Enrollments</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-sky-455 transition-colors">{quickFilters.classEnrollmentCount}</h3>
            <span className="text-[9px] text-slate-500 block">Language prep enrollment</span>
          </div>
          <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
        </Link>

        {/* Abroad Enrollments Category Card */}
        <Link 
          href="/dashboard/applicants?category=ABROAD_ENROLLMENTS"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-amber-500/40 hover:bg-amber-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Abroad Enrollments</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-amber-455 transition-colors">{quickFilters.abroadEnrollmentCount}</h3>
            <span className="text-[9px] text-slate-500 block">Application / Visa processing</span>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
            <Globe className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Outcome & Core KPI Cards Grid (Row 3: 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Decision Category Card */}
        <Link 
          href="/dashboard/applicants?category=DECISION"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-emerald-500/40 hover:bg-emerald-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-emerald-455 transition-colors">{quickFilters.decisionCount}</h3>
            <span className="text-[9px] text-slate-500 block">Visa decision / pre-departure</span>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Link>

        {/* KPI 1: Total Leads */}
        <Link 
          href="/dashboard/applicants"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-indigo-500/40 hover:bg-indigo-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Intake Leads</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-indigo-455 transition-colors">{kpis.totalLeads}</h3>
            <span className="text-[9px] text-slate-500 block">Total students in CRM registry</span>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </Link>

        {/* KPI 2: Active Pipelines */}
        <Link 
          href="/dashboard/applicants?category=ACTIVE_PIPELINES"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-start hover:border-purple-500/40 hover:bg-purple-950/5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Pipelines</span>
            <h3 className="text-2xl font-bold text-slate-100 font-mono group-hover:text-purple-455 transition-colors">{kpis.activePipelines}</h3>
            <span className="text-[9px] text-slate-500 block">Excluding Inquiry/Pre-departure</span>
          </div>
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </Link>

        {/* KPI 3: Stuck Leads */}
        <Link 
          href="/dashboard/applicants?stuck=true"
          className={`p-5 rounded-2xl border flex justify-between items-start transition-all cursor-pointer group ${
            kpis.stuckLeads > 0 
              ? 'bg-amber-950/15 border-amber-800/40 hover:border-amber-500 text-slate-100 shadow-lg shadow-amber-900/5 hover:bg-amber-950/20' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:bg-slate-850/30'
          }`}
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stuck Leads ({'>'}7d)</span>
            <h3 className={`text-2xl font-bold font-mono group-hover:text-amber-400 transition-colors ${kpis.stuckLeads > 0 ? 'text-amber-500' : 'text-slate-100'}`}>{kpis.stuckLeads}</h3>
            <span className="text-[9px] text-slate-500 block">Require immediate counseling touch</span>
          </div>
          <div className={`p-2 rounded-xl shrink-0 group-hover:scale-105 transition-transform ${kpis.stuckLeads > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Grid: Source Breakdown */}
      <div className="grid grid-cols-1 gap-6">
        {/* Source Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Leads by Ingestion Channel</h3>
          <div className="space-y-4 pt-2">
            {leadsBySource.length === 0 ? (
              <p className="text-xs text-slate-500">No leads recorded.</p>
            ) : (
              leadsBySource.map((s: any) => {
                const percent = kpis.totalLeads > 0 ? Math.round((s.count / kpis.totalLeads) * 100) : 0;
                return (
                  <div key={s.source} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{s.source.replace('_', ' ')}</span>
                      <span>{s.count} lead{s.count !== 1 && 's'} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-850 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
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
          <h3 className="font-bold text-sm text-slate-100">Counselor Conversion Performance</h3>
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
                {counselorConversions.map((cc: any) => (
                  <tr key={cc.counselorName} className="hover:bg-slate-850/50">
                    <td className="py-2.5 font-semibold text-slate-200">{cc.counselorName}</td>
                    <td className="py-2.5">{cc.total}</td>
                    <td className="py-2.5">{cc.converted}</td>
                    <td className="py-2.5 text-right font-bold text-indigo-600 font-mono">{cc.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visa Approvals by Target Country */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Visa Approval Ratios</h3>
          <div className="space-y-4 pt-2 text-xs">
            {visaStats.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No visa decisions logged.</p>
            ) : (
              visaStats.map((vs: any) => (
                <div key={vs.country} className="flex justify-between items-center p-3 bg-slate-850/50 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-200 block">{vs.country}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{vs.approved} approved out of {vs.total} cases</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-bold font-mono text-sm border border-indigo-100">
                    {vs.rate}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stuck Leads Aging Card Report */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-100 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
            Lead Aging Report (Stuck Leads Priority)
          </h3>
          <Link href="/dashboard/applicants?stuck=true" className="text-xs text-indigo-600 hover:underline flex items-center font-semibold">
            <span>View All Stuck Leads</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {agingLeads.length === 0 ? (
            <p className="text-slate-500 text-center py-4 text-xs">Fantastic! No leads currently exceed the aging threshold.</p>
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
