'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  UserCheck, 
  Loader2,
  GraduationCap,
  BookOpen,
  School,
  Compass,
  Building,
  Globe,
  Users,
  ClipboardList,
  Wallet
} from 'lucide-react';

const TEST_ACCOUNTS = [
  { label: 'Director (HQ)', email: 'director@thinkcone.com.np', role: 'DIRECTOR', desc: 'HQ roll-up (all branches)' },
  { label: 'KTM Manager', email: 'ktm.mgr@thinkcone.com.np', role: 'BRANCH_MANAGER', desc: 'Kathmandu data only' },
  { label: 'Pokhara Manager', email: 'pokhara.mgr@thinkcone.com.np', role: 'BRANCH_MANAGER', desc: 'Pokhara data only' },
  { label: 'KTM Counselor', email: 'counselor.ktm1@thinkcone.com.np', role: 'COUNSELOR', desc: 'Assigned students only' },
  { label: 'Sub-agent Ram', email: 'subagent.ram@thinkcone.com.np', role: 'SUB_AGENT', desc: 'Only self-submitted leads' },
];

const getIconComponent = (iconName: string | null) => {
  switch (iconName) {
    case 'GraduationCap': return GraduationCap;
    case 'BookOpen': return BookOpen;
    case 'School': return School;
    case 'Compass': return Compass;
    case 'ShieldCheck': return ShieldCheck;
    case 'Building': return Building;
    default: return Globe;
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Default from seed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState({
    name: 'Thinkcone CRM',
    tagline: '',
    logoUrl: null as string | null,
    logoIcon: 'ShieldCheck' as string | null,
  });

  // Fetch organization settings
  useEffect(() => {
    async function fetchOrgInfo() {
      try {
        const res = await fetch('/api/public/organization');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.organization) {
            setOrg({
              name: data.organization.name,
              tagline: data.organization.tagline || '',
              logoUrl: data.organization.logoUrl,
              logoIcon: data.organization.logoIcon,
            });
          }
        }
      } catch (e) {
        // Safe to ignore
      }
    }
    fetchOrgInfo();
  }, []);

  // Check if already logged in
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.replace('/dashboard');
        }
      } catch (e) {
        // Safe to ignore
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const fillCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 text-slate-100 px-4">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/30 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-200/30 blur-[120px]" />

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 z-10 my-8">
        
        {/* Left Side: Product Intro */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-5 text-left">
          
          <div className="flex items-center space-x-3">
            {org.logoUrl ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 p-1 shadow-lg">
                <img src={org.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            ) : (
              <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/30 shrink-0">
                {React.createElement(getIconComponent(org.logoIcon), { className: "w-8 h-8 text-white" })}
              </div>
            )}
            <span className="text-xl font-extrabold tracking-tight text-white truncate max-w-[180px]" title={org.name}>
              {org.name}
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold tracking-wider uppercase w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Student Success CRM</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {org.name}
              <span className="block mt-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-2xl md:text-3xl font-black">
                CRM Portal
              </span>
            </h1>
            
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {org.tagline || 'Designed for Nepali consultancies to manage branch operations, tracking applications from initial inquiry through visa decisions, document management, and sub-agent commission ledgers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1.5">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-indigo-500/20 transition-all">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-200">Branch & Counselor Workflows</h4>
                <p className="text-[9px] text-slate-500">Track and assign student leads across all office locations.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-purple-500/20 transition-all">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-200">Application Document Checklists</h4>
                <p className="text-[9px] text-slate-500">Real-time status tracking from inquiry through visa decision.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-pink-500/20 transition-all">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-200">Commission & Sub-Agent Ledgers</h4>
                <p className="text-[9px] text-slate-500">Accurate partner payouts, invoice billing, and split ledgers.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Role-Based Quick Fill Accounts
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillCredentials(acc.email)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/30 transition-all text-left text-xs group cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{acc.label}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">{acc.email}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-indigo-400 group-hover:bg-indigo-950/60 group-hover:text-indigo-300 transition-all">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 flex items-center justify-center">
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-650 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                Nepal Market
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">Welcome back</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to manage {org.name} portal
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. counselor.ktm1@thinkcone.com.np"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-400" htmlFor="password">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-slate-950 font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center text-[10px] text-slate-500 space-y-1">
              <div>By logging in, you agree to the {org.name} Terms of Service.</div>
              <div>
                Powered by <a href="https://thinkcone.com.np" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-400 hover:text-indigo-400 transition-all hover:underline">Thinkcone Technology</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
