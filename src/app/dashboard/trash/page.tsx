'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

type TabKey = 'APPLICANTS' | 'VISITORS';

export default function TrashPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('APPLICANTS');

  const [applicants, setApplicants] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUser(data?.user || null))
      .finally(() => setUserLoading(false));
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const [applicantsRes, visitorsRes] = await Promise.all([
        fetch('/api/trash/applicants'),
        fetch('/api/trash/visitors'),
      ]);
      if (applicantsRes.ok) setApplicants((await applicantsRes.json()).applicants || []);
      if (visitorsRes.ok) setVisitors((await visitorsRes.json()).visitors || []);
    } catch (err) {
      console.error('Fetch trash error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'SUPERADMIN') {
      fetchTrash();
    }
  }, [currentUser]);

  const handleRestore = async (kind: TabKey, id: string) => {
    setBusyId(id);
    try {
      const endpoint = kind === 'APPLICANTS' ? `/api/trash/applicants/${id}` : `/api/trash/visitors/${id}`;
      const res = await fetch(endpoint, { method: 'PATCH' });
      if (res.ok) {
        fetchTrash();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to restore');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (kind: TabKey, id: string, name: string) => {
    const label = kind === 'APPLICANTS' ? 'applicant' : 'visitor';
    if (!confirm(`Permanently delete ${label} "${name}"? This cannot be undone -- all related records will be destroyed.`)) return;
    setBusyId(id);
    try {
      const endpoint = kind === 'APPLICANTS' ? `/api/trash/applicants/${id}` : `/api/trash/visitors/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchTrash();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to permanently delete');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-xs">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  if (currentUser?.role !== 'SUPERADMIN') {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-200">Superadmin access only</h2>
        <p className="text-xs text-slate-400 mt-2">
          The Trash section is restricted to Superadmin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-500" />
          Trash
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deleted applicants and visitors. Restore them or permanently delete -- superadmin only.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('APPLICANTS')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'APPLICANTS'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Applicants ({applicants.length})
        </button>
        <button
          onClick={() => setActiveTab('VISITORS')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'VISITORS'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Visitors ({visitors.length})
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading trash...
          </div>
        ) : activeTab === 'APPLICANTS' ? (
          applicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trash2 className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-sm text-slate-400 font-medium">Trash is empty</p>
              <p className="text-xs text-slate-500 mt-1">Deleted applicants will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Deleted By</th>
                    <th className="px-6 py-4">Deleted At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-slate-350">
                  {applicants.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-850/40 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-200">{a.name}</td>
                      <td className="px-6 py-4 text-slate-300">
                        {a.phone || <span className="text-slate-600">—</span>}
                        {a.email && <div className="text-[10px] text-slate-500 mt-0.5">{a.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{a.branch?.name}</td>
                      <td className="px-6 py-4 text-slate-400">{a.deletedBy?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                        {a.deletedAt ? new Date(a.deletedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleRestore('APPLICANTS', a.id)}
                            disabled={busyId === a.id}
                            className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 bg-slate-850 hover:bg-emerald-50 text-emerald-500 border border-slate-800 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete('APPLICANTS', a.id, a.name)}
                            disabled={busyId === a.id}
                            className="whitespace-nowrap px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : visitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="w-8 h-8 text-slate-700 mb-3" />
            <p className="text-sm text-slate-400 font-medium">Trash is empty</p>
            <p className="text-xs text-slate-500 mt-1">Deleted visitors will show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Deleted By</th>
                  <th className="px-6 py-4">Deleted At</th>
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
                    <td className="px-6 py-4 text-slate-400">{v.deletedBy?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {v.deletedAt ? new Date(v.deletedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleRestore('VISITORS', v.id)}
                          disabled={busyId === v.id}
                          className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 bg-slate-850 hover:bg-emerald-50 text-emerald-500 border border-slate-800 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete('VISITORS', v.id, v.name)}
                          disabled={busyId === v.id}
                          className="whitespace-nowrap px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                        >
                          Delete Permanently
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

      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>Permanently deleting a record destroys all of its related data (documents, communication logs, commissions, etc.) and cannot be undone.</span>
      </div>
    </div>
  );
}
