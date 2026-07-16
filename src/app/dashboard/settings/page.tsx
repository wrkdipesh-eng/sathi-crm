'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Key, 
  Coins, 
  Loader2, 
  X, 
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  UserPlus,
  ClipboardList,
  GraduationCap
} from 'lucide-react';

const ROLES = [
  { value: 'DIRECTOR', label: 'Director (HQ)' },
  { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { value: 'COUNSELOR', label: 'Counselor' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SUB_AGENT', label: 'Sub-agent' }
];

export default function AdminSettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'staff' | 'checklists' | 'universities'>('staff');

  // Core Data
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  // University Management states
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
  });

  // Bulk Import state
  const [bulkText, setBulkText] = useState('');
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Modals & Submits
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchSplit, setNewBranchSplit] = useState('');
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  // Checklist forms states
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<any>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);
  const [checklistForm, setChecklistForm] = useState({
    destinationId: '',
    name: '',
    type: 'PASSPORT'
  });

  // User form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'COUNSELOR',
    branchId: '',
    subAgentCommissionSplit: '0.40'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) throw new Error('Failed to verify session');
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      if (userData.user.role !== 'DIRECTOR') {
        setError('Access Denied: Director privileges are required to view this control panel.');
        setLoading(false);
        return;
      }

      // Fetch admin users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // Fetch branches
      const branchRes = await fetch('/api/branches');
      if (branchRes.ok) {
        const data = await branchRes.json();
        setBranches(data.branches || []);
      }

      // Fetch destinations and checklists
      const destRes = await fetch('/api/admin/destinations');
      if (destRes.ok) {
        const data = await destRes.json();
        setDestinations(data.destinations || []);
      }

      // Fetch partner universities
      await fetchUniversities();
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const res = await fetch('/api/admin/universities');
      if (res.ok) {
        const data = await res.json();
        setUniversities(data.universities || []);
      }
    } catch (err) {
      console.error('Fetch universities error:', err);
    }
  };

  const fetchDestinations = async () => {
    try {
      const res = await fetch('/api/admin/destinations');
      if (res.ok) {
        const data = await res.json();
        setDestinations(data.destinations || []);
      }
    } catch (err) {
      console.error('Error fetching destinations:', err);
    }
  };

  const openAddChecklist = (destinationId: string) => {
    setEditingChecklist(null);
    setChecklistForm({
      destinationId,
      name: '',
      type: 'PASSPORT'
    });
    setChecklistError(null);
    setIsChecklistModalOpen(true);
  };

  const openEditChecklist = (item: any) => {
    setEditingChecklist(item);
    setChecklistForm({
      destinationId: item.destinationId,
      name: item.documentName,
      type: item.documentType
    });
    setChecklistError(null);
    setIsChecklistModalOpen(true);
  };

  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingChecklist(true);
    setChecklistError(null);

    const url = '/api/admin/destinations';
    const method = editingChecklist ? 'PUT' : 'POST';
    const payload = editingChecklist 
      ? { id: editingChecklist.id, name: checklistForm.name, type: checklistForm.type }
      : checklistForm;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save checklist item');

      await fetchDestinations();
      setIsChecklistModalOpen(false);
    } catch (err: any) {
      setChecklistError(err.message || 'An error occurred');
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const handleDeleteChecklist = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this required document? This will not affect existing student profiles but will update new ones.')) return;
    try {
      const res = await fetch(`/api/admin/destinations/${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete checklist item');
      await fetchDestinations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleAddDestination = async () => {
    const countryName = prompt('Enter the name of the new study destination country (e.g. New Zealand, Japan):');
    if (!countryName) return;

    try {
      const res = await fetch('/api/admin/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create destination');

      await fetchDestinations();
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set form values when editing a user
  const openEditUser = (u: any) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '', // Leave blank for password reset
      role: u.role,
      branchId: u.branchId || '',
      subAgentCommissionSplit: u.subAgentCommissionSplit !== null ? u.subAgentCommissionSplit.toString() : '0.40'
    });
    setUserError(null);
    setIsUserModalOpen(true);
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'COUNSELOR',
      branchId: branches[0]?.id || '',
      subAgentCommissionSplit: '0.40'
    });
    setUserError(null);
    setIsUserModalOpen(true);
  };

  // University Submit
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

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uniForm),
      });

      if (res.ok) {
        setIsUniModalOpen(false);
        setEditingUni(null);
        setUniForm({ name: '', country: '', course: '', tuitionFee: '', intakes: '' });
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

  const handleUniDelete = async (uniId: string) => {
    if (!window.confirm("Are you sure you want to delete this partner university listing? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/universities/${uniId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUniversities();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete university.");
      }
    } catch (err) {
      alert("An error occurred.");
    }
  };

  // Bulk Import Universities
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      setBulkError("Please paste some university listings.");
      return;
    }
    setIsImportingBulk(true);
    setBulkError(null);

    try {
      const lines = bulkText.split('\n');
      const parsed: any[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(',');
        if (parts.length >= 3) {
          parsed.push({
            name: parts[0]?.trim(),
            country: parts[1]?.trim(),
            course: parts[2]?.trim(),
            tuitionFee: parts[3]?.trim() || '',
            intakes: parts[4]?.trim() || '',
          });
        }
      }

      if (parsed.length === 0) {
        setBulkError("Could not parse any valid rows. Format: Name, Country, Course, Fee, Intakes");
        setIsImportingBulk(false);
        return;
      }

      const res = await fetch('/api/admin/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        setBulkText('');
        fetchUniversities();
        alert("Universities imported successfully!");
      } else {
        const data = await res.json();
        setBulkError(data.error || "Failed to import bulk listing.");
      }
    } catch (err: any) {
      setBulkError(err.message || "An error occurred.");
    } finally {
      setIsImportingBulk(false);
    }
  };

  // User form submission (Create or Update)
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    setUserError(null);

    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');

      setIsUserModalOpen(false);
      loadData();
      alert(editingUser ? 'Staff member updated!' : 'Staff member registered successfully!');
    } catch (err: any) {
      setUserError(err.message || 'Error occurred');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Delete User
  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      loadData();
      alert('Staff member removed successfully.');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  // Add Branch
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setIsSavingBranch(true);
    setBranchError(null);

    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newBranchName, 
          branchCommissionSplit: newBranchSplit 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create branch');

      setNewBranchName('');
      setNewBranchSplit('');
      loadData();
    } catch (err: any) {
      setBranchError(err.message || 'Error occurred');
    } finally {
      setIsSavingBranch(false);
    }
  };

  // Rename Branch
  const renameBranch = async (branchId: string, oldName: string) => {
    const bObj = branches.find(b => b.id === branchId);
    const oldSplit = bObj?.branchCommissionSplit !== null && bObj?.branchCommissionSplit !== undefined
      ? String(bObj.branchCommissionSplit)
      : '';

    const newName = prompt('Enter new name for branch office:', oldName);
    if (newName === null) return;
    
    const newSplit = prompt('Enter default commission split for this branch (e.g. 0.40 for 40% percentage, or 15000 for flat NPR). Leave blank for none:', oldSplit);
    if (newSplit === null) return;

    try {
      const res = await fetch(`/api/admin/branches/${branchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: (newName.trim() || oldName),
          branchCommissionSplit: newSplit.trim()
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename');

      loadData();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  // Delete Branch
  const deleteBranch = async (branchId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the branch: "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/branches/${branchId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      loadData();
      alert('Branch deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Loading system settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-16 h-16 mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        <Link href="/dashboard" className="inline-block py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-all border border-slate-800">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600" />
            Consultancy Control Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global configurations for branches, staff credentials, and sub-agent commission structures.
          </p>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sub-Tab Navigation */}
        <div className="lg:col-span-3 flex flex-col space-y-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'staff' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Staff & Agents Directory</span>
          </button>
 
          <button
            onClick={() => setActiveSubTab('branches')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'branches' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <Building className="w-4 h-4 text-indigo-500" />
            <span>Branches Configuration</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checklists')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'checklists' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            <span>Document Checklists</span>
          </button>

          <button
            onClick={() => setActiveSubTab('universities')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'universities' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            <span>Partner Universities ({universities.length})</span>
          </button>
        </div>

        {/* Tab Panel contents */}
        <div className="lg:col-span-9">
          
          {/* Tab 1: Staff Directory */}
          {activeSubTab === 'staff' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Staff Registry & Sub-Agents</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Manage logins, change roles, reassign branches, and edit splits.</p>
                </div>
                <button
                  onClick={openAddUser}
                  className="flex items-center space-x-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register User</span>
                </button>
              </div>

              {/* Users table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800/80 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Member Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Assigned Branch</th>
                      <th className="px-4 py-3">Access Role</th>
                      <th className="px-4 py-3">Split Rate</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-350">
                    {users.map((u) => {
                      return (
                        <tr key={u.id} className="hover:bg-slate-850/20 transition-all">
                          <td className="px-4 py-3 font-semibold text-slate-200">{u.name}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{u.email}</td>
                          <td className="px-4 py-3 flex items-center py-4">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
                            <span>{u.branch?.name || 'HQ / None'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-[8px] font-bold uppercase rounded tracking-wide border border-indigo-500/20">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-amber-400">
                            {u.role === 'SUB_AGENT' ? (
                              u.subAgentCommissionSplit !== null ? `${(u.subAgentCommissionSplit * 100).toFixed(0)}%` : '-'
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => openEditUser(u)}
                              className="p-1 rounded bg-slate-800 hover:bg-indigo-900/30 text-indigo-400 border border-slate-700/80 cursor-pointer inline-flex items-center"
                              title="Edit user details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteUser(u.id, u.name)}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-950/30 text-rose-400 border border-slate-700/80 cursor-pointer inline-flex items-center"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Branches Configuration */}
          {activeSubTab === 'branches' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100">Branch Office Configuration</h3>
                <p className="text-[10px] text-slate-400 mt-1">Add, rename, or remove child entities of the organization.</p>
              </div>

              {/* Add Branch Inline Form */}
              <form onSubmit={handleAddBranch} className="p-4 bg-slate-950/40 border border-slate-800/85 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[9px] text-slate-400 font-medium mb-1.5" htmlFor="branchName">
                    New Branch Office Name *
                  </label>
                  <input
                    id="branchName"
                    type="text"
                    required
                    placeholder="e.g. Chitwan Office / Butwal Branch"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-medium mb-1.5" htmlFor="branchSplit">
                    Default split share (NPR or Split rate)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="branchSplit"
                      type="text"
                      placeholder="e.g. 0.40 or 15000"
                      value={newBranchSplit}
                      onChange={(e) => setNewBranchSplit(e.target.value)}
                      className="flex-1 px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isSavingBranch}
                      className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50 shrink-0 h-8"
                    >
                      {isSavingBranch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Add Branch</span>
                    </button>
                  </div>
                </div>
              </form>

              {branchError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[10px]">
                  {branchError}
                </div>
              )}

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((b) => (
                  <div 
                    key={b.id} 
                    className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-200 text-sm block">{b.name}</span>
                        <div className="flex items-center space-x-2 mt-0.5 select-none">
                          <span className="text-[9px] text-slate-500 font-mono">{b.id.slice(0, 8).toUpperCase()}</span>
                          {b.branchCommissionSplit !== null && b.branchCommissionSplit !== undefined && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold font-mono rounded">
                              Split: {b.branchCommissionSplit >= 1 ? `Rs. ${b.branchCommissionSplit.toLocaleString()}` : `${Math.round(b.branchCommissionSplit * 100)}%`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1.5 shrink-0">
                      <button
                        onClick={() => renameBranch(b.id, b.name)}
                        className="p-1 rounded bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
                        title="Rename Branch"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBranch(b.id, b.name)}
                        className="p-1 rounded bg-slate-850 border border-slate-800 text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'checklists' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Dynamic Visa Document Checklists</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Manage standard document requirements copied to students upon intake by destination country.</p>
                </div>
                <button
                  onClick={handleAddDestination}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>Add Destination Country</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {destinations.map((dest) => (
                  <div key={dest.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-slate-200 text-xs">{dest.countryName} Checklist</span>
                      </div>
                      <button
                        onClick={() => openAddChecklist(dest.id)}
                        className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-slate-950 text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-950" />
                        <span>Add Doc</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dest.checklists.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No required documents configured.</p>
                      ) : (
                        dest.checklists.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                            <div>
                              <span className="text-xs text-slate-200 font-semibold block">{item.documentName}</span>
                              <span className="text-[9px] text-slate-550 font-mono block mt-0.5 uppercase tracking-wider">{item.documentType.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => openEditChecklist(item)}
                                className="p-1 rounded bg-slate-850 border border-slate-800 text-indigo-400 hover:bg-indigo-900/30 cursor-pointer"
                                title="Edit item"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteChecklist(item.id)}
                                className="p-1 rounded bg-slate-850 border border-slate-800 text-rose-500 hover:bg-rose-50 cursor-pointer"
                                title="Delete item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'universities' && (
            <div className="space-y-6">
              
              {/* Top Control Panel */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 font-mono tracking-tight flex items-center">
                      <GraduationCap className="w-5 h-5 mr-1.5 text-indigo-500" />
                      Partner Universities Management
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">Add, update, or paste lists of universities you represent to use in applicant profile setups.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUni(null);
                      setUniForm({ name: '', country: '', course: '', tuitionFee: '', intakes: '' });
                      setUniError(null);
                      setIsUniModalOpen(true);
                    }}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-950" />
                    <span>Add University</span>
                  </button>
                </div>

                {/* Bulk Import Section */}
                <details className="group border border-slate-800 rounded-xl bg-slate-950/20 overflow-hidden">
                  <summary className="px-4 py-3 text-xs font-semibold text-slate-350 cursor-pointer hover:bg-slate-850/55 select-none transition-all flex justify-between items-center font-mono">
                    <span>⚡ Excel / CSV Copy-Paste Bulk Importer</span>
                    <span className="text-[10px] text-indigo-500 group-open:hidden">Show Importer</span>
                    <span className="text-[10px] text-indigo-500 hidden group-open:inline">Hide Importer</span>
                  </summary>
                  <form onSubmit={handleBulkImport} className="p-4 border-t border-slate-800 space-y-3">
                    {bulkError && <div className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">{bulkError}</div>}
                    <div>
                      <label className="block text-[10px] text-slate-400 font-medium mb-1.5">Paste comma-separated rows (Format: `Name, Country, Course, Fee, Intakes` - One row per line)</label>
                      <textarea
                        rows={4}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="York University, Canada, MBA, CAD 24000 / Year, Jan Sept&#10;UTS, Australia, Master of IT, AUD 38000 / Year, Feb July Nov"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isImportingBulk}
                        className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isImportingBulk ? 'Importing...' : 'Bulk Import Listings'}
                      </button>
                    </div>
                  </form>
                </details>
              </div>

              {/* Universities Table */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Active Representation List ({universities.length} programs)</h4>
                
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">University Name</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Course / Degree</th>
                        <th className="px-4 py-3">Tuition Fee</th>
                        <th className="px-4 py-3">Intakes</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-350">
                      {universities.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            No represented universities listed. Add one manually or use the bulk importer above to populate.
                          </td>
                        </tr>
                      ) : (
                        universities.map((uni) => (
                          <tr key={uni.id} className="hover:bg-slate-850/30 transition-all">
                            <td className="px-4 py-3.5 font-bold text-slate-100">{uni.name}</td>
                            <td className="px-4 py-3.5 font-semibold text-indigo-500">{uni.country}</td>
                            <td className="px-4 py-3.5">{uni.course}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">{uni.tuitionFee || 'N/A'}</td>
                            <td className="px-4 py-3.5 text-slate-400">{uni.intakes || 'N/A'}</td>
                            <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingUni(uni);
                                  setUniForm({
                                    name: uni.name,
                                    country: uni.country,
                                    course: uni.course,
                                    tuitionFee: uni.tuitionFee || '',
                                    intakes: uni.intakes || '',
                                  });
                                  setUniError(null);
                                  setIsUniModalOpen(true);
                                }}
                                className="p-1.5 rounded bg-slate-850 border border-slate-800 text-indigo-400 hover:bg-indigo-900/30 cursor-pointer inline-flex items-center"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUniDelete(uni.id)}
                                className="p-1.5 rounded bg-slate-850 border border-slate-800 text-rose-500 hover:bg-rose-50 cursor-pointer inline-flex items-center"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* User Modal (Create/Update) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm">
                  {editingUser ? `Update Account: ${editingUser.name}` : 'Register New Staff Member'}
                </h3>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              {userError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {userError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5" htmlFor="regName">
                    Full Name *
                  </label>
                  <input
                    id="regName"
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5" htmlFor="regEmail">
                    Email Address *
                  </label>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5" htmlFor="regPass">
                    {editingUser ? 'Reset Password (optional)' : 'Account Password *'}
                  </label>
                  <input
                    id="regPass"
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to retain current' : '••••••••'}
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                    Access Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3 mt-2">
                {/* Branch Assignment - disabled for Directors & Sub-agents */}
                {userForm.role !== 'DIRECTOR' && userForm.role !== 'SUB_AGENT' ? (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                      Assign Branch Office *
                    </label>
                    <select
                      value={userForm.branchId}
                      required
                      onChange={(e) => setUserForm(prev => ({ ...prev, branchId: e.target.value }))}
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
                    <label className="block text-[10px] text-slate-500 font-medium mb-1.5 select-none">
                      Branch Assignment
                    </label>
                    <div className="px-3 py-2 bg-slate-950/40 border border-slate-800/40 rounded-xl text-slate-650 text-xs select-none">
                      Not Applicable
                    </div>
                  </div>
                )}

                {/* Sub-agent split rate */}
                {userForm.role === 'SUB_AGENT' ? (
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5" htmlFor="regSplit">
                      Sub-Agent Split Rate (Percentage) *
                    </label>
                    <input
                      id="regSplit"
                      type="text"
                      required
                      value={userForm.subAgentCommissionSplit}
                      onChange={(e) => setUserForm(prev => ({ ...prev, subAgentCommissionSplit: e.target.value }))}
                      placeholder="e.g. 0.40 for 40%"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1.5 select-none">
                      Commission Split
                    </label>
                    <div className="px-3 py-2 bg-slate-950/40 border border-slate-800/40 rounded-xl text-slate-650 text-xs select-none">
                      Not Applicable
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingUser ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingUser ? 'Save Changes' : 'Register Account'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* University Modal (Create/Update) */}
      {isUniModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100 font-mono">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm">
                  {editingUni ? `Edit Listing: ${editingUni.name}` : 'Add Represented University'}
                </h3>
              </div>
              <button
                onClick={() => setIsUniModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUniSubmit} className="p-6 space-y-4">
              {uniError && <div className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">{uniError}</div>}
              
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">University Name *</label>
                <input
                  type="text"
                  required
                  value={uniForm.name}
                  onChange={(e) => setUniForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. York University"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
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
                    placeholder="e.g. Canada"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Course / Program *</label>
                  <input
                    type="text"
                    required
                    value={uniForm.course}
                    onChange={(e) => setUniForm(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="e.g. MBA"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
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
                    placeholder="e.g. CAD 24,000 / Year"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Intake Months</label>
                  <input
                    type="text"
                    value={uniForm.intakes}
                    onChange={(e) => setUniForm(prev => ({ ...prev, intakes: e.target.value }))}
                    placeholder="e.g. Jan, Sept"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUniModalOpen(false)}
                  className="py-2 px-4 bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUni}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer font-mono disabled:opacity-50"
                >
                  {isSavingUni ? 'Saving...' : 'Save University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checklist Item Modal (Create/Update) */}
      {isChecklistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-slate-100">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm">
                  {editingChecklist ? 'Edit Checklist Document' : 'Add Required Document'}
                </h3>
              </div>
              <button 
                onClick={() => setIsChecklistModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-205 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleChecklistSubmit} className="p-6 space-y-4">
              {checklistError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                  {checklistError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport copy, IELTS Marksheet"
                  value={checklistForm.name}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Document Category / Type</label>
                <select
                  value={checklistForm.type}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-350 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="PASSPORT">Passport (PASSPORT)</option>
                  <option value="NOC">No Objection Certificate (NOC)</option>
                  <option value="BANK_STATEMENT">Bank Statement (BANK_STATEMENT)</option>
                  <option value="EDUCATION_LOAN">Education Loan (EDUCATION_LOAN)</option>
                  <option value="ACADEMIC_TRANSCRIPT">Academic Transcript (ACADEMIC_TRANSCRIPT)</option>
                  <option value="OTHER">Other / General (OTHER)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingChecklist}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingChecklist ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingChecklist ? 'Save Changes' : 'Add Document'}</span>
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
