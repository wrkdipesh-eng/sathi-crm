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
  Plus,
  GraduationCap,
  FileCheck
} from 'lucide-react';

export default function FinanceLedgerPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [financeTab, setFinanceTab] = useState<'ALL' | 'RECEIVABLES' | 'PAYABLES'>('ALL');
  
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

  // Bank Remittance States
  const [bankDetails, setBankDetails] = useState({
    accountName: 'Thinkcone Study Abroad Pvt. Ltd.',
    bankName: 'Standard Chartered Bank Nepal',
    accountNo: '01-2384912-01 (NPR / Foreign Wire)',
    swiftCode: 'SCBLNPKT',
    branch: 'Putalisadak Branch, Kathmandu, Nepal',
  });

  const [companyDetails, setCompanyDetails] = useState({
    name: 'Thinkcone Study Abroad',
    address: 'Putalisadak, Kathmandu, Nepal',
    panNo: '609823412',
    email: 'finance@thinkcone.com.np',
    phone: '+977-1-44XXXXX',
  });

  useEffect(() => {
    const savedBank = localStorage.getItem('finance_bank_details');
    if (savedBank) {
      try {
        setBankDetails(JSON.parse(savedBank));
      } catch (e) {
        console.error("Failed to parse saved bank details", e);
      }
    }
    const savedCompany = localStorage.getItem('finance_company_details');
    if (savedCompany) {
      try {
        setCompanyDetails(JSON.parse(savedCompany));
      } catch (e) {
        console.error("Failed to parse saved company details", e);
      }
    }
  }, []);

  // Bulk Invoice States
  const [selectedUni, setSelectedUni] = useState('');
  const [intakeFilter, setIntakeFilter] = useState('');
  const [modalSelectedCommIds, setModalSelectedCommIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isGeneratedInvoiceOpen, setIsGeneratedInvoiceOpen] = useState(false);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);
  const [bulkInvoiceForm, setBulkInvoiceForm] = useState({
    invoiceNumber: '',
    nprExchangeRate: '133.0',
    status: 'PENDING',
    baseCommType: 'PERCENT' as 'PERCENT' | 'FLAT',
    baseCommValue: '10',
    bonusType: 'NONE' as 'PERCENT' | 'FLAT' | 'NONE',
    bonusValue: '',
  });
  const [bulkCalculations, setBulkCalculations] = useState<any[]>([]);
  const [bulkSaveLoading, setBulkSaveLoading] = useState(false);
  const [bulkSlabs, setBulkSlabs] = useState<any[]>([]);
  const [isUpdatingSlabs, setIsUpdatingSlabs] = useState(false);
  const [slabSuccessMsg, setSlabSuccessMsg] = useState<string | null>(null);

  const handleBankDetailsChange = (field: string, value: string) => {
    setBankDetails(prev => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem('finance_bank_details', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCompanyDetailsChange = (field: string, value: string) => {
    setCompanyDetails(prev => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem('finance_company_details', JSON.stringify(updated));
      return updated;
    });
  };

  // University Management States
  const [isUniModalOpen, setIsUniModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<any>(null);
  const [isSavingUni, setIsSavingUni] = useState(false);
  const [uniError, setUniError] = useState<string | null>(null);
  const [uniForm, setUniForm] = useState({
    name: '',
    country: '',
    course: '',
    tuitionFee: '',
    intakes: '',
    commissionPercentage: '',
    type: 'DIRECT',
    portalName: '',
    baseCommissionType: 'PERCENT',
    baseCommissionValue: '',
    bonusType: 'NONE',
    bonusValue: '',
    slabs: [] as any[],
  });

  const handleOpenBulkInvoiceModal = () => {
    setSelectedUni('');
    setIntakeFilter('');
    setModalSelectedCommIds([]);
    setBulkSlabs([]);
    setSlabSuccessMsg(null);
    setBulkInvoiceForm({
      invoiceNumber: '',
      nprExchangeRate: '133.0',
      status: 'PENDING',
      baseCommType: 'PERCENT',
      baseCommValue: '10',
      bonusType: 'NONE',
      bonusValue: '',
    });
    setBulkCalculations([]);
    setIsBulkModalOpen(true);
  };

  const handleUniChange = (uniName: string) => {
    setSelectedUni(uniName);
    setIntakeFilter('');
    const matchingComms = commissions.filter(c => 
      c.partnerUniversity === uniName && 
      c.status === 'PENDING'
    );
    const ids = matchingComms.map(c => c.id);
    setModalSelectedCommIds(ids);

    const cleanUniName = uniName.replace(/\s+\[(Direct|Portal:.*)\]$/, '').trim();
    const partnerUniRecord = universities.find(u => u.name.toLowerCase() === cleanUniName.toLowerCase());
    const slabsList = Array.isArray(partnerUniRecord?.slabs) ? partnerUniRecord.slabs : [];
    setBulkSlabs(slabsList);

    const firstComm = matchingComms[0];
    const defaultRate = firstComm?.nprExchangeRate ? String(firstComm.nprExchangeRate) : '133.0';
    const dateStr = new Date().toISOString().split('T')[0];
    const baseUniName = uniName.replace(/\s+\[(Direct|Portal:.*)\]$/, '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const defaultInvoiceNum = `BULK-${baseUniName}-${dateStr}`;

    let baseType: 'PERCENT' | 'FLAT' = partnerUniRecord?.baseCommissionType || 'PERCENT';
    let baseVal = partnerUniRecord?.baseCommissionValue !== null && partnerUniRecord?.baseCommissionValue !== undefined
      ? String(partnerUniRecord.baseCommissionValue)
      : (partnerUniRecord?.commissionPercentage ? String(partnerUniRecord.commissionPercentage) : '10');

    let bonusType: 'NONE' | 'PERCENT' | 'FLAT' = partnerUniRecord?.bonusType || 'NONE';
    let bonusVal = partnerUniRecord?.bonusValue ? String(partnerUniRecord.bonusValue) : '';

    const initialCount = matchingComms.length;
    const activeSlab = slabsList.find((slab: any) => {
      const min = parseInt(slab.minStudents) || 0;
      const max = slab.maxStudents ? parseInt(slab.maxStudents) : Infinity;
      return initialCount >= min && initialCount <= max;
    });

    if (activeSlab) {
      baseType = activeSlab.commissionType;
      baseVal = String(activeSlab.commissionValue || 0);
    }

    setBulkInvoiceForm(prev => ({
      ...prev,
      invoiceNumber: defaultInvoiceNum,
      nprExchangeRate: defaultRate,
      baseCommType: baseType,
      baseCommValue: baseVal,
      bonusType: bonusType,
      bonusValue: bonusVal,
    }));
  };

  const addBulkSlabRow = () => {
    setBulkSlabs(prev => {
      const nextMin = prev.length === 0 
        ? 1 
        : (parseInt(prev[prev.length - 1].maxStudents) || 1) + 1;
      return [
        ...prev,
        { minStudents: nextMin, maxStudents: '', commissionType: 'PERCENT', commissionValue: '', bonusType: 'NONE', bonusValue: '', bonusCalcMode: 'PER_STUDENT' }
      ];
    });
  };

  const updateBulkSlabRow = (index: number, field: string, value: any) => {
    setBulkSlabs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeBulkSlabRow = (index: number) => {
    setBulkSlabs(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveBulkSlabsToUniversity = async () => {
    if (!selectedUni) return;
    const cleanUniName = selectedUni.replace(/\s+\[(Direct|Portal:.*)\]$/, '').trim();
    const partnerUniRecord = universities.find(u => u.name.toLowerCase() === cleanUniName.toLowerCase());
    if (!partnerUniRecord) return;

    setIsUpdatingSlabs(true);
    setSlabSuccessMsg(null);

    const formattedSlabs = bulkSlabs.map((slab: any) => ({
      minStudents: parseInt(slab.minStudents) || 1,
      maxStudents: slab.maxStudents ? parseInt(slab.maxStudents) : null,
      commissionType: slab.commissionType,
      commissionValue: parseFloat(slab.commissionValue) || 0,
      bonusType: slab.bonusType || 'NONE',
      bonusValue: slab.bonusValue ? parseFloat(slab.bonusValue) : 0,
      bonusCalcMode: slab.bonusCalcMode || 'PER_STUDENT',
    }));

    try {
      const res = await fetch(`/api/admin/universities/${partnerUniRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slabs: formattedSlabs }),
      });

      if (res.ok) {
        setSlabSuccessMsg("University slabs updated successfully!");
        fetchUniversities();
        setTimeout(() => setSlabSuccessMsg(null), 3000);
      } else {
        alert("Failed to update university slabs");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving slabs to university.");
    } finally {
      setIsUpdatingSlabs(false);
    }
  };

  useEffect(() => {
    if (!isBulkModalOpen || !selectedUni) {
      setBulkCalculations([]);
      return;
    }

    let matchingComms = commissions.filter(c => 
      c.partnerUniversity === selectedUni && 
      c.status === 'PENDING'
    );

    if (intakeFilter) {
      matchingComms = matchingComms.filter(c => {
        const d = new Date(c.createdAt);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        let name = '';
        if (m >= 1 && m <= 3) name = `Jan/Feb ${y} Intake`;
        else if (m >= 4 && m <= 6) name = `May/June ${y} Intake`;
        else if (m >= 7 && m <= 9) name = `July/Aug ${y} Intake`;
        else name = `Sept/Oct ${y} Intake`;
        return name === intakeFilter;
      });
    }

    const activeComms = matchingComms.filter(c => modalSelectedCommIds.includes(c.id));
    const count = activeComms.length;

    const cleanSelectedUniName = selectedUni.replace(/\s+\[(Direct|Portal:.*)\]$/, '').trim();
    const partnerUniRecord = universities.find(u => u.name.toLowerCase() === cleanSelectedUniName.toLowerCase());
    const slabsList = bulkSlabs;
    
    // Find active slab based on count
    const activeSlab = slabsList.find(slab => {
      const min = parseInt(slab.minStudents) || 0;
      const max = slab.maxStudents ? parseInt(slab.maxStudents) : Infinity;
      return count >= min && count <= max;
    });

    let baseType = bulkInvoiceForm.baseCommType || 'PERCENT';
    let baseValue = parseFloat(bulkInvoiceForm.baseCommValue) || 0;
    let bonusType = bulkInvoiceForm.bonusType || 'NONE';
    let bonusValue = parseFloat(bulkInvoiceForm.bonusValue) || 0;

    if (activeSlab) {
      baseType = activeSlab.commissionType;
      baseValue = parseFloat(activeSlab.commissionValue) || 0;
      if (activeSlab.bonusType) {
        bonusType = activeSlab.bonusType;
        bonusValue = parseFloat(activeSlab.bonusValue) || 0;
      }
    }
    const exchangeRate = parseFloat(bulkInvoiceForm.nprExchangeRate) || 133.0;

    const calcs = activeComms.map((comm) => {
      const matchedProg = universities.find(
        (u) =>
          u.name.toLowerCase() === cleanSelectedUniName.toLowerCase() &&
          (!comm.applicant.targetCourse || u.course.toLowerCase() === comm.applicant.targetCourse.toLowerCase())
      );

      const feeStr = matchedProg?.tuitionFee || partnerUniRecord?.tuitionFee || '25000';
      const { numericFee } = parseFeeAndCurrency(feeStr);
      
      let baseCommForeign = 0;
      if (baseType === 'PERCENT') {
        baseCommForeign = numericFee * (baseValue / 100);
      } else {
        baseCommForeign = baseValue;
      }

      let bonusCommForeign = 0;
      const bonusMode = activeSlab?.bonusCalcMode || 'PER_STUDENT';
      if (bonusType === 'PERCENT') {
        bonusCommForeign = numericFee * (bonusValue / 100);
      } else if (bonusType === 'FLAT') {
        if (bonusMode === 'TOTAL_BATCH') {
          bonusCommForeign = count > 0 ? (bonusValue / count) : 0;
        } else {
          bonusCommForeign = bonusValue;
        }
      }

      const totalForeign = baseCommForeign + bonusCommForeign;
      const totalNpr = totalForeign * exchangeRate;

      let subAgentNpr = 0;
      if (comm.applicant?.subAgent?.id) {
        const splitValue = comm.applicant.subAgentCommissionSplit !== null
          ? comm.applicant.subAgentCommissionSplit
          : (comm.applicant.subAgent.subAgentCommissionSplit || 0);

        if (splitValue > 0) {
          if (splitValue < 1) {
            subAgentNpr = totalNpr * splitValue;
          } else {
            subAgentNpr = Math.min(splitValue, totalNpr);
          }
        }
      }

      let branchNpr = 0;
      const branchRecord = branches.find(b => b.id === comm.applicant.branch?.id);
      const branchSplitValue = comm.applicant.branchCommissionSplit !== null
        ? comm.applicant.branchCommissionSplit
        : (branchRecord?.branchCommissionSplit || 0);

      if (branchSplitValue > 0) {
        if (branchSplitValue < 1) {
          branchNpr = totalNpr * branchSplitValue;
        } else {
          branchNpr = Math.min(branchSplitValue, totalNpr);
        }
      }

      const hqNpr = Math.max(0, totalNpr - subAgentNpr - branchNpr);

      return {
        id: comm.id,
        applicantName: comm.applicant.name,
        course: comm.applicant.targetCourse || 'N/A',
        university: comm.partnerUniversity,
        currency: comm.currency,
        tuitionFee: numericFee,
        baseCommForeign,
        bonusCommForeign,
        commissionAmountForeign: totalForeign,
        commissionAmountNpr: totalNpr,
        subAgentAmountNpr: subAgentNpr,
        branchAmountNpr: branchNpr,
        hqAmountNpr: hqNpr
      };
    });

    setBulkCalculations(calcs);
  }, [bulkInvoiceForm, isBulkModalOpen, selectedUni, intakeFilter, modalSelectedCommIds, commissions, universities, branches, bulkSlabs]);

  const handleSaveBulkInvoice = async () => {
    if (!bulkInvoiceForm.invoiceNumber) {
      alert('Please enter an invoice number');
      return;
    }
    setBulkSaveLoading(true);
    try {
      if (selectedUni) {
        const cleanUniName = selectedUni.replace(/\s+\[(Direct|Portal:.*)\]$/, '').trim();
        const partnerUniRecord = universities.find(u => u.name.toLowerCase() === cleanUniName.toLowerCase());
        if (partnerUniRecord) {
          const formattedSlabs = bulkSlabs.map((slab: any) => ({
            minStudents: parseInt(slab.minStudents) || 1,
            maxStudents: slab.maxStudents ? parseInt(slab.maxStudents) : null,
            commissionType: slab.commissionType,
            commissionValue: parseFloat(slab.commissionValue) || 0,
            bonusType: slab.bonusType || 'NONE',
            bonusValue: slab.bonusValue ? parseFloat(slab.bonusValue) : 0,
            bonusCalcMode: slab.bonusCalcMode || 'PER_STUDENT',
          }));
          await fetch(`/api/admin/universities/${partnerUniRecord.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slabs: formattedSlabs }),
          });
        }
      }

      const res = await fetch('/api/finance/bulk-invoice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: bulkInvoiceForm.invoiceNumber,
          status: bulkInvoiceForm.status,
          updates: bulkCalculations.map((c) => ({
            id: c.id,
            commissionAmountForeign: c.commissionAmountForeign,
            commissionAmountNpr: c.commissionAmountNpr,
            subAgentAmountNpr: c.subAgentAmountNpr,
            branchAmountNpr: c.branchAmountNpr,
            hqAmountNpr: c.hqAmountNpr,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedInvoiceData({
          selectedUni,
          intakeFilter,
          bulkInvoiceForm: { ...bulkInvoiceForm },
          bulkCalculations: [...bulkCalculations],
          bulkSlabs: [...bulkSlabs],
          bankDetails: { ...bankDetails },
          companyDetails: { ...companyDetails },
        });
        setIsBulkModalOpen(false);
        setIsGeneratedInvoiceOpen(true);
        setModalSelectedCommIds([]);
        fetchUniversities();
        fetchCommissions();
      } else {
        alert(data.error || 'Failed to generate bulk invoice.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setBulkSaveLoading(false);
    }
  };

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

  const fetchUniversities = async () => {
    try {
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
  };

  const addSlabRow = () => {
    setUniForm(prev => {
      const nextMin = prev.slabs.length === 0 
        ? 1 
        : (parseInt(prev.slabs[prev.slabs.length - 1].maxStudents) || 1) + 1;
      return {
        ...prev,
        slabs: [
          ...prev.slabs,
          { minStudents: nextMin, maxStudents: '', commissionType: 'PERCENT', commissionValue: '' }
        ]
      };
    });
  };

  const updateSlabRow = (index: number, field: string, value: any) => {
    setUniForm(prev => {
      const updatedSlabs = [...prev.slabs];
      updatedSlabs[index] = { ...updatedSlabs[index], [field]: value };
      return { ...prev, slabs: updatedSlabs };
    });
  };

  const removeSlabRow = (index: number) => {
    setUniForm(prev => ({
      ...prev,
      slabs: prev.slabs.filter((_, idx) => idx !== index)
    }));
  };

  const handleUniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniForm.name || !uniForm.country || !uniForm.course) {
      setUniError("Name, Country, and Course are required.");
      return;
    }
    setIsSavingUni(true);
    setUniError(null);

    const method = editingUni ? 'PATCH' : 'POST';
    const url = editingUni ? `/api/admin/universities/${editingUni.id}` : '/api/admin/universities';

    const formattedSlabs = uniForm.slabs.map((slab: any) => ({
      minStudents: parseInt(slab.minStudents) || 1,
      maxStudents: slab.maxStudents ? parseInt(slab.maxStudents) : null,
      commissionType: slab.commissionType,
      commissionValue: parseFloat(slab.commissionValue) || 0,
    }));

    const payload = {
      ...uniForm,
      commissionPercentage: uniForm.baseCommissionType === 'PERCENT' && uniForm.baseCommissionValue ? parseFloat(uniForm.baseCommissionValue) : null,
      baseCommissionValue: uniForm.baseCommissionValue ? parseFloat(uniForm.baseCommissionValue) : null,
      bonusValue: uniForm.bonusValue ? parseFloat(uniForm.bonusValue) : null,
      slabs: formattedSlabs,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsUniModalOpen(false);
        setEditingUni(null);
        setUniForm({ name: '', country: '', course: '', tuitionFee: '', intakes: '', commissionPercentage: '', type: 'DIRECT', portalName: '', baseCommissionType: 'PERCENT', baseCommissionValue: '', bonusType: 'NONE', bonusValue: '', slabs: [] });
        fetchUniversities();
      } else {
        const data = await res.json();
        setUniError(data.error || "Failed to save university.");
      }
    } catch (err: any) {
      setUniError(err.message || "An error occurred.");
    } finally {
      setIsSavingUni(false);
    }
  };

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
  const totalPayableNpr = totalAgentNpr + totalBranchNpr;

  const pendingReceivableNpr = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmountNpr, 0);
  const collectedReceivableNpr = commissions.filter(c => c.status === 'RECEIVED' || c.status === 'PAID_TO_SUBAGENT').reduce((sum, c) => sum + c.commissionAmountNpr, 0);

  const settledPayableNpr = commissions.filter(c => c.status === 'PAID_TO_SUBAGENT').reduce((sum, c) => sum + (c.subAgentAmountNpr + (c.branchAmountNpr || 0)), 0);
  const pendingPayableNpr = totalPayableNpr - settledPayableNpr;

  const filteredCommissions = commissions.filter(c => {
    if (financeTab === 'RECEIVABLES') {
      return true; // All university commissions are incoming claims
    }
    if (financeTab === 'PAYABLES') {
      return (c.subAgentAmountNpr > 0 || (c.branchAmountNpr && c.branchAmountNpr > 0)); // Outgoing splits
    }
    return true;
  });

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
      <div className="space-y-4">
        {/* Row 1: Title & Subtitle */}
        <div className="border-b border-slate-800/40 pb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-350 to-slate-200 bg-clip-text text-transparent font-sans">
            Commissions & Ledger Management
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
            Real-time financial command center. Track incoming University & Student claims (Receivables) and manage outgoing Sub-Agent & Branch Referral splits (Payables).
          </p>
        </div>

        {/* Row 2: Live Forex Rates & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {forexRates && (
            <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-4 py-2 text-[10px] shadow-lg shadow-black/10 select-none shrink-0 backdrop-blur-sm">
              <span className="font-bold text-slate-500 uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Live Forex (NRB):
              </span>
              <div className="flex items-center space-x-3 font-mono">
                <span className="text-slate-300 flex items-center"><span className="text-emerald-400 font-bold mr-1">🇺🇸 USD</span> Rs. {forexRates.USD?.toFixed(2)}</span>
                <span className="text-slate-800">|</span>
                <span className="text-slate-300 flex items-center"><span className="text-emerald-400 font-bold mr-1">🇦🇺 AUD</span> Rs. {forexRates.AUD?.toFixed(2)}</span>
                <span className="text-slate-800">|</span>
                <span className="text-slate-300 flex items-center"><span className="text-emerald-400 font-bold mr-1">🇨🇦 CAD</span> Rs. {forexRates.CAD?.toFixed(2)}</span>
                <span className="text-slate-800">|</span>
                <span className="text-slate-300 flex items-center"><span className="text-emerald-400 font-bold mr-1">🇬🇧 GBP</span> Rs. {forexRates.GBP?.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenBulkInvoiceModal()}
              className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer select-none active:translate-y-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Bulk Invoice Generator</span>
            </button>

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
              className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-650/10 hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer select-none active:translate-y-0"
            >
              <Plus className="w-4 h-4 text-indigo-100" />
              <span>Add Commission</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Part Category Navigation Tabs: Receivables vs Payables */}
      <div className="bg-slate-950/40 border border-slate-850 p-1.5 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFinanceTab('ALL')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center space-x-2 ${
              financeTab === 'ALL'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>📑 All Financial Ledgers</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${financeTab === 'ALL' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-900 text-slate-500'}`}>
              {commissions.length}
            </span>
          </button>

          <button
            onClick={() => setFinanceTab('RECEIVABLES')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center space-x-2 ${
              financeTab === 'RECEIVABLES'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>📥 Part 1: Invoice Receivables (Incoming)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${financeTab === 'RECEIVABLES' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}>
              Rs. {totalNpr.toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => setFinanceTab('PAYABLES')}
            className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center space-x-2 ${
              financeTab === 'PAYABLES'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>📤 Part 2: Invoice Payables (Outgoing)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${financeTab === 'PAYABLES' ? 'bg-amber-950 text-amber-300' : 'bg-slate-900 text-slate-500'}`}>
              Rs. {totalPayableNpr.toLocaleString()}
            </span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-3 hidden lg:block select-none">
          {financeTab === 'RECEIVABLES' && '📥 Owed by Universities & Portals'}
          {financeTab === 'PAYABLES' && '📤 Owed to Sub-Agents & Branches'}
          {financeTab === 'ALL' && '📑 Dual Ledger Ledger sheets'}
        </div>
      </div>

      {/* Dynamic Metrics Cards (Adapts based on Receivables vs Payables tab) */}
      {financeTab === 'RECEIVABLES' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Booked Receivables</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight">Rs. {totalNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Total incoming university commission volume</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Claims</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">Rs. {pendingReceivableNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Pending payments awaiting university collection</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collected Receivables</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-500 font-mono tracking-tight">Rs. {collectedReceivableNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Successfully cleared claims from university partners</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-indigo-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net HQ Revenue</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-indigo-400 font-mono tracking-tight">Rs. {totalHqNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">HQ share retained after sub-agent/branch payout</span>
            </div>
          </div>
        </div>
      ) : financeTab === 'PAYABLES' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Outgoing Payables</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight">Rs. {totalPayableNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Total external payables (Sub-Agent + Branch shares)</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Agent Splits</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">Rs. {totalAgentNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Referral commission splits owed to sub-agents</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-sky-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch Office Share</span>
              <div className="p-2 bg-sky-500/10 rounded-xl text-sky-455 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-sky-400 font-mono tracking-tight">Rs. {totalBranchNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Intra-network splits credited to local branches</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settled Disbursements</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">Rs. {settledPayableNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Successfully disbursed & finalized splits</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-indigo-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Booked Commissions</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-100 font-mono tracking-tight">Rs. {totalNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Accumulated across foreign placements</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net HQ Revenue</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-500 font-mono tracking-tight">Rs. {totalHqNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Company net revenue share retained</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-sky-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch Contributions</span>
              <div className="p-2 bg-sky-500/10 rounded-xl text-sky-455 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-sky-400 font-mono tracking-tight">Rs. {totalBranchNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Total revenue split earned by branches</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-md hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Agent Splits</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-amber-400 font-mono tracking-tight">Rs. {totalAgentNpr.toLocaleString()}</h3>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Total split payments owed to sub-agents</span>
            </div>
          </div>
        </div>
      )}

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
        ) : filteredCommissions.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p className="text-sm font-semibold">No ledger records match the selected category filter</p>
            <p className="text-xs text-slate-600 mt-1">Switch tabs or clear filters to view ledger records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 select-none">Type</th>
                  <th className="px-6 py-4 select-none">Placed Applicant</th>
                  <th className="px-6 py-4 select-none">Partner University</th>
                  <th className="px-6 py-4 select-none">University Commission</th>
                  <th className="px-6 py-4 select-none">NPR Forex Rate</th>
                  <th className="px-6 py-4 select-none">Total NPR Equivalent</th>
                  {currentUser?.role !== 'SUB_AGENT' && <th className="px-6 py-4 select-none">Agent Split (NPR)</th>}
                  {currentUser?.role !== 'SUB_AGENT' && <th className="px-6 py-4 select-none">Branch Split (NPR)</th>}
                  <th className="px-6 py-4 select-none">HQ Net Share</th>
                  <th className="px-6 py-4 select-none text-center">Status</th>
                  <th className="px-6 py-4 text-center select-none">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {filteredCommissions.map((comm) => {
                  const hasPayableSplit = comm.subAgentAmountNpr > 0 || (comm.branchAmountNpr && comm.branchAmountNpr > 0);
                  return (
                    <tr key={comm.id} className="hover:bg-slate-850/30 transition-all duration-200 group">
                      <td className="px-6 py-4 font-mono">
                        {financeTab === 'PAYABLES' || (financeTab === 'ALL' && hasPayableSplit) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-950/40 border border-amber-500/20 text-amber-400">
                            📤 PAYABLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                            📥 RECEIVABLE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        <Link href={`/dashboard/applicants/${comm.applicant.id}`} className="hover:underline">
                          {comm.applicant.name}
                        </Link>
                        <span className="text-[9px] text-slate-500 block mt-0.5 font-medium">Branch: {comm.applicant.branch?.name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-300">{comm.partnerUniversity}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-200">{comm.currency} {comm.commissionAmountForeign.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-indigo-400">@ {comm.nprExchangeRate.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-100 bg-slate-950/20 px-3 py-1 rounded-lg inline-block my-2">Rs. {comm.commissionAmountNpr.toLocaleString()}</td>
                      {currentUser?.role !== 'SUB_AGENT' && (
                         <td className="px-6 py-4 font-mono text-amber-400">
                           {comm.subAgentAmountNpr > 0 ? (
                             <div className="space-y-1">
                               <div className="font-bold">Rs. {comm.subAgentAmountNpr.toLocaleString()}</div>
                               <span className={`inline-block text-[8px] leading-none px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                                 comm.status === 'PAID_TO_SUBAGENT'
                                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                   : 'bg-amber-50 text-amber-600 border border-amber-100/50'
                               }`}>
                                 {comm.status === 'PAID_TO_SUBAGENT' ? '✓ Disbursed' : '⋯ Pending'}
                               </span>
                             </div>
                           ) : <span className="text-slate-600 font-mono">-</span>}
                         </td>
                       )}
                       {currentUser?.role !== 'SUB_AGENT' && (
                         <td className="px-6 py-4 font-mono text-sky-400">
                           {comm.branchAmountNpr > 0 ? (
                             <div className="space-y-1">
                               <div className="font-bold">Rs. {comm.branchAmountNpr.toLocaleString()}</div>
                               <span className={`inline-block text-[8px] leading-none px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                                 comm.status !== 'PENDING'
                                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                   : 'bg-sky-50 text-sky-655 border border-sky-100/50'
                               }`}>
                                 {comm.status !== 'PENDING' ? '✓ Credited' : '⋯ Pending'}
                               </span>
                             </div>
                           ) : <span className="text-slate-600 font-mono">-</span>}
                         </td>
                       )}
                      <td className="px-6 py-4 font-mono font-bold text-emerald-400">Rs. {comm.hqAmountNpr.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          comm.status === 'RECEIVED'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : comm.status === 'PAID_TO_SUBAGENT'
                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                        }`}>
                           {comm.status === 'RECEIVED'
                             ? 'Received'
                             : comm.status === 'PAID_TO_SUBAGENT'
                             ? 'Fully Settled'
                             : 'Receivable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedCommission({ ...comm, applicantName: comm.applicant.name, branchName: comm.applicant.branch?.name });
                              setInvoiceMode('UNIVERSITY');
                            }}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500 transition-colors cursor-pointer"
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

      {/* Bulk Invoice Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="w-full max-w-7xl bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:shadow-none print:rounded-none print:w-full print:max-h-none print:bg-white print:text-slate-950">
            
            {/* Control Header (Hidden in Print) */}
            <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40 flex justify-between items-center print:hidden flex-none">
              <span className="text-xs font-bold text-slate-350 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-500" />
                Bulk University Invoice Claims Generator
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-500 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Screen Container */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              
              {/* Left Column: Configuration Panel (Hidden in Print) */}
              <div className="w-full lg:w-[40%] bg-slate-950/40 border-r border-slate-800/80 p-5 overflow-y-auto space-y-5 print:hidden text-xs select-none">
                
                {/* 1. Selector & Basic Config fields */}
                <div className="space-y-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1 font-mono uppercase tracking-wider">1. Select Partner University *</label>
                    <select
                      value={selectedUni}
                      onChange={(e) => handleUniChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="">-- Choose University --</option>
                      {Array.from(
                        new Set(commissions.filter(c => c.status === 'PENDING').map(c => c.partnerUniversity))
                      ).sort().map((uni, idx) => (
                        <option key={idx} value={uni}>{uni}</option>
                      ))}
                    </select>
                  </div>

                  {selectedUni && (
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[10px] text-emerald-400 font-bold mb-1 font-mono uppercase tracking-wider">2. Intake Batch Filter</label>
                        <select
                          value={intakeFilter}
                          onChange={(e) => setIntakeFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs font-mono"
                        >
                          <option value="">-- All Intakes Batch --</option>
                          {Array.from(new Set(commissions.filter(c => c.partnerUniversity === selectedUni && c.status === 'PENDING').map(c => {
                            const d = new Date(c.createdAt);
                            const m = d.getMonth() + 1;
                            const y = d.getFullYear();
                            if (m >= 1 && m <= 3) return `Jan/Feb ${y} Intake`;
                            if (m >= 4 && m <= 6) return `May/June ${y} Intake`;
                            if (m >= 7 && m <= 9) return `July/Aug ${y} Intake`;
                            return `Sept/Oct ${y} Intake`;
                          }))).map((intakeName, idx) => (
                            <option key={idx} value={intakeName}>{intakeName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1 font-mono uppercase tracking-wider">3. Invoice / Claim Number</label>
                        <input
                          type="text"
                          value={bulkInvoiceForm.invoiceNumber}
                          onChange={(e) => setBulkInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1 font-mono uppercase tracking-wider">4. NRB Exchange Rate (NPR)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={bulkInvoiceForm.nprExchangeRate}
                          onChange={(e) => setBulkInvoiceForm(prev => ({ ...prev, nprExchangeRate: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Volume Slabs Configuration & Live Highlight (Editable) */}
                {selectedUni && (
                  <div className="bg-[#03150d] border border-[#0d3420] p-4 rounded-2xl space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#0d3420] pb-2.5">
                      <div>
                        <span className="font-bold text-[10px] text-[#eab308] uppercase tracking-wider block font-mono">
                          University Slab Configuration
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Edit slab thresholds or rates below.
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={addBulkSlabRow}
                          className="px-2 py-0.5 bg-[#010a06] border border-[#0e3322] text-[8px] font-bold text-slate-350 font-mono rounded hover:bg-[#0d3420] hover:text-white transition-all cursor-pointer"
                        >
                          + Add
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveBulkSlabsToUniversity}
                          disabled={isUpdatingSlabs}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-bold font-mono rounded transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                        >
                          {isUpdatingSlabs && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          <span>Save Slabs</span>
                        </button>
                      </div>
                    </div>

                    {slabSuccessMsg && (
                      <div className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
                        ✓ {slabSuccessMsg}
                      </div>
                    )}

                    {bulkSlabs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-4 text-slate-400 italic text-[10px] space-y-2">
                        <span>No volume slabs configured. Standard base commission values will be used.</span>
                        <button
                          type="button"
                          onClick={addBulkSlabRow}
                          className="px-2 py-1 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[9px] rounded font-mono cursor-pointer"
                        >
                          + Add First Slab
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {bulkSlabs.map((slab: any, idx: number) => {
                          const min = parseInt(slab.minStudents) || 1;
                          const max = slab.maxStudents ? parseInt(slab.maxStudents) : null;
                          const activeCount = bulkCalculations.length;
                          const isActive = activeCount >= min && (!max || activeCount <= max);

                          return (
                            <div 
                              key={idx} 
                              className={`p-3 rounded-xl border text-[11px] transition-all space-y-2 relative ${
                                isActive 
                                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/5' 
                                  : 'bg-[#010a06] border-[#0e3322]'
                              }`}
                            >
                              <div className="flex justify-between items-center border-b border-slate-800/60 pb-1">
                                <span className="font-mono text-[9px] text-slate-500">Slab #{idx + 1} {isActive && <span className="text-emerald-400 font-bold ml-1 font-sans">● Active</span>}</span>
                                <button
                                  type="button"
                                  onClick={() => removeBulkSlabRow(idx)}
                                  className="text-rose-400 hover:text-rose-350 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 font-mono">
                                <div>
                                  <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Min Students</label>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={slab.minStudents}
                                    onChange={(e) => updateBulkSlabRow(idx, 'minStudents', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Max Students</label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Above"
                                    value={slab.maxStudents || ''}
                                    onChange={(e) => updateBulkSlabRow(idx, 'maxStudents', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Comm Type</label>
                                  <select
                                    value={slab.commissionType}
                                    onChange={(e) => updateBulkSlabRow(idx, 'commissionType', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none cursor-pointer"
                                  >
                                    <option value="PERCENT">% Share</option>
                                    <option value="FLAT">Flat ($)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] text-emerald-400 font-medium mb-0.5">Comm Value</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={slab.commissionValue}
                                    onChange={(e) => updateBulkSlabRow(idx, 'commissionValue', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-bold text-emerald-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] text-indigo-300 font-medium mb-0.5">Bonus Type</label>
                                  <select
                                    value={slab.bonusType || 'NONE'}
                                    onChange={(e) => updateBulkSlabRow(idx, 'bonusType', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none cursor-pointer"
                                  >
                                    <option value="NONE">None</option>
                                    <option value="PERCENT">% Bonus</option>
                                    <option value="FLAT">Flat Bonus</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] text-indigo-300 font-medium mb-0.5">Bonus Value</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    disabled={(slab.bonusType || 'NONE') === 'NONE'}
                                    placeholder="-"
                                    value={slab.bonusValue || ''}
                                    onChange={(e) => updateBulkSlabRow(idx, 'bonusValue', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-bold text-indigo-300 disabled:opacity-40"
                                  />
                                </div>
                              </div>
                              
                              {(slab.bonusType || 'NONE') !== 'NONE' && (
                                <div className="font-mono text-[9px] pt-1">
                                  <label className="block text-[8px] text-purple-300 font-medium mb-0.5">Bonus Scope</label>
                                  <select
                                    value={slab.bonusCalcMode || 'PER_STUDENT'}
                                    onChange={(e) => updateBulkSlabRow(idx, 'bonusCalcMode', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[10px] focus:outline-none cursor-pointer"
                                  >
                                    <option value="PER_STUDENT">Per Student</option>
                                    <option value="TOTAL_BATCH">Total Batch Lump-Sum</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Student Checklist Selection list */}
                {selectedUni && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wide block font-mono">
                      Choose Students in Batch
                    </span>
                    <div className="border border-slate-800/85 rounded-2xl overflow-hidden max-h-[240px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs bg-slate-950/20">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-950/40 text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                            <th className="px-3 py-2 w-10 text-center">Inc</th>
                            <th className="px-3 py-2">Student</th>
                            <th className="px-3 py-2 text-right">Comm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                          {commissions.filter(c => c.partnerUniversity === selectedUni && c.status === 'PENDING').map(c => {
                            const isChecked = modalSelectedCommIds.includes(c.id);
                            const calcItem = bulkCalculations.find(item => item.id === c.id);
                            return (
                              <tr key={c.id} className={`hover:bg-slate-850/20 transition-all ${!isChecked ? 'opacity-35' : ''}`}>
                                <td className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setModalSelectedCommIds(prev => [...prev, c.id]);
                                      } else {
                                        setModalSelectedCommIds(prev => prev.filter(id => id !== c.id));
                                      }
                                    }}
                                    className="rounded border-slate-800 bg-slate-950 text-indigo-655 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-200">
                                  {c.applicant.name}
                                  <span className="text-[9px] text-slate-500 block font-normal">{c.applicant.targetCourse || 'N/A'}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                                  {calcItem ? `${calcItem.currency} ${calcItem.commissionAmountForeign.toLocaleString()}` : ''}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Bank Details Configuration (Editable) */}
                {selectedUni && (
                  <div className="bg-[#03150d] border border-[#0d3420] p-4 rounded-2xl space-y-3">
                    <span className="font-bold text-[10px] text-[#eab308] uppercase tracking-wider block font-mono">
                      Edit Bank Remittance Details
                    </span>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Bank Name</label>
                        <input
                          type="text"
                          value={bankDetails.bankName}
                          onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Branch</label>
                        <input
                          type="text"
                          value={bankDetails.branch}
                          onChange={(e) => handleBankDetailsChange('branch', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Account Name</label>
                        <input
                          type="text"
                          value={bankDetails.accountName}
                          onChange={(e) => handleBankDetailsChange('accountName', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Account No</label>
                        <input
                          type="text"
                          value={bankDetails.accountNo}
                          onChange={(e) => handleBankDetailsChange('accountNo', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Swift Code</label>
                        <input
                          type="text"
                          value={bankDetails.swiftCode}
                          onChange={(e) => handleBankDetailsChange('swiftCode', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Company Details Configuration (Editable) */}
                {selectedUni && (
                  <div className="bg-[#03150d] border border-[#0d3420] p-4 rounded-2xl space-y-3">
                    <span className="font-bold text-[10px] text-[#eab308] uppercase tracking-wider block font-mono">
                      Edit Company Invoice Header
                    </span>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Company Name</label>
                        <input
                          type="text"
                          value={companyDetails.name}
                          onChange={(e) => handleCompanyDetailsChange('name', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Address / Headquarters</label>
                        <input
                          type="text"
                          value={companyDetails.address}
                          onChange={(e) => handleCompanyDetailsChange('address', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">PAN / Reg No</label>
                          <input
                            type="text"
                            value={companyDetails.panNo}
                            onChange={(e) => handleCompanyDetailsChange('panNo', e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Telephone</label>
                          <input
                            type="text"
                            value={companyDetails.phone}
                            onChange={(e) => handleCompanyDetailsChange('phone', e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8px] text-slate-400 font-medium mb-0.5 font-mono">Email Address</label>
                        <input
                          type="text"
                          value={companyDetails.email}
                          onChange={(e) => handleCompanyDetailsChange('email', e.target.value)}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Invoice Preview */}
              <div className="w-full lg:w-[60%] p-6 space-y-6 overflow-y-auto print:overflow-visible print:p-0 print:text-slate-900 bg-[#020a06] print:bg-white text-slate-100 min-h-0">
                {!selectedUni ? (
                  <div className="flex flex-col items-center justify-center py-40 text-slate-500">
                    <FileSpreadsheet className="w-14 h-14 text-slate-700 animate-pulse mb-3" />
                    <p className="text-xs font-medium">Please select a Partner University from the left dropdown to generate the official claim invoice.</p>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto bg-slate-950 print:bg-white border border-slate-800 print:border-none rounded-3xl p-8 print:p-0 shadow-2xl space-y-6 font-sans">
                  
                  {/* Executive Header */}
                  <div className="flex flex-wrap justify-between items-start border-b border-slate-800 print:border-slate-300 pb-6 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-7 h-7 text-emerald-500 print:text-slate-900" />
                        <h2 className="text-2xl font-black tracking-tight text-white print:text-slate-900">{companyDetails.name}</h2>
                      </div>
                      <p className="text-[11px] text-slate-400 print:text-slate-600 leading-relaxed font-medium">
                        Headquarters: {companyDetails.address}<br/>
                        PAN / Reg No: {companyDetails.panNo} | Email: {companyDetails.email} | Tel: {companyDetails.phone}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="inline-block px-3 py-1 bg-emerald-950/80 print:bg-slate-100 border border-emerald-500/30 print:border-slate-300 text-emerald-400 print:text-slate-900 font-extrabold text-[10px] uppercase tracking-widest rounded-lg">
                        Official Commission Claim Invoice
                      </div>
                      <div className="text-xs text-slate-300 print:text-slate-800 font-mono font-bold mt-2">
                        Invoice ID: <span className="text-white print:text-slate-950">{bulkInvoiceForm.invoiceNumber}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 print:text-slate-505">
                        Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* University & Billing Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] border-b border-slate-800 print:border-slate-300 pb-6 leading-relaxed">
                    <div className="space-y-2">
                      <span className="text-[9px] text-[#eab308] font-bold uppercase tracking-wider font-mono block">Billing From</span>
                      <div className="bg-slate-950/40 print:bg-slate-55 p-3 rounded-2xl border border-slate-800/80 print:border-slate-200">
                        <span className="font-extrabold text-slate-200 print:text-slate-955 block text-xs">{companyDetails.name}</span>
                        <span className="text-slate-400 print:text-slate-600 font-medium">
                          {companyDetails.address}<br/>
                          PAN No: {companyDetails.panNo}<br/>
                          Authorized Person: Accounts Director
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] text-[#eab308] font-bold uppercase tracking-wider font-mono block">Billing To (Partner Institution)</span>
                      <div className="bg-slate-950/40 print:bg-slate-55 p-3 rounded-2xl border border-slate-800/80 print:border-slate-200">
                        <span className="font-extrabold text-slate-200 print:text-slate-950 block text-xs">{selectedUni}</span>
                        <span className="text-slate-400 print:text-slate-600 font-medium">
                          Intake Filter: <span className="text-slate-300 print:text-slate-805 font-semibold">{intakeFilter || 'All Pending Intakes'}</span><br/>
                          Total Verified Students: <span className="text-emerald-400 print:text-slate-900 font-bold">{bulkCalculations.length} Student(s)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slabs breakdown details (If Active) */}
                  {bulkSlabs.length > 0 && (
                    <div className="bg-[#03150d] print:bg-slate-50 border border-emerald-500/20 print:border-slate-300 p-3 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs leading-none">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-slate-300 print:text-slate-805 font-bold">
                          Active Volume Slab Tier Applied:
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const activeCount = bulkCalculations.length;
                          const activeSlab = bulkSlabs.find((slab: any) => {
                            const min = parseInt(slab.minStudents) || 1;
                            const max = slab.maxStudents ? parseInt(slab.maxStudents) : null;
                            return activeCount >= min && (!max || activeCount <= max);
                          });

                          if (!activeSlab) {
                            return <span className="text-slate-400 font-mono">No active slab matching student volume. Base commissions used.</span>;
                          }

                          return (
                            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                              <span className="px-2.5 py-1 bg-emerald-950 print:bg-slate-200 border border-emerald-500/30 print:border-slate-400 text-emerald-400 print:text-slate-900 font-bold rounded-lg">
                                Vol: {activeSlab.minStudents}{activeSlab.maxStudents ? `-${activeSlab.maxStudents}` : '+'} Students
                              </span>
                              <span className="px-2.5 py-1 bg-[#010a06] print:bg-slate-200 border border-[#0d3420] print:border-slate-400 text-[#eab308] print:text-slate-900 font-bold rounded-lg">
                                Rate: {activeSlab.commissionType === 'PERCENT' ? `${activeSlab.commissionValue}%` : `$${activeSlab.commissionValue}`}
                              </span>
                              {activeSlab.bonusType !== 'NONE' && (
                                <span className="px-2.5 py-1 bg-indigo-950 print:bg-slate-200 border border-indigo-500/30 print:border-slate-400 text-indigo-400 print:text-slate-900 font-bold rounded-lg">
                                  Bonus: {activeSlab.bonusType === 'PERCENT' ? `${activeSlab.bonusValue}%` : `$${activeSlab.bonusValue}`} ({activeSlab.bonusCalcMode === 'PER_STUDENT' ? 'Per Student' : 'Batch Lump-Sum'})
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Claim Details Table */}
                  <div className="border border-slate-800 print:border-slate-350 rounded-2xl overflow-hidden text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-100 text-[10px] text-slate-400 print:text-slate-700 font-bold uppercase tracking-wider font-mono">
                          <th className="px-4 py-3 w-8">#</th>
                          <th className="px-4 py-3">Student & Course</th>
                          <th className="px-4 py-3 text-right">Tuition Fee</th>
                          <th className="px-4 py-3 text-right">Commission Rate</th>
                          <th className="px-4 py-3 text-right">Bonus Applied</th>
                          <th className="px-4 py-3 text-right">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/30 print:divide-slate-200 text-slate-300 print:text-slate-800">
                        {bulkCalculations.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                            <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-100 print:text-slate-950 block text-xs">{item.studentName}</span>
                              <span className="text-[9px] text-slate-400 print:text-slate-500">{item.course}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium">
                              {item.currency} {item.tuitionFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {item.isSlabApplied ? (
                                <span className="text-[#eab308] print:text-slate-900 font-bold">{item.rateText} (Slab)</span>
                              ) : (
                                <span>{item.rateText} (Base)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-indigo-400 print:text-slate-900 font-semibold">
                              {item.bonusAmountForeign > 0 ? (
                                <span>{item.currency} {item.bonusAmountForeign.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              ) : (
                                <span className="text-slate-600 print:text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 print:text-slate-900">
                              {item.currency} {item.commissionAmountForeign.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}

                        {bulkCalculations.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                              No students selected on the left panel.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals & Exchange Rate Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 p-4 rounded-2xl space-y-2 leading-relaxed">
                      <span className="font-bold text-[9px] text-[#eab308] uppercase tracking-wider block font-mono">Bank Remittance Instructions</span>
                      <div className="space-y-1.5 text-slate-400 print:text-slate-600 font-mono text-[10px] leading-relaxed">
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span>Bank Name:</span>
                          <span className="text-slate-250 print:text-slate-900 font-bold">{bankDetails.bankName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span>Branch:</span>
                          <span className="text-slate-250 print:text-slate-900 font-bold">{bankDetails.branch}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span>Account Name:</span>
                          <span className="text-slate-250 print:text-slate-900 font-bold">{bankDetails.accountName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span>Account No (NPR):</span>
                          <span className="text-slate-250 print:text-slate-900 font-bold">{bankDetails.accountNo}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900/60 pb-1">
                          <span>Swift Code:</span>
                          <span className="text-slate-250 print:text-slate-900 font-bold">{bankDetails.swiftCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PAN Registration:</span>
                          <span className="text-slate-250 print:text-slate-900 font-bold">609823412</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-950/20 print:bg-slate-100 border border-emerald-500/20 print:border-slate-300 p-4 rounded-2xl space-y-3 font-mono">
                      <span className="font-bold text-[9px] text-[#eab308] print:text-slate-855 uppercase tracking-wider block">Financial Summary Statement</span>
                      <div className="space-y-2 text-[11px] leading-none">
                        <div className="flex justify-between text-slate-350 print:text-slate-700">
                          <span>Gross Base Commission:</span>
                          <span>
                            {bulkCalculations[0]?.currency || 'USD'} {bulkCalculations.reduce((sum, item) => sum + (item.commissionAmountForeign - item.bonusAmountForeign), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {bulkCalculations.reduce((sum, item) => sum + item.bonusAmountForeign, 0) > 0 && (
                          <div className="flex justify-between text-indigo-400 print:text-slate-700 font-bold">
                            <span>Volume Reward Bonus:</span>
                            <span>
                              +{bulkCalculations[0]?.currency || 'USD'} {bulkCalculations.reduce((sum, item) => sum + item.bonusAmountForeign, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-300 print:text-slate-900 font-extrabold border-t border-slate-800 print:border-slate-300 pt-2 text-xs">
                          <span>Total Claim Receivable:</span>
                          <span className="text-white print:text-slate-950 font-black">
                            {bulkCalculations[0]?.currency || 'USD'} {bulkCalculations.reduce((sum, item) => sum + item.commissionAmountForeign, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-450 print:text-slate-500 leading-normal border-t border-slate-800 print:border-slate-300 pt-2 space-y-1 font-mono">
                          <div className="flex justify-between">
                            <span>NRB Forex Exchange Rate:</span>
                            <span className="text-slate-300 print:text-slate-900 font-semibold">1 {bulkCalculations[0]?.currency || 'USD'} = NPR {bulkInvoiceForm.nprExchangeRate || '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-emerald-400 print:text-slate-900 font-extrabold">
                            <span>NPR Equiv. (Receivable):</span>
                            <span>NPR { (bulkCalculations.reduce((sum, item) => sum + item.commissionAmountForeign, 0) * (parseFloat(bulkInvoiceForm.nprExchangeRate) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures Footer */}
                  <div className="pt-8 border-t border-slate-800 print:border-slate-300 flex justify-between items-end text-xs text-slate-400 print:text-slate-600 font-mono">
                    <div className="space-y-1">
                      <div className="w-40 border-b border-slate-700 print:border-slate-400 pb-1 text-center font-bold text-slate-300 print:text-slate-900">
                        Finance Ledger Dept
                      </div>
                      <div className="text-[10px] text-slate-500 print:text-slate-500">Prepared & Verified By</div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="w-48 border-b border-slate-700 print:border-slate-400 pb-1 text-center font-bold text-slate-300 print:text-slate-950">
                        Director of Relations
                      </div>
                      <div className="text-[10px] text-slate-500 print:text-slate-500">Authorized Official Stamp & Sign</div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
            {/* Footer controls (Hidden in Print) */}
            {selectedUni && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4 print:hidden text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-medium">Update Status:</span>
                  <select
                    value={bulkInvoiceForm.status}
                    onChange={(e) => setBulkInvoiceForm(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 focus:outline-none"
                  >
                    <option value="PENDING">Keep as Receivable (Pending)</option>
                    <option value="RECEIVED">Mark as Received (Paid by Uni)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBulkInvoice}
                    disabled={bulkSaveLoading || bulkCalculations.length === 0}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                  >
                    {bulkSaveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Generate Invoice</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Generated Official Invoice Modal View */}
      {isGeneratedInvoiceOpen && generatedInvoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
          <div className="w-full max-w-5xl bg-[#020a06] border border-[#0d3420] text-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:shadow-none print:rounded-none print:w-full print:max-h-none print:bg-white print:border-none">
            
            {/* Action Top Bar (Hidden in Print) */}
            <div className="px-6 py-4 border-b border-[#0d3420] bg-slate-950/60 flex justify-between items-center print:hidden">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-mono">Generated University Commission Claim Invoice</h3>
                  <p className="text-[10px] text-slate-400">Official Claim Invoice ready for transmission to Direct University or Portal Representative.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGeneratedInvoiceOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Well-Structured Executive Invoice Sheet */}
            <div className="p-8 space-y-6 overflow-y-auto print:overflow-visible flex-1 print:p-0 print:text-slate-900 bg-[#020a06] print:bg-white text-slate-100">
              <div className="max-w-4xl mx-auto bg-slate-950 print:bg-white border border-slate-800 print:border-none rounded-3xl p-8 print:p-0 shadow-2xl space-y-6 font-sans">
                
                {/* Executive Branding Header */}
                <div className="flex flex-wrap justify-between items-start border-b border-slate-800 print:border-slate-300 pb-6 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-7 h-7 text-emerald-500 print:text-slate-900" />
                      <h2 className="text-2xl font-black tracking-tight text-white print:text-slate-900">{generatedInvoiceData.companyDetails?.name || 'Thinkcone Study Abroad'}</h2>
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600 leading-relaxed font-medium">
                      Headquarters: {generatedInvoiceData.companyDetails?.address || 'Putalisadak, Kathmandu, Nepal'}<br/>
                      PAN / Reg No: {generatedInvoiceData.companyDetails?.panNo || '609823412'} | Email: {generatedInvoiceData.companyDetails?.email || 'finance@thinkcone.com.np'} | Tel: {generatedInvoiceData.companyDetails?.phone || '+977-1-44XXXXX'}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-block px-3 py-1 bg-emerald-950/80 print:bg-slate-100 border border-emerald-500/30 print:border-slate-300 text-emerald-400 print:text-slate-900 font-extrabold text-[10px] uppercase tracking-widest rounded-lg">
                      Official Commission Claim Invoice
                    </div>
                    <div className="text-xs text-slate-300 print:text-slate-800 font-mono font-bold mt-2">
                      Invoice #: {generatedInvoiceData.bulkInvoiceForm?.invoiceNumber}
                    </div>
                    <div className="text-[10px] text-slate-400 print:text-slate-600 font-mono">
                      Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Recipient Details & Intake Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-200 space-y-1">
                    <span className="font-mono font-bold text-[9px] text-emerald-400 print:text-slate-500 uppercase tracking-wider block">
                      {generatedInvoiceData.selectedUni?.includes('[Portal:') ? 'BILL TO PORTAL REPRESENTATIVE' : 'BILL TO DIRECT PARTNER UNIVERSITY'}
                    </span>
                    <h3 className="font-extrabold text-slate-100 print:text-slate-900 text-base">
                      {generatedInvoiceData.selectedUni}
                    </h3>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      {generatedInvoiceData.selectedUni?.includes('[Portal:') 
                        ? `Official Agent Claim via ${generatedInvoiceData.selectedUni.match(/\[Portal:\s*(.*)\]/)?.[1] || 'Portal Representative'} Office` 
                        : 'Direct Admissions & University Finance Department'}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 print:bg-slate-50 p-4 rounded-2xl border border-slate-800 print:border-slate-200 space-y-1 font-mono">
                    <span className="font-bold text-[9px] text-indigo-400 print:text-slate-500 uppercase tracking-wider block">
                      INTAKE & CLAIM DETAILS
                    </span>
                    <div className="text-xs text-slate-200 print:text-slate-900 font-semibold">
                      Intake Batch: <span className="text-emerald-400 print:text-slate-900">{generatedInvoiceData.intakeFilter || 'All Intakes Batch'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 print:text-slate-600">
                      Enrolled Batch: {generatedInvoiceData.bulkCalculations?.length} Verified Student Candidate(s)
                    </div>
                    <div className="text-[11px] text-slate-400 print:text-slate-600">
                      Exchange Rate: 1 Foreign Unit = NRs. {parseFloat(generatedInvoiceData.bulkInvoiceForm?.nprExchangeRate || '133').toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Active Slab Banner */}
                {generatedInvoiceData.bulkSlabs?.length > 0 && (
                  <div className="bg-[#031d11] print:bg-slate-100 border border-[#0e4427] print:border-slate-300 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 print:text-slate-900 font-bold">🏆 Volume Tier Slab Applied:</span>
                      <span className="text-slate-200 print:text-slate-800 font-medium">
                        {generatedInvoiceData.bulkCalculations?.length} Included Student(s) matched Volume Tier
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 print:bg-slate-200 text-emerald-400 print:text-slate-900 font-extrabold text-[9px] uppercase tracking-wider rounded">
                      Auto-Calculated & Verified
                    </span>
                  </div>
                )}

                {/* Itemized Candidate Table */}
                <div className="border border-slate-800 print:border-slate-300 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs print:text-slate-900">
                    <thead>
                      <tr className="border-b border-slate-800 print:border-slate-300 bg-slate-900 print:bg-slate-100 text-[9px] font-mono font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Student Candidate</th>
                        <th className="px-4 py-3">Program / Course</th>
                        <th className="px-4 py-3 text-right">Tuition Fee</th>
                        <th className="px-4 py-3 text-right">Base Comm</th>
                        <th className="px-4 py-3 text-right">Bonus Comm</th>
                        <th className="px-4 py-3 text-right">Total Claim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                      {generatedInvoiceData.bulkCalculations?.map((c: any, idx: number) => (
                        <tr key={c.id || idx} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                          <td className="px-4 py-3 font-mono text-slate-500 print:text-slate-600">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-100 print:text-slate-900">{c.applicantName}</td>
                          <td className="px-4 py-3 text-slate-300 print:text-slate-700">{c.course}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300 print:text-slate-700">
                            {c.currency} {c.tuitionFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300 print:text-slate-700">
                            {c.currency} {c.baseCommForeign?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-indigo-300 print:text-slate-700">
                            {c.bonusCommForeign > 0 
                              ? `${c.currency} ${c.bonusCommForeign.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 print:text-slate-900">
                            {c.currency} {c.commissionAmountForeign?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Bank Wire Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800 print:border-slate-300">
                  <div className="bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-200 p-4 rounded-2xl space-y-1.5 text-xs font-mono">
                    <span className="font-bold text-[9px] text-slate-400 print:text-slate-600 uppercase tracking-wider block">
                      BANK REMITTANCE & WIRE DETAILS
                    </span>
                    <div className="text-slate-200 print:text-slate-900 font-semibold">Account Name: {generatedInvoiceData.bankDetails?.accountName || 'Thinkcone Study Abroad Pvt. Ltd.'}</div>
                    <div className="text-slate-400 print:text-slate-700">Bank Name: {generatedInvoiceData.bankDetails?.bankName || 'Standard Chartered Bank Nepal'}</div>
                    <div className="text-slate-400 print:text-slate-700">Account No: {generatedInvoiceData.bankDetails?.accountNo || '01-2384912-01'}</div>
                    <div className="text-slate-400 print:text-slate-700">SWIFT / BIC Code: {generatedInvoiceData.bankDetails?.swiftCode || 'SCBLNPKT'}</div>
                    <div className="text-slate-400 print:text-slate-700">Branch: {generatedInvoiceData.bankDetails?.branch || 'Putalisadak Branch, Kathmandu, Nepal'}</div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 print:text-slate-600">
                      <span>Total Verified Students:</span>
                      <span className="font-bold text-slate-100 print:text-slate-900">{generatedInvoiceData.bulkCalculations?.length} Candidates</span>
                    </div>
                    <div className="flex justify-between text-slate-400 print:text-slate-600">
                      <span>Base Foreign Commission:</span>
                      <span className="font-bold text-slate-200 print:text-slate-900">
                        {generatedInvoiceData.bulkCalculations?.[0]?.currency} {generatedInvoiceData.bulkCalculations?.reduce((sum: number, c: any) => sum + c.baseCommForeign, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-indigo-300 print:text-slate-700">
                      <span>Volume Bonus Total Claim:</span>
                      <span className="font-bold text-indigo-300 print:text-slate-900">
                        {generatedInvoiceData.bulkCalculations?.[0]?.currency} {generatedInvoiceData.bulkCalculations?.reduce((sum: number, c: any) => sum + c.bonusCommForeign, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 print:border-slate-300 pt-2 text-slate-100 print:text-slate-900 font-bold text-sm">
                      <span>GRAND TOTAL CLAIM (FOREIGN):</span>
                      <span className="text-emerald-400 print:text-slate-900">
                        {generatedInvoiceData.bulkCalculations?.[0]?.currency} {generatedInvoiceData.bulkCalculations?.reduce((sum: number, c: any) => sum + c.commissionAmountForeign, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/60 print:border-slate-200 pt-1.5 text-xs text-slate-400 print:text-slate-700 font-semibold">
                      <span>NPR EQUIVALENT CLAIM:</span>
                      <span className="text-emerald-400 print:text-slate-900 font-bold">
                        NRs. {generatedInvoiceData.bulkCalculations?.reduce((sum: number, c: any) => sum + c.commissionAmountNpr, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signatory Footer */}
                <div className="pt-8 border-t border-slate-800 print:border-slate-300 flex justify-between items-end text-xs text-slate-400 print:text-slate-600 font-mono">
                  <div className="space-y-1">
                    <div className="w-40 border-b border-slate-700 print:border-slate-400 pb-1 text-center font-bold text-slate-300 print:text-slate-900">
                      Finance Ledger Dept
                    </div>
                    <div className="text-[10px] text-slate-500 print:text-slate-500">Prepared & Verified By</div>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="w-48 border-b border-slate-700 print:border-slate-400 pb-1 text-center font-bold text-slate-300 print:text-slate-900">
                      Director of Relations
                    </div>
                    <div className="text-[10px] text-slate-500 print:text-slate-500">Authorized Official Stamp & Sign</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Footer (Hidden in Print) */}
            <div className="px-6 py-4 border-t border-[#0d3420] bg-slate-950/80 flex justify-between items-center print:hidden text-xs">
              <div className="text-slate-400 font-mono text-[11px]">
                Status: <span className="text-emerald-400 font-bold uppercase">{generatedInvoiceData.bulkInvoiceForm?.status}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratedInvoiceOpen(false)}
                  className="py-2 px-5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice / Save PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Represented University Modal */}
      {isUniModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#03150d] border border-[#0d3420] text-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            
            <div className="px-6 py-4 border-b border-[#0d3420] bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100 font-mono">
                <GraduationCap className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm">
                  {editingUni ? `Edit Represented University` : 'Add Represented University'}
                </h3>
              </div>
              <button
                onClick={() => setIsUniModalOpen(false)}
                className="p-1.5 hover:bg-[#0d3420] text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUniSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {uniError && <div className="text-[10px] text-rose-550 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">{uniError}</div>}
              
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">University Name *</label>
                <input
                  type="text"
                  required
                  value={uniForm.name}
                  onChange={(e) => setUniForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. UEL"
                  className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Country *</label>
                  <input
                    type="text"
                    required
                    value={uniForm.country}
                    onChange={(e) => setUniForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g. UK"
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Course / Program *</label>
                  <input
                    type="text"
                    required
                    value={uniForm.course}
                    onChange={(e) => setUniForm(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="e.g. BBA"
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Tuition Fee</label>
                  <input
                    type="text"
                    value={uniForm.tuitionFee}
                    onChange={(e) => setUniForm(prev => ({ ...prev, tuitionFee: e.target.value }))}
                    placeholder="e.g. 26000"
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Intake Months</label>
                  <input
                    type="text"
                    value={uniForm.intakes}
                    onChange={(e) => setUniForm(prev => ({ ...prev, intakes: e.target.value }))}
                    placeholder="e.g. jan, sept"
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Base Commission Type</label>
                  <select
                    value={uniForm.baseCommissionType}
                    onChange={(e) => setUniForm(prev => ({ ...prev, baseCommissionType: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-[#a1a1aa] text-xs focus:outline-none focus:border-[#1ca360] cursor-pointer"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Base Commission Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={uniForm.baseCommissionValue}
                    onChange={(e) => setUniForm(prev => ({ ...prev, baseCommissionValue: e.target.value }))}
                    placeholder="e.g. 20"
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Bonus Type</label>
                  <select
                    value={uniForm.bonusType}
                    onChange={(e) => setUniForm(prev => ({ ...prev, bonusType: e.target.value, bonusValue: e.target.value === 'NONE' ? '' : prev.bonusValue }))}
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-[#a1a1aa] text-xs focus:outline-none focus:border-[#1ca360] cursor-pointer"
                  >
                    <option value="NONE">None</option>
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Bonus Value (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={uniForm.bonusType === 'NONE'}
                    value={uniForm.bonusValue}
                    onChange={(e) => setUniForm(prev => ({ ...prev, bonusValue: e.target.value }))}
                    placeholder={uniForm.bonusType === 'NONE' ? 'Disabled' : 'e.g. 1000'}
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360] font-mono disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Representation Type</label>
                  <select
                    value={uniForm.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUniForm(prev => ({ 
                        ...prev, 
                        type: val,
                        portalName: val === 'DIRECT' ? '' : prev.portalName 
                      }));
                    }}
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-[#a1a1aa] text-xs focus:outline-none cursor-pointer focus:border-[#1ca360]"
                  >
                    <option value="DIRECT">Direct Representation</option>
                    <option value="PORTAL">Portal Representation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Portal Name *</label>
                  <input
                    type="text"
                    required={uniForm.type === 'PORTAL'}
                    disabled={uniForm.type !== 'PORTAL'}
                    value={uniForm.portalName}
                    onChange={(e) => setUniForm(prev => ({ ...prev, portalName: e.target.value }))}
                    placeholder={uniForm.type !== 'PORTAL' ? 'N/A' : 'e.g. App'}
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360] disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="border-t border-[#0e3322]/50 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#eab308] uppercase tracking-wider font-mono">
                    VOLUME-BASED COMMISSION SLABS (SLAB SYSTEM)
                  </span>
                  <button
                    type="button"
                    onClick={addSlabRow}
                    className="px-2.5 py-1 bg-[#010a06] border border-[#0e3322] text-[9px] font-bold text-slate-350 font-mono rounded-lg hover:bg-[#0d3420] hover:text-white transition-all cursor-pointer"
                  >
                    + Add Slab Row
                  </button>
                </div>

                {uniForm.slabs.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">
                    No slabs configured. Standard commission values will be used.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {uniForm.slabs.map((slab, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-[#010a06] p-2.5 rounded-xl border border-[#0e3322] text-xs">
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Min Students</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={slab.minStudents}
                              onChange={(e) => updateSlabRow(index, 'minStudents', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Max Students</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Blank for above"
                              value={slab.maxStudents || ''}
                              onChange={(e) => updateSlabRow(index, 'maxStudents', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Type</label>
                            <select
                              value={slab.commissionType}
                              onChange={(e) => updateSlabRow(index, 'commissionType', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none cursor-pointer"
                            >
                              <option value="PERCENT">%</option>
                              <option value="FLAT">Flat ($)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Value</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={slab.commissionValue}
                              onChange={(e) => updateSlabRow(index, 'commissionValue', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSlabRow(index)}
                          className="p-1 text-rose-500 hover:bg-rose-950/30 rounded-lg transition-all mt-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#0e3322]/50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUniModalOpen(false)}
                  className="py-2 px-4 bg-slate-950 hover:bg-slate-900 border border-[#0e3322] text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUni}
                  className="py-2 px-5 bg-[#e2b13c] hover:bg-[#c99b2c] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono disabled:opacity-50"
                >
                  {isSavingUni ? 'Saving...' : 'Save University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
