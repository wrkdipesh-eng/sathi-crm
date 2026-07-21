'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  GraduationCap,
  Palette,
  Globe,
  BookOpen,
  School,
  Compass
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

  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'staff' | 'checklists' | 'universities' | 'branding'>('staff');

  // Core Data
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  // Branding Customization state
  const [orgForm, setOrgForm] = useState({
    name: '',
    tagline: '',
    logoUrl: '',
    logoIcon: 'Globe',
    themePalette: 'dark-emerald',
  });

  const [customThemeColors, setCustomThemeColors] = useState({
    bg: '#020a06',
    card: '#051810',
    accent: '#d4af37',
    graph: '#10b981',
    text: '#ffffff',
  });

  const applyThemeColors = (themePalette: string, colors = customThemeColors) => {
    document.documentElement.setAttribute('data-theme', themePalette);
    if (themePalette === 'light-executive') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    if (themePalette === 'custom') {
      const graphColor = colors.graph || colors.accent;
      document.documentElement.style.setProperty('--background', colors.bg);
      document.documentElement.style.setProperty('--foreground', colors.text);
      document.documentElement.style.setProperty('--card', colors.card);
      document.documentElement.style.setProperty('--primary', colors.accent);
      document.documentElement.style.setProperty('--accent', graphColor);
      document.documentElement.style.setProperty('--graph-color', graphColor);

      document.documentElement.style.setProperty('--slate-950', colors.bg);
      document.documentElement.style.setProperty('--slate-900', colors.card);
      document.documentElement.style.setProperty('--slate-850', colors.card);
      document.documentElement.style.setProperty('--slate-800', colors.accent + '40');
      document.documentElement.style.setProperty('--slate-100', colors.text);
      document.documentElement.style.setProperty('--slate-50', colors.text);
    } else {
      document.documentElement.style.removeProperty('--background');
      document.documentElement.style.removeProperty('--foreground');
      document.documentElement.style.removeProperty('--card');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--graph-color');
      document.documentElement.style.removeProperty('--slate-950');
      document.documentElement.style.removeProperty('--slate-900');
      document.documentElement.style.removeProperty('--slate-850');
      document.documentElement.style.removeProperty('--slate-800');
      document.documentElement.style.removeProperty('--slate-100');
      document.documentElement.style.removeProperty('--slate-50');
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('organization_theme_palette') || 'dark-emerald';
    const savedCustom = localStorage.getItem('organization_custom_theme_colors');
    let colorsObj = customThemeColors;
    if (savedCustom) {
      try {
        colorsObj = JSON.parse(savedCustom);
        setCustomThemeColors(colorsObj);
      } catch (e) {}
    }
    setOrgForm(prev => ({ ...prev, themePalette: savedTheme }));
    applyThemeColors(savedTheme, colorsObj);
  }, []);
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

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
    commissionPercentage: '',
    type: 'DIRECT',
    portalName: '',
    baseCommissionType: 'PERCENT',
    baseCommissionValue: '',
    bonusType: 'NONE',
    bonusValue: '',
    slabs: [] as any[],
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

  // Group universities by name + country
  const groupedUnis = useMemo(() => {
    const groups: Record<string, { name: string; country: string; programs: any[] }> = {};
    universities.forEach(uni => {
      const key = `${uni.name.trim()}|${uni.country.trim()}`;
      if (!groups[key]) {
        groups[key] = {
          name: uni.name.trim(),
          country: uni.country.trim(),
          programs: [],
        };
      }
      groups[key].programs.push(uni);
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [universities]);

  const existingUniversities = useMemo(() => {
    const list: { name: string; country: string }[] = [];
    const seen = new Set<string>();
    universities.forEach(u => {
      const key = u.name.trim();
      if (!seen.has(key.toLowerCase())) {
        seen.add(key.toLowerCase());
        list.push({ name: u.name.trim(), country: u.country.trim() });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [universities]);

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

      // Fetch organization settings
      const orgRes = await fetch('/api/admin/organization');
      if (orgRes.ok) {
        const data = await orgRes.json();
        if (data.organization) {
          setOrgForm(prev => ({
            ...prev,
            name: data.organization.name || '',
            tagline: data.organization.tagline || '',
            logoUrl: data.organization.logoUrl || '',
            logoIcon: data.organization.logoIcon || 'Globe',
          }));
        }
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

  const addSlabRow = () => {
    setUniForm(prev => {
      const nextMin = prev.slabs.length === 0 
        ? 1 
        : (parseInt(prev.slabs[prev.slabs.length - 1].maxStudents) || 1) + 1;
      return {
        ...prev,
        slabs: [
          ...prev.slabs,
          { minStudents: nextMin, maxStudents: '', commissionType: 'PERCENT', commissionValue: '', bonusType: 'NONE', bonusValue: '' }
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

    const formattedSlabs = uniForm.slabs.map((slab: any) => ({
      minStudents: parseInt(slab.minStudents) || 1,
      maxStudents: slab.maxStudents ? parseInt(slab.maxStudents) : null,
      commissionType: slab.commissionType,
      commissionValue: parseFloat(slab.commissionValue) || 0,
      bonusType: slab.bonusType || 'NONE',
      bonusValue: slab.bonusValue ? parseFloat(slab.bonusValue) : 0,
    }));

    const payload = {
      ...uniForm,
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
          const parsedType = parts[6]?.trim().toUpperCase();
          const type = parsedType === 'PORTAL' ? 'PORTAL' : 'DIRECT';
          const portalName = type === 'PORTAL' ? (parts[7]?.trim() || '') : '';
          parsed.push({
            name: parts[0]?.trim(),
            country: parts[1]?.trim(),
            course: parts[2]?.trim(),
            tuitionFee: parts[3]?.trim() || '',
            intakes: parts[4]?.trim() || '',
            commissionPercentage: parts[5]?.trim() && !isNaN(parseFloat(parts[5].trim())) ? parseFloat(parts[5].trim()) : null,
            type,
            portalName,
          });
        }
      }

      if (parsed.length === 0) {
        setBulkError("Could not parse any valid rows. Format: Name, Country, Course, Fee, Intakes, Commission %");
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

  // Update Organization Branding
  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name.trim()) {
      setOrgError('Organization Name is required.');
      return;
    }
    setIsSavingOrg(true);
    setOrgError(null);

    try {
      localStorage.setItem('organization_theme_palette', orgForm.themePalette);
      localStorage.setItem('organization_custom_theme_colors', JSON.stringify(customThemeColors));
      applyThemeColors(orgForm.themePalette, customThemeColors);

      const res = await fetch('/api/admin/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update organization profile');

      alert('Organization profile, branding, and theme updated successfully!');
      window.location.reload();
    } catch (err: any) {
      setOrgError(err.message || 'Error occurred while saving branding');
    } finally {
      setIsSavingOrg(false);
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

          <button
            onClick={() => setActiveSubTab('branding')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'branding' 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
            }`}
          >
            <Palette className="w-4 h-4 text-indigo-500" />
            <span>Organization Branding</span>
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
              <form onSubmit={handleAddBranch} className="p-4 bg-slate-950/40 border border-slate-800/85 rounded-2xl flex gap-4 items-end">
                <div className="flex-1">
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
                <button
                  type="submit"
                  disabled={isSavingBranch}
                  className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50 shrink-0 h-8"
                >
                  {isSavingBranch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Branch</span>
                </button>
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
                      setUniForm({ name: '', country: '', course: '', tuitionFee: '', intakes: '', commissionPercentage: '', type: 'DIRECT', portalName: '', baseCommissionType: 'PERCENT', baseCommissionValue: '', bonusType: 'NONE', bonusValue: '', slabs: [] });
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
                      <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Paste comma-separated rows (Format: `Name, Country, Course, Fee, Intakes, Commission %, [Type], [Portal Name]` - One row per line)</label>
                      <textarea
                        rows={4}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="York University, Canada, MBA, CAD 24000 / Year, Jan Sept, 15, PORTAL, ApplyBoard&#10;UTS, Australia, Master of IT, AUD 38000 / Year, Feb July Nov, 12.5, DIRECT"
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

              {/* Grouped Universities Representation List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Represented Universities & Programs ({universities.length} total)</h4>
                </div>

                {groupedUnis.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                    No represented universities listed. Add one manually or use the bulk importer above to populate.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedUnis.map((group, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        {/* Group Header Card */}
                        <div className="px-5 py-3.5 bg-slate-950/40 border-b border-slate-800/80 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-xs text-slate-100 font-sans tracking-wide">{group.name}</h4>
                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider font-mono mt-0.5 inline-block">{group.country}</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingUni(null);
                               setUniForm({
                                name: group.name,
                                country: group.country,
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
                                slabs: [],
                              });
                              setUniError(null);
                              setIsUniModalOpen(true);
                            }}
                            className="flex items-center space-x-1 py-1 px-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[9px] font-bold rounded-lg transition-all cursor-pointer font-mono"
                          >
                            <Plus className="w-3 h-3 text-indigo-400" />
                            <span>Add Program</span>
                          </button>
                        </div>

                        {/* Programs Nested Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/20 border-b border-slate-850 text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                                <th className="px-5 py-2.5">Course / Program</th>
                                <th className="px-5 py-2.5">Type</th>
                                <th className="px-5 py-2.5">Tuition Fee</th>
                                <th className="px-5 py-2.5 text-center">Comm %</th>
                                <th className="px-5 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/60 text-slate-350">
                              {group.programs.map((uni) => (
                                <tr key={uni.id} className="hover:bg-slate-850/25 transition-all">
                                  <td className="px-5 py-3 font-semibold text-slate-200">{uni.course}</td>
                                  <td className="px-5 py-3">
                                    {uni.type === 'PORTAL' ? (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-950 text-purple-400 border border-purple-900/50" title={uni.portalName || "Portal"}>
                                        PORTAL: {uni.portalName || 'N/A'}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-950 text-sky-400 border border-sky-900/50">
                                        DIRECT
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3 font-mono text-[10px] text-slate-400">{uni.tuitionFee || 'N/A'}</td>
                                  <td className="px-5 py-3 text-slate-400">{uni.intakes || 'N/A'}</td>
                                  <td className="px-5 py-3 text-center font-mono font-bold text-emerald-400">
                                    {uni.commissionPercentage !== null && uni.commissionPercentage !== undefined ? `${uni.commissionPercentage}%` : 'N/A'}
                                  </td>
                                  <td className="px-5 py-3 text-right space-x-1.5 whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        setEditingUni(uni);
                                        setUniForm({
                                          name: uni.name,
                                          country: uni.country,
                                          course: uni.course,
                                          tuitionFee: uni.tuitionFee || '',
                                          intakes: uni.intakes || '',
                                          commissionPercentage: uni.commissionPercentage !== null && uni.commissionPercentage !== undefined ? uni.commissionPercentage.toString() : '',
                                          type: uni.type || 'DIRECT',
                                          portalName: uni.portalName || '',
                                          baseCommissionType: uni.baseCommissionType || 'PERCENT',
                                          baseCommissionValue: uni.baseCommissionValue !== null && uni.baseCommissionValue !== undefined ? uni.baseCommissionValue.toString() : '',
                                          bonusType: uni.bonusType || 'NONE',
                                          bonusValue: uni.bonusValue !== null && uni.bonusValue !== undefined ? uni.bonusValue.toString() : '',
                                          slabs: Array.isArray(uni.slabs) ? uni.slabs : [],
                                        });
                                        setUniError(null);
                                        setIsUniModalOpen(true);
                                      }}
                                      className="p-1 rounded bg-slate-850 border border-slate-800 text-indigo-400 hover:bg-indigo-900/20 cursor-pointer inline-flex items-center"
                                      title="Edit Program"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleUniDelete(uni.id)}
                                      className="p-1 rounded bg-slate-850 border border-slate-800 text-rose-500 hover:bg-rose-900/20 cursor-pointer inline-flex items-center"
                                      title="Delete Program"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'branding' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100">Organization Branding & Customization</h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure your consultancy's logo and name displayed across the system panels.</p>
              </div>

              {orgError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-455 text-[10px]">
                  {orgError}
                </div>
              )}

              <form onSubmit={handleOrgSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Input Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider" htmlFor="orgName">
                        Consultancy / Organization Name *
                      </label>
                      <input
                        id="orgName"
                        type="text"
                        required
                        placeholder="e.g. Thinkcone CRM"
                        value={orgForm.name}
                        onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider" htmlFor="orgTagline">
                        Subtitle / Tagline
                      </label>
                      <input
                        id="orgTagline"
                        type="text"
                        placeholder="e.g. Thinkcone Study Abroad"
                        value={orgForm.tagline}
                        onChange={(e) => setOrgForm({ ...orgForm, tagline: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider" htmlFor="orgLogoIcon">
                        Default Logo Preset Icon (When no custom image is set)
                      </label>
                      <select
                        id="orgLogoIcon"
                        value={orgForm.logoIcon}
                        onChange={(e) => setOrgForm({ ...orgForm, logoIcon: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Globe">Globe</option>
                        <option value="GraduationCap">Graduation Cap</option>
                        <option value="BookOpen">Book Open</option>
                        <option value="School">School / University</option>
                        <option value="Compass">Compass</option>
                        <option value="ShieldCheck">Shield Check</option>
                        <option value="Building">Building / HQ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider" htmlFor="orgLogoUrl">
                        Custom Logo Image URL (Overrides preset icon)
                      </label>
                      <input
                        id="orgLogoUrl"
                        type="url"
                        placeholder="e.g. https://example.com/logo.png"
                        value={orgForm.logoUrl}
                        onChange={(e) => setOrgForm({ ...orgForm, logoUrl: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-[9px] text-slate-500 mt-1 block">Paste an image link or base64 data URI here (PNG, JPG, SVG supported).</span>
                    </div>
                  </div>

                  {/* Live Sidebar Preview */}
                  <div className="flex flex-col justify-center items-center p-6 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Sidebar Header Preview</span>
                    
                    <div className="w-full max-w-[270px] p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center space-x-3 shadow-lg select-none">
                      {orgForm.logoUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 p-0.5 shadow-sm">
                          <img src={orgForm.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      ) : (
                        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shrink-0 flex items-center justify-center">
                          {(() => {
                            switch (orgForm.logoIcon) {
                              case 'GraduationCap': return <GraduationCap className="w-6 h-6 text-white" />;
                              case 'BookOpen': return <BookOpen className="w-6 h-6 text-white" />;
                              case 'School': return <School className="w-6 h-6 text-white" />;
                              case 'Compass': return <Compass className="w-6 h-6 text-white" />;
                              case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-white" />;
                              case 'Building': return <Building className="w-6 h-6 text-white" />;
                              default: return <Globe className="w-6 h-6 text-white" />;
                            }
                          })()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h2 className="font-bold text-xs text-slate-100 truncate max-w-[175px]" title={orgForm.name || 'Thinkcone CRM'}>
                          {orgForm.name || 'Thinkcone CRM'}
                        </h2>
                        <span className="text-[9px] text-slate-400 font-medium tracking-wide block truncate max-w-[175px]" title={orgForm.tagline || 'Thinkcone Study Abroad'}>
                          {orgForm.tagline || 'Thinkcone Study Abroad'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Theme & Color Palette Selector Grid */}
                  <div className="pt-6 border-t border-slate-800 space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Organization System Theme & Brand Color Palette *
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Select the official primary theme color scheme for your organization's CRM portal across all staff & branch accounts.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      
                      {/* Theme Option 1: Dark Emerald & Gold (Dark Green, Yellow & White) */}
                      <button
                        type="button"
                        onClick={() => {
                          setOrgForm(prev => ({ ...prev, themePalette: 'dark-emerald' }));
                          document.documentElement.setAttribute('data-theme', 'dark-emerald');
                          document.documentElement.classList.add('dark');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                          orgForm.themePalette === 'dark-emerald'
                            ? 'bg-[#051810] border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100">Dark Green & Gold</span>
                          {orgForm.themePalette === 'dark-emerald' && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#020a06] border border-[#0d3d29]" title="Background: Dark Green" />
                          <span className="w-5 h-5 rounded-full bg-[#051810] border border-emerald-500/40" title="Card: Forest" />
                          <span className="w-5 h-5 rounded-full bg-yellow-500" title="Accent: Yellow Gold" />
                          <span className="w-5 h-5 rounded-full bg-white" title="Text: Crisp White" />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Dark Green, Yellow & White (Thinkcone Default)</span>
                      </button>

                      {/* Theme Option 2: Dark Slate & Cyan */}
                      <button
                        type="button"
                        onClick={() => {
                          setOrgForm(prev => ({ ...prev, themePalette: 'dark-slate' }));
                          document.documentElement.setAttribute('data-theme', 'dark-slate');
                          document.documentElement.classList.add('dark');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                          orgForm.themePalette === 'dark-slate'
                            ? 'bg-[#0f172a] border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100">Dark Slate & Cyan</span>
                          {orgForm.themePalette === 'dark-slate' && (
                            <CheckCircle className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#020617] border border-[#1e293b]" title="Background: Slate" />
                          <span className="w-5 h-5 rounded-full bg-[#0f172a] border border-slate-700" title="Card: Navy" />
                          <span className="w-5 h-5 rounded-full bg-cyan-400" title="Accent: Electric Cyan" />
                          <span className="w-5 h-5 rounded-full bg-white" title="Text: Crisp White" />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Obsidian Navy, Cyan & White</span>
                      </button>

                      {/* Theme Option 3: Dark Royal Purple & Amber */}
                      <button
                        type="button"
                        onClick={() => {
                          setOrgForm(prev => ({ ...prev, themePalette: 'dark-purple' }));
                          document.documentElement.setAttribute('data-theme', 'dark-purple');
                          document.documentElement.classList.add('dark');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                          orgForm.themePalette === 'dark-purple'
                            ? 'bg-[#140728] border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100">Dark Royal Purple</span>
                          {orgForm.themePalette === 'dark-purple' && (
                            <CheckCircle className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#090314] border border-[#2e1059]" title="Background: Midnight Purple" />
                          <span className="w-5 h-5 rounded-full bg-[#140728] border border-purple-800" title="Card: Royal Purple" />
                          <span className="w-5 h-5 rounded-full bg-amber-400" title="Accent: Warm Amber" />
                          <span className="w-5 h-5 rounded-full bg-white" title="Text: Crisp White" />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Midnight Purple, Amber & White</span>
                      </button>

                      {/* Theme Option 4: Executive Light Mode */}
                      <button
                        type="button"
                        onClick={() => {
                          setOrgForm(prev => ({ ...prev, themePalette: 'light-executive' }));
                          applyThemeColors('light-executive');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                          orgForm.themePalette === 'light-executive'
                            ? 'bg-slate-100 border-emerald-600 ring-2 ring-emerald-500/30 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">Executive Light Mode</span>
                          {orgForm.themePalette === 'light-executive' && (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300" title="Background: Light" />
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-300" title="Card: White" />
                          <span className="w-5 h-5 rounded-full bg-emerald-600" title="Accent: Emerald" />
                          <span className="w-5 h-5 rounded-full bg-slate-900" title="Text: Dark" />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Clean Executive Light Theme</span>
                      </button>

                      {/* Theme Option 5: Custom Theme Color Picker */}
                      <button
                        type="button"
                        onClick={() => {
                          setOrgForm(prev => ({ ...prev, themePalette: 'custom' }));
                          applyThemeColors('custom', customThemeColors);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                          orgForm.themePalette === 'custom'
                            ? 'bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100 flex items-center">
                            <Palette className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                            Custom Brand Colors
                          </span>
                          {orgForm.themePalette === 'custom' && (
                            <CheckCircle className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-full border border-slate-700 shadow-sm" style={{ backgroundColor: customThemeColors.bg }} title="Background" />
                          <span className="w-5 h-5 rounded-full border border-slate-700 shadow-sm" style={{ backgroundColor: customThemeColors.card }} title="Card Surface" />
                          <span className="w-5 h-5 rounded-full border border-slate-700 shadow-sm" style={{ backgroundColor: customThemeColors.accent }} title="Accent" />
                          <span className="w-5 h-5 rounded-full border border-slate-700 shadow-sm" style={{ backgroundColor: customThemeColors.text }} title="Text" />
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">Pick Custom Brand Colors (Real-Time Live)</span>
                      </button>

                    </div>

                    {/* Custom Color Picker Panel */}
                    {orgForm.themePalette === 'custom' && (
                      <div className="p-5 bg-slate-950/80 border border-indigo-500/30 rounded-2xl space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center space-x-2">
                            <Palette className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Custom Color Palette Editor</h4>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-mono italic">✨ Live Real-Time Preview Active</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                          
                          {/* Color 1: Background */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Background Color
                            </label>
                            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                              <input
                                type="color"
                                value={customThemeColors.bg}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, bg: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                              />
                              <input
                                type="text"
                                value={customThemeColors.bg}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, bg: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                          {/* Color 2: Card / Container */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Card / Surface Color
                            </label>
                            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                              <input
                                type="color"
                                value={customThemeColors.card}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, card: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                              />
                              <input
                                type="text"
                                value={customThemeColors.card}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, card: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                          {/* Color 3: Primary Highlight (Buttons & Active Subtabs) */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Button & Tab Highlight
                            </label>
                            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                              <input
                                type="color"
                                value={customThemeColors.accent}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, accent: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                              />
                              <input
                                type="text"
                                value={customThemeColors.accent}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, accent: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                          {/* Color 4: Icon & Graph Highlight */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Icon & Graph Accent
                            </label>
                            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                              <input
                                type="color"
                                value={customThemeColors.graph || customThemeColors.accent}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, graph: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                              />
                              <input
                                type="text"
                                value={customThemeColors.graph || customThemeColors.accent}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, graph: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                          {/* Color 5: Text / Typography */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Text / Font Color
                            </label>
                            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                              <input
                                type="color"
                                value={customThemeColors.text}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, text: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                              />
                              <input
                                type="text"
                                value={customThemeColors.text}
                                onChange={(e) => {
                                  const updated = { ...customThemeColors, text: e.target.value };
                                  setCustomThemeColors(updated);
                                  applyThemeColors('custom', updated);
                                }}
                                className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      type="submit"
                      disabled={isSavingOrg}
                      className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      {isSavingOrg ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Updating Branding...</span>
                        </>
                      ) : (
                        <span>Save Branding Settings</span>
                      )}
                    </button>
                  </div>
                </form>
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

              {userForm.role !== 'DIRECTOR' && userForm.role !== 'SUB_AGENT' && (
                <div className="border-t border-slate-850 pt-3 mt-2">
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
              )}

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

            <form onSubmit={handleUniSubmit} className="p-6 space-y-4 overflow-y-auto">
              {uniError && <div className="text-[10px] text-rose-550 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">{uniError}</div>}
              
              <div>
                <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">University Name *</label>
                <input
                  type="text"
                  required
                  list="existing-unis"
                  value={uniForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = existingUniversities.find(eu => eu.name.toLowerCase() === val.toLowerCase());
                    setUniForm(prev => ({
                      ...prev,
                      name: val,
                      country: matched ? matched.country : prev.country,
                    }));
                  }}
                  placeholder="e.g. York University"
                  className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360]"
                />
                <datalist id="existing-unis">
                  {existingUniversities.map((eu, idx) => (
                    <option key={idx} value={eu.name}>{eu.country}</option>
                  ))}
                </datalist>
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
                    placeholder="e.g. MBA"
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
                    placeholder="e.g. CAD 24,000 / Year"
                    className="w-full px-3 py-2 bg-[#010a06] border border-[#0e3322] rounded-xl text-slate-200 text-xs focus:outline-none focus:border-[#1ca360] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5 font-mono">Intake Months</label>
                  <input
                    type="text"
                    value={uniForm.intakes}
                    onChange={(e) => setUniForm(prev => ({ ...prev, intakes: e.target.value }))}
                    placeholder="e.g. Jan, Sept"
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
                    placeholder="e.g. 15.00"
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
                    placeholder={uniForm.bonusType === 'NONE' ? 'Disabled' : 'e.g. 500'}
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
                    placeholder={uniForm.type !== 'PORTAL' ? 'N/A' : 'e.g. ApplyBoard'}
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
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-6 gap-2 font-mono">
                          <div>
                            <label className="block text-[8px] text-slate-400 font-medium mb-0.5">Min Students</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={slab.minStudents}
                              onChange={(e) => updateSlabRow(index, 'minStudents', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none"
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
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none"
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
                            <label className="block text-[8px] text-emerald-400 font-medium mb-0.5">Value</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={slab.commissionValue}
                              onChange={(e) => updateSlabRow(index, 'commissionValue', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-bold text-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-indigo-300 font-medium mb-0.5">Bonus Type</label>
                            <select
                              value={slab.bonusType || 'NONE'}
                              onChange={(e) => updateSlabRow(index, 'bonusType', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none cursor-pointer"
                            >
                              <option value="NONE">None</option>
                              <option value="PERCENT">% Bonus</option>
                              <option value="FLAT">Flat Bonus ($)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-indigo-300 font-medium mb-0.5">Bonus Value</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={(slab.bonusType || 'NONE') === 'NONE'}
                              placeholder={(slab.bonusType || 'NONE') === 'NONE' ? '-' : 'e.g. 1000'}
                              value={slab.bonusValue || ''}
                              onChange={(e) => updateSlabRow(index, 'bonusValue', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-none font-bold text-indigo-300 disabled:opacity-40"
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
