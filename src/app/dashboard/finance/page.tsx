'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Printer, 
  Loader2, 
  CheckCircle,
  Clock,
  Filter,
  X,
  FileSpreadsheet,
  AlertCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

export default function FinanceLedgerPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  
  const [branches, setBranches] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [forexRates, setForexRates] = useState<any>(null);
  const [invoiceMode, setInvoiceMode] = useState<'UNIVERSITY' | 'AGENT' | 'BRANCH'>('UNIVERSITY');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [commissionToEdit, setCommissionToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    partnerUniversity: '',
    currency: 'AUD',
    commissionAmountForeign: '',
    nprExchangeRate: '',
    status: 'PENDING',
    agentSplitPercent: '',
    subAgentAmountNpr: '',
    branchSplitPercent: '',
    branchAmountNpr: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Add Commission modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({
    applicantId: '',
    partnerUniversity: '',
    currency: 'USD',
    commissionAmountForeign: '',
    nprExchangeRate: '',
    status: 'PENDING',
    agentSplitPercent: '0',
    subAgentAmountNpr: '0',
    branchSplitPercent: '0',
    branchAmountNpr: '0',
  });
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Bidirectional percentage calculation effect
  useEffect(() => {
    const foreign = parseFloat(editForm.commissionAmountForeign) || 0;
    const rate = parseFloat(editForm.nprExchangeRate) || 0;
    const totalNpr = foreign * rate;

    const agentPct = parseFloat(editForm.agentSplitPercent) || 0;
    const branchPct = parseFloat(editForm.branchSplitPercent) || 0;

    const calculatedAgentNpr = (totalNpr * agentPct) / 100;
    const calculatedBranchNpr = (totalNpr * branchPct) / 100;

    setEditForm((prev) => {
      const nextSubAgent = calculatedAgentNpr > 0 ? calculatedAgentNpr.toFixed(2) : '0';
      const nextBranch = calculatedBranchNpr > 0 ? calculatedBranchNpr.toFixed(2) : '0';

      if (prev.subAgentAmountNpr !== nextSubAgent || prev.branchAmountNpr !== nextBranch) {
        return {
          ...prev,
          subAgentAmountNpr: nextSubAgent,
          branchAmountNpr: nextBranch,
        };
      }
      return prev;
    });
  }, [editForm.commissionAmountForeign, editForm.nprExchangeRate, editForm.agentSplitPercent, editForm.branchSplitPercent]);

  const handleAgentNprChange = (val: string) => {
    const nprVal = parseFloat(val) || 0;
    const foreign = parseFloat(editForm.commissionAmountForeign) || 0;
    const rate = parseFloat(editForm.nprExchangeRate) || 0;
    const totalNpr = foreign * rate;

    const pct = totalNpr > 0 ? (nprVal / totalNpr) * 100 : 0;
    setEditForm(prev => ({
      ...prev,
      subAgentAmountNpr: val,
      agentSplitPercent: pct > 0 ? pct.toFixed(1) : '0',
    }));
  };

  const handleBranchNprChange = (val: string) => {
    const nprVal = parseFloat(val) || 0;
    const foreign = parseFloat(editForm.commissionAmountForeign) || 0;
    const rate = parseFloat(editForm.nprExchangeRate) || 0;
    const totalNpr = foreign * rate;

    const pct = totalNpr > 0 ? (nprVal / totalNpr) * 100 : 0;
    setEditForm(prev => ({
      ...prev,
      branchAmountNpr: val,
      branchSplitPercent: pct > 0 ? pct.toFixed(1) : '0',
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionToEdit) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/finance/commissions/${commissionToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerUniversity: editForm.partnerUniversity,
          currency: editForm.currency,
          commissionAmountForeign: editForm.commissionAmountForeign,
          nprExchangeRate: editForm.nprExchangeRate,
          status: editForm.status,
          subAgentAmountNpr: editForm.subAgentAmountNpr ? parseFloat(editForm.subAgentAmountNpr) : undefined,
          branchAmountNpr: editForm.branchAmountNpr ? parseFloat(editForm.branchAmountNpr) : undefined,
          agentSplitPercent: editForm.agentSplitPercent ? parseFloat(editForm.agentSplitPercent) : null,
          branchSplitPercent: editForm.branchSplitPercent ? parseFloat(editForm.branchSplitPercent) : null,
        }),
      });

      if (res.ok) {
        setEditModalOpen(false);
        setCommissionToEdit(null);
        fetchCommissions();
        alert('Commission updated successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update commission');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating the commission');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCommission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission entry?')) return;
    try {
      const res = await fetch(`/api/finance/commissions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCommissions();
        alert('Commission entry deleted!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete commission');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the commission');
    }
  };

  // Bidirectional percentage calculation effect for Add Form
  useEffect(() => {
    const foreign = parseFloat(addForm.commissionAmountForeign) || 0;
    const rate = parseFloat(addForm.nprExchangeRate) || 0;
    const totalNpr = foreign * rate;

    const agentPct = parseFloat(addForm.agentSplitPercent) || 0;
    const branchPct = parseFloat(addForm.branchSplitPercent) || 0;

    const calculatedAgentNpr = (totalNpr * agentPct) / 100;
    const calculatedBranchNpr = (totalNpr * branchPct) / 100;

    setAddForm((prev) => {
      const nextSubAgent = calculatedAgentNpr > 0 ? calculatedAgentNpr.toFixed(2) : '0';
      const nextBranch = calculatedBranchNpr > 0 ? calculatedBranchNpr.toFixed(2) : '0';

      if (prev.subAgentAmountNpr !== nextSubAgent || prev.branchAmountNpr !== nextBranch) {
        return {
          ...prev,
          subAgentAmountNpr: nextSubAgent,
          branchAmountNpr: nextBranch,
        };
      }
      return prev;
    });
  }, [addForm.commissionAmountForeign, addForm.nprExchangeRate, addForm.agentSplitPercent, addForm.branchSplitPercent]);

  const handleAddAgentNprChange = (val: string) => {
    const nprVal = parseFloat(val) || 0;
    const foreign = parseFloat(addForm.commissionAmountForeign) || 0;
    const rate = parseFloat(addForm.nprExchangeRate) || 0;
    const totalNpr = foreign * rate;

    const pct = totalNpr > 0 ? (nprVal / totalNpr) * 100 : 0;
    setAddForm(prev => ({
      ...prev,
      subAgentAmountNpr: val,
      agentSplitPercent: pct > 0 ? pct.toFixed(1) : '0',
    }));
  };

  const handleAddBranchNprChange = (val: string) => {
    const nprVal = parseFloat(val) || 0;
    const foreign = parseFloat(addForm.commissionAmountForeign) || 0;
    const rate = parseFloat(addForm.nprExchangeRate) || 0;
    const totalNpr = foreign * rate;

    const pct = totalNpr > 0 ? (nprVal / totalNpr) * 100 : 0;
    setAddForm(prev => ({
      ...prev,
      branchAmountNpr: val,
      branchSplitPercent: pct > 0 ? pct.toFixed(1) : '0',
    }));
  };

  const handleAddCurrencyChange = (curr: string) => {
    const rate = forexRates && forexRates[curr] ? String(forexRates[curr].toFixed(2)) : '';
    setAddForm(prev => ({
      ...prev,
      currency: curr,
      nprExchangeRate: rate,
    }));
  };

  const fetchApplicants = async () => {
    try {
      const res = await fetch('/api/applicants');
      const data = await res.json();
      if (data.success) {
        setApplicants(data.applicants);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    }
  };

  useEffect(() => {
    if (isAddModalOpen && applicants.length === 0) {
      fetchApplicants();
    }
  }, [isAddModalOpen]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.applicantId) {
      alert('Please select an applicant.');
      return;
    }
    setIsSavingAdd(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: addForm.applicantId,
          partnerUniversity: addForm.partnerUniversity,
          currency: addForm.currency,
          commissionAmountForeign: addForm.commissionAmountForeign,
          nprExchangeRate: addForm.nprExchangeRate,
          status: addForm.status,
          subAgentAmountNpr: addForm.subAgentAmountNpr ? parseFloat(addForm.subAgentAmountNpr) : undefined,
          branchAmountNpr: addForm.branchAmountNpr ? parseFloat(addForm.branchAmountNpr) : undefined,
          agentSplitPercent: addForm.agentSplitPercent ? parseFloat(addForm.agentSplitPercent) : null,
          branchSplitPercent: addForm.branchSplitPercent ? parseFloat(addForm.branchSplitPercent) : null,
        }),
      });

      if (res.ok) {
        fetchCommissions();
        setIsAddModalOpen(false);
        setAddForm({
          applicantId: '',
          partnerUniversity: '',
          currency: 'USD',
          commissionAmountForeign: '',
          nprExchangeRate: forexRates && forexRates.USD ? String(forexRates.USD.toFixed(2)) : '',
          status: 'PENDING',
          agentSplitPercent: '0',
          subAgentAmountNpr: '0',
          branchSplitPercent: '0',
          branchAmountNpr: '0',
        });
        alert('Commission entry created successfully!');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to create ledger entry');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while creating ledger entry');
    } finally {
      setIsSavingAdd(false);
    }
  };

  const handleSendInvoice = async (recipientType: 'UNIVERSITY' | 'BRANCH' | 'SUB_AGENT') => {
    if (!selectedCommission) return;
    setIsSendingInvoice(true);
    try {
      const res = await fetch('/api/finance/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionId: selectedCommission.id,
          recipientType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Invoice sent successfully!');
      } else {
        alert(data.error || 'Failed to send invoice.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while sending the invoice.');
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const parseFeeAndCurrency = (feeStr: string) => {
    const normalized = (feeStr || '').toUpperCase();
    let currency = 'USD'; // default fallback
    if (normalized.includes('AUD')) currency = 'AUD';
    else if (normalized.includes('CAD')) currency = 'CAD';
    else if (normalized.includes('GBP')) currency = 'GBP';
    else if (normalized.includes('USD')) currency = 'USD';

    // Extract numbers and decimals
    const digitsOnly = normalized.replace(/[^0-9.]/g, '');
    const numericFee = parseFloat(digitsOnly) || 0;

    return { currency, numericFee };
  };

  useEffect(() => {
    async function initPage() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);
        }

        const metaRes = await fetch('/api/branches');
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setBranches(metaData.branches);
        }

        const forexRes = await fetch('/api/forex');
        if (forexRes.ok) {
          const forexData = await forexRes.json();
          setForexRates(forexData.rates);
        }

        const uniRes = await fetch('/api/admin/universities');
        if (uniRes.ok) {
          const uniData = await uniRes.json();
          if (uniData.success) {
            setUniversities(uniData.universities);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    initPage();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (branchFilter) params.append('branchId', branchFilter);
      
      const res = await fetch(`/api/finance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.commissions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter, branchFilter]);

  // Aggregate stats
  const totalNpr = commissions.reduce((sum, c) => sum + c.commissionAmountNpr, 0);
  const totalHqNpr = commissions.reduce((sum, c) => sum + c.hqAmountNpr, 0);
  const totalAgentNpr = commissions.reduce((sum, c) => sum + c.subAgentAmountNpr, 0);
  const totalBranchNpr = commissions.reduce((sum, c) => sum + (c.branchAmountNpr || 0), 0);
  const pendingCount = commissions.filter(c => c.status === 'PENDING').length;
  const receivedCount = commissions.filter(c => c.status === 'RECEIVED').length;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
      </div>
    );
  }

  if (currentUser.role !== 'DIRECTOR' && currentUser.role !== 'FINANCE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans">Access Denied</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm font-sans leading-relaxed">
            This section contains restricted financial transactions and is only accessible by Finance Officers and Directors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">Commissions & Revenue</h1>
          <p className="text-xs text-slate-400 mt-1">
            Placements bookkeeping ledger, sub-agent commission splits, and exchange snapshots.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* Small Exchange Rates Info panel */}
          {forexRates && (
            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-[10px] shadow-sm select-none shrink-0">
              <span className="font-bold text-slate-500 uppercase tracking-wider">NRB Exchange Rate:</span>
              <div className="flex items-center space-x-3 font-mono">
                <span className="text-slate-350"><span className="text-indigo-400 font-semibold">USD</span> Rs. {forexRates.USD?.toFixed(2)}</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-350"><span className="text-indigo-400 font-semibold">AUD</span> Rs. {forexRates.AUD?.toFixed(2)}</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-350"><span className="text-indigo-400 font-semibold">CAD</span> Rs. {forexRates.CAD?.toFixed(2)}</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-350"><span className="text-indigo-400 font-semibold">GBP</span> Rs. {forexRates.GBP?.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              if (forexRates && forexRates.USD) {
                setAddForm(prev => ({
                  ...prev,
                  nprExchangeRate: String(forexRates.USD.toFixed(2))
                }));
              }
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-md transition-all cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Commission</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Placed */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Booked Commissions</span>
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-100 font-mono">Rs. {totalNpr.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-500 block mt-1">Equivalent across AUD / CAD / USD / GBP placements</span>
          </div>
        </div>

        {/* Card 2: HQ Net */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net HQ Revenue</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-emerald-600 font-mono">Rs. {totalHqNpr.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-500 block mt-1">HQ share after sub-agent & branch office splits</span>
          </div>
        </div>

        {/* Card 3: Branch Share */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Branch Share Contribution</span>
            <MapPin className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-sky-500 font-mono">Rs. {totalBranchNpr.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-500 block mt-1">Total revenue split earned by branches</span>
          </div>
        </div>

        {/* Card 4: Agent Splits */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sub-Agent Splits Payout</span>
            <ArrowUpRight className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-amber-600 font-mono">Rs. {totalAgentNpr.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-500 block mt-1">Owed or paid to regional sub-agents</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Receivable (Pending)</option>
            <option value="RECEIVED">Received (From University)</option>
            <option value="PAID_TO_SUBAGENT">Fully Settled (Disbursed)</option>
          </select>

          {/* Branch Filter */}
          {currentUser?.role === 'DIRECTOR' || currentUser?.role === 'FINANCE' ? (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          ) : currentUser?.branchName ? (
            <div className="px-3.5 py-2 bg-slate-950 border border-slate-800/40 rounded-xl text-slate-500 text-xs">
              Branch: {currentUser.branchName}
            </div>
          ) : null}
        </div>
      </div>

      {/* Table Ledger */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs">Loading ledger sheets...</span>
          </div>
        ) : commissions.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p className="text-sm font-semibold">No commission records found</p>
            <p className="text-xs text-slate-600 mt-1">Placements in higher pipeline stages (Offer/Visa) will display here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Placed Applicant</th>
                  <th className="px-6 py-4">Partner University</th>
                  <th className="px-6 py-4">University Commission Amount</th>
                  <th className="px-6 py-4">NPR Exchange Rate</th>
                  <th className="px-6 py-4">Total NPR Equivalent</th>
                  {currentUser?.role !== 'SUB_AGENT' && <th className="px-6 py-4">Agent split (NPR)</th>}
                  {currentUser?.role !== 'SUB_AGENT' && <th className="px-6 py-4">Branch split (NPR)</th>}
                  <th className="px-6 py-4">HQ Net (NPR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {commissions.map((comm) => {
                  return (
                    <tr key={comm.id} className="hover:bg-slate-850/50 transition-all">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        <Link href={`/dashboard/applicants/${comm.applicant.id}`} className="hover:text-indigo-600 hover:underline">
                          {comm.applicant.name}
                        </Link>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Branch: {comm.applicant.branch?.name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">{comm.partnerUniversity}</td>
                      <td className="px-6 py-4 font-mono">{comm.currency} {comm.commissionAmountForeign.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-indigo-600">@ {comm.nprExchangeRate.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">Rs. {comm.commissionAmountNpr.toLocaleString()}</td>
                      {currentUser?.role !== 'SUB_AGENT' && (
                         <td className="px-6 py-4 font-mono text-amber-600">
                           {comm.subAgentAmountNpr > 0 ? (
                             <div className="space-y-1">
                               <div>Rs. {comm.subAgentAmountNpr.toLocaleString()}</div>
                               <span className={`inline-block text-[8px] leading-none px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                 comm.status === 'PAID_TO_SUBAGENT'
                                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                   : 'bg-amber-50 text-amber-600 border border-amber-100/50'
                               }`}>
                                 {comm.status === 'PAID_TO_SUBAGENT' ? '✓ Disbursed' : '⋯ Pending'}
                               </span>
                             </div>
                           ) : '-'}
                         </td>
                       )}
                       {currentUser?.role !== 'SUB_AGENT' && (
                         <td className="px-6 py-4 font-mono text-sky-650">
                           {comm.branchAmountNpr > 0 ? (
                             <div className="space-y-1">
                               <div>Rs. {comm.branchAmountNpr.toLocaleString()}</div>
                               <span className={`inline-block text-[8px] leading-none px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                 comm.status !== 'PENDING'
                                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                   : 'bg-sky-50 text-sky-600 border border-sky-100/50'
                               }`}>
                                 {comm.status !== 'PENDING' ? '✓ Credited' : '⋯ Pending'}
                               </span>
                             </div>
                           ) : '-'}
                         </td>
                       )}
                      <td className="px-6 py-4 font-mono text-emerald-600">Rs. {comm.hqAmountNpr.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          comm.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : comm.status === 'PAID_TO_SUBAGENT'
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                        }`}>
                           {comm.status === 'RECEIVED'
                             ? 'Received (From University)'
                             : comm.status === 'PAID_TO_SUBAGENT'
                             ? 'Fully Settled (Disbursed)'
                             : 'Receivable (Pending)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <button
                            onClick={() => {
                              setSelectedCommission({ ...comm, applicantName: comm.applicant.name, branchName: comm.applicant.branch?.name });
                              setInvoiceMode('UNIVERSITY');
                            }}
                            className="p-1 rounded bg-slate-850 hover:bg-indigo-50 text-indigo-600 border border-slate-800 cursor-pointer"
                            title="Generate printable invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const totalNpr = comm.commissionAmountNpr;
                              
                              let agentPct = 0;
                              if (totalNpr > 0) {
                                agentPct = (comm.subAgentAmountNpr / totalNpr) * 100;
                              }
                              
                              let branchPct = 0;
                              if (totalNpr > 0) {
                                branchPct = (comm.branchAmountNpr / totalNpr) * 100;
                              }

                              setCommissionToEdit(comm);
                              setEditForm({
                                partnerUniversity: comm.partnerUniversity,
                                currency: comm.currency,
                                commissionAmountForeign: String(comm.commissionAmountForeign),
                                nprExchangeRate: String(comm.nprExchangeRate),
                                status: comm.status,
                                agentSplitPercent: agentPct > 0 ? agentPct.toFixed(1) : '0',
                                subAgentAmountNpr: String(comm.subAgentAmountNpr),
                                branchSplitPercent: branchPct > 0 ? branchPct.toFixed(1) : '0',
                                branchAmountNpr: String(comm.branchAmountNpr),
                              });
                              setEditModalOpen(true);
                            }}
                            className="p-1 rounded bg-slate-850 hover:bg-indigo-50 text-amber-600 border border-slate-800 cursor-pointer"
                            title="Edit Commission ledger entry"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCommission(comm.id)}
                            className="p-1 rounded bg-slate-850 hover:bg-indigo-50 text-rose-500 border border-slate-800 cursor-pointer"
                            title="Delete Commission ledger entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {selectedCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
          <div className="w-full max-w-2xl bg-white text-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:shadow-none print:rounded-none print:w-full print:max-h-none print:h-full">
            
            {/* Modal Control Header (Hidden in Print) */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold text-slate-500 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-1 text-indigo-600" />
                {invoiceMode === 'UNIVERSITY'
                  ? 'Commission Statement Invoice'
                  : invoiceMode === 'AGENT'
                  ? 'Agent Disbursement Statement'
                  : 'Branch Disbursement Statement'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCommission(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice Mode Switcher (Hidden in Print) */}
            {(selectedCommission.subAgentAmountNpr > 0 || selectedCommission.branchAmountNpr > 0) && (
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2 print:hidden text-xs">
                <span className="text-slate-400 font-medium">Invoice Mode:</span>
                <button
                  type="button"
                  onClick={() => setInvoiceMode('UNIVERSITY')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    invoiceMode === 'UNIVERSITY'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  University Commission
                </button>
                {selectedCommission.subAgentAmountNpr > 0 && (
                  <button
                    type="button"
                    onClick={() => setInvoiceMode('AGENT')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      invoiceMode === 'AGENT'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Agent Disbursement Invoice
                  </button>
                )}
                {selectedCommission.branchAmountNpr > 0 && (
                  <button
                    type="button"
                    onClick={() => setInvoiceMode('BRANCH')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      invoiceMode === 'BRANCH'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Branch Disbursement Invoice
                  </button>
                )}
              </div>
            )}

            {/* Invoice Sheet */}
            <div className="p-8 space-y-8 overflow-y-auto print:overflow-visible flex-1 print:p-0">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Thinkcone Study Abroad</h2>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Kathmandu HQ, Putalisadak, Nepal<br/>
                    Email: finance@thinkcone.com.np | Tel: +977-1-44XXXXX
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-[9px] uppercase tracking-wider rounded">
                    {invoiceMode === 'UNIVERSITY'
                      ? 'Invoice Statement'
                      : 'Disbursement Payout Statement'}
                  </span>
                  <div className="text-xs text-slate-400 mt-2 font-mono">Invoice #: {selectedCommission.invoiceNumber || 'STATEMENT-' + selectedCommission.id.slice(0, 8).toUpperCase()}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Date: {new Date(selectedCommission.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Placed Applicant Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                {invoiceMode === 'UNIVERSITY' ? (
                  <>
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block">Bill For</span>
                      <span className="font-bold text-slate-800 text-sm block mt-1">{selectedCommission.partnerUniversity}</span>
                      <span className="text-slate-500 mt-0.5 block">International Admissions Commission</span>
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block">Candidate Details</span>
                      <span className="font-bold text-slate-800 text-sm block mt-1">{selectedCommission.applicantName}</span>
                      <span className="text-slate-500 mt-0.5 block">Branch office: {selectedCommission.branchName}</span>
                    </div>
                  </>
                ) : invoiceMode === 'AGENT' ? (
                  <>
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block">Disburse Payout To</span>
                      <span className="font-bold text-slate-800 text-sm block mt-1">{selectedCommission.applicant?.subAgent?.name || 'Sub-Agent Partner'}</span>
                      <span className="text-slate-500 mt-0.5 block">Email: {selectedCommission.applicant?.subAgent?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block">Candidate & Course</span>
                      <span className="font-bold text-slate-800 text-sm block mt-1">{selectedCommission.applicantName}</span>
                      <span className="text-slate-500 mt-0.5 block">{selectedCommission.partnerUniversity} Placement</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block">Disburse Payout To Branch</span>
                      <span className="font-bold text-slate-800 text-sm block mt-1">{selectedCommission.branchName || 'Local Branch Office'}</span>
                      <span className="text-slate-500 mt-0.5 block">
                        Email: {selectedCommission.branchName 
                          ? `manager.${selectedCommission.branchName.toLowerCase().replace(/[^a-z0-9]/g, '')}@thinkcone.com.np`
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block">Candidate & Course</span>
                      <span className="font-bold text-slate-800 text-sm block mt-1">{selectedCommission.applicantName}</span>
                      <span className="text-slate-500 mt-0.5 block">{selectedCommission.partnerUniversity} Placement</span>
                    </div>
                  </>
                )}
              </div>

              {/* Particulars Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-[10px] uppercase">
                      <th className="px-4 py-3">Description</th>
                      {invoiceMode === 'UNIVERSITY' ? (
                        <>
                          <th className="px-4 py-3">Commission Rate</th>
                          <th className="px-4 py-3">Exchange Rate</th>
                        </>
                      ) : (
                        <th className="px-4 py-3">Full Placed Commission</th>
                      )}
                      <th className="px-4 py-3 text-right">Total Amount (NPR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800">
                          {invoiceMode === 'UNIVERSITY'
                            ? 'Recruitment Service Commission Charge'
                            : invoiceMode === 'AGENT'
                            ? 'Sub-Agent Recruitment Split Payout'
                            : 'Branch Office Recruitment Split Payout'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {invoiceMode === 'UNIVERSITY'
                            ? 'Placed student in target academic course at university partner.'
                            : `Disbursement split payout for placed candidate ${selectedCommission.applicantName}.`}
                        </span>
                      </td>
                      {invoiceMode === 'UNIVERSITY' ? (
                        <>
                          <td className="px-4 py-4">{selectedCommission.currency} {selectedCommission.commissionAmountForeign.toLocaleString()}</td>
                          <td className="px-4 py-4 font-mono">1 {selectedCommission.currency} = Rs. {selectedCommission.nprExchangeRate.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right font-mono font-semibold">Rs. {selectedCommission.commissionAmountNpr.toLocaleString()}</td>
                        </>
                      ) : invoiceMode === 'AGENT' ? (
                        <>
                          <td className="px-4 py-4">Rs. {selectedCommission.commissionAmountNpr.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-mono font-semibold">Rs. {selectedCommission.subAgentAmountNpr.toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">Rs. {selectedCommission.commissionAmountNpr.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-mono font-semibold">Rs. {selectedCommission.branchAmountNpr.toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations ledger */}
              <div className="w-full flex justify-end">
                <div className="w-72 space-y-2 text-xs border-t border-slate-100 pt-4">
                  {invoiceMode === 'UNIVERSITY' ? (
                    <div className="flex justify-between font-bold text-sm text-slate-900 pt-2">
                      <span>Total NPR Equivalent:</span>
                      <span className="font-mono">Rs. {selectedCommission.commissionAmountNpr.toLocaleString()}</span>
                    </div>
                  ) : invoiceMode === 'AGENT' ? (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Total Placed Commission:</span>
                        <span className="font-mono">Rs. {selectedCommission.commissionAmountNpr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-amber-600 border-t border-slate-200 pt-2">
                        <span>Total Agent Split:</span>
                        <span className="font-mono">Rs. {selectedCommission.subAgentAmountNpr.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Total Placed Commission:</span>
                        <span className="font-mono">Rs. {selectedCommission.commissionAmountNpr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-sky-650 border-t border-slate-200 pt-2">
                        <span>Total Branch Split:</span>
                        <span className="font-mono">Rs. {selectedCommission.branchAmountNpr.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-8 text-[10px] text-slate-400 text-center space-y-1">
                <p>This statement is auto-generated by Thinkcone CRM and snapshots exchange rates at creation date to avoid margin distortion.</p>
                <p>Thank you for your partnership with Thinkcone Study Abroad.</p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-350">Edit Placed Commission</span>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setCommissionToEdit(null);
                }}
                className="text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-indigo-400 font-medium mb-1 font-mono">Autofill from Represented Program (Optional)</label>
                <select
                  onChange={(e) => {
                    const uniId = e.target.value;
                    if (!uniId) return;
                    const chosen = universities.find(u => u.id === uniId);
                    if (chosen) {
                      const { currency, numericFee } = parseFeeAndCurrency(chosen.tuitionFee);
                      let computedComm = '';
                      if (chosen.commissionPercentage && numericFee > 0) {
                        computedComm = ((numericFee * chosen.commissionPercentage) / 100).toFixed(2);
                      }
                      
                      const rate = forexRates && forexRates[currency] ? String(forexRates[currency].toFixed(2)) : '';

                      setEditForm(prev => ({
                        ...prev,
                        partnerUniversity: chosen.name,
                        currency,
                        commissionAmountForeign: computedComm,
                        nprExchangeRate: rate,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none text-xs font-mono"
                >
                  <option value="">-- Select Represented Program --</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} - {uni.course} ({uni.country}) {uni.commissionPercentage ? `[${uni.commissionPercentage}% Comm]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Partner University / Institution *</label>
                <input
                  type="text"
                  required
                  value={editForm.partnerUniversity}
                  onChange={(e) => setEditForm(prev => ({ ...prev, partnerUniversity: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Currency *</label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none"
                  >
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none"
                  >
                    <option value="PENDING">Receivable (Pending)</option>
                    <option value="RECEIVED">Received (From University)</option>
                    <option value="PAID_TO_SUBAGENT">Fully Settled (Disbursed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">University Commission Amount *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.commissionAmountForeign}
                    onChange={(e) => setEditForm(prev => ({ ...prev, commissionAmountForeign: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">NPR Exchange Rate *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.1"
                    value={editForm.nprExchangeRate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nprExchangeRate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Agent Split (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 20"
                    value={editForm.agentSplitPercent}
                    onChange={(e) => setEditForm(prev => ({ ...prev, agentSplitPercent: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Agent Split (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-calculated"
                    value={editForm.subAgentAmountNpr}
                    onChange={(e) => handleAgentNprChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Branch Split (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 40"
                    value={editForm.branchSplitPercent}
                    onChange={(e) => setEditForm(prev => ({ ...prev, branchSplitPercent: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Branch Split (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-calculated"
                    value={editForm.branchAmountNpr}
                    onChange={(e) => handleBranchNprChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setCommissionToEdit(null);
                  }}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Commission Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-350">Add Placed Commission Ledger Entry</span>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                }}
                className="text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Placed Applicant *</label>
                <select
                  required
                  value={addForm.applicantId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const applicant = applicants.find(a => a.id === selectedId);
                    
                    let agentPct = '0';
                    let branchPct = '0';
                    if (applicant) {
                      agentPct = applicant.subAgentCommissionSplit !== null
                        ? String((applicant.subAgentCommissionSplit * 100).toFixed(1))
                        : applicant.subAgent?.subAgentCommissionSplit !== null && applicant.subAgent?.subAgentCommissionSplit !== undefined
                        ? String((applicant.subAgent.subAgentCommissionSplit * 100).toFixed(1))
                        : '0';

                      branchPct = applicant.branchCommissionSplit !== null
                        ? String((applicant.branchCommissionSplit * 100).toFixed(1))
                        : applicant.branch?.branchCommissionSplit !== null && applicant.branch?.branchCommissionSplit !== undefined
                        ? String((applicant.branch.branchCommissionSplit * 100).toFixed(1))
                        : '0';
                    }

                    setAddForm(prev => ({
                      ...prev,
                      applicantId: selectedId,
                      partnerUniversity: applicant?.targetUniversity || '',
                      agentSplitPercent: agentPct,
                      branchSplitPercent: branchPct,
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none"
                >
                  <option value="">Select Applicant...</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.branch?.name || 'No Branch'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-indigo-400 font-medium mb-1 font-mono">Autofill from Represented Program (Optional)</label>
                <select
                  onChange={(e) => {
                    const uniId = e.target.value;
                    if (!uniId) return;
                    const chosen = universities.find(u => u.id === uniId);
                    if (chosen) {
                      const { currency, numericFee } = parseFeeAndCurrency(chosen.tuitionFee);
                      let computedComm = '';
                      if (chosen.commissionPercentage && numericFee > 0) {
                        computedComm = ((numericFee * chosen.commissionPercentage) / 100).toFixed(2);
                      }
                      
                      const rate = forexRates && forexRates[currency] ? String(forexRates[currency].toFixed(2)) : '';

                      setAddForm(prev => ({
                        ...prev,
                        partnerUniversity: chosen.name,
                        currency,
                        commissionAmountForeign: computedComm,
                        nprExchangeRate: rate,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none text-xs font-mono"
                >
                  <option value="">-- Select Represented Program --</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} - {uni.course} ({uni.country}) {uni.commissionPercentage ? `[${uni.commissionPercentage}% Comm]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1 font-sans">Partner University / Institution *</label>
                <input
                  type="text"
                  required
                  value={addForm.partnerUniversity}
                  onChange={(e) => setAddForm(prev => ({ ...prev, partnerUniversity: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Currency *</label>
                  <select
                    value={addForm.currency}
                    onChange={(e) => handleAddCurrencyChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none"
                  >
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Status *</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none"
                  >
                    <option value="PENDING">Receivable (Pending)</option>
                    <option value="RECEIVED">Received (From University)</option>
                    <option value="PAID_TO_SUBAGENT">Fully Settled (Disbursed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">University Commission Amount *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={addForm.commissionAmountForeign}
                    onChange={(e) => setAddForm(prev => ({ ...prev, commissionAmountForeign: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">NPR Exchange Rate *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.1"
                    value={addForm.nprExchangeRate}
                    onChange={(e) => setAddForm(prev => ({ ...prev, nprExchangeRate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Agent Split (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 20"
                    value={addForm.agentSplitPercent}
                    onChange={(e) => setAddForm(prev => ({ ...prev, agentSplitPercent: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Agent Split (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-calculated"
                    value={addForm.subAgentAmountNpr}
                    onChange={(e) => handleAddAgentNprChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Branch Split (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 40"
                    value={addForm.branchSplitPercent}
                    onChange={(e) => setAddForm(prev => ({ ...prev, branchSplitPercent: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">Branch Split (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Auto-calculated"
                    value={addForm.branchAmountNpr}
                    onChange={(e) => handleAddBranchNprChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                  }}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdd}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingAdd ? 'Creating...' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
