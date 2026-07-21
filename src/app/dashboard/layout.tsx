import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  Users, 
  Wallet, 
  LogOut, 
  LayoutDashboard, 
  MapPin, 
  Globe,
  Settings,
  GraduationCap,
  BookOpen,
  School,
  Compass,
  ShieldCheck,
  Building
} from 'lucide-react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = verifyToken(token);
  if (!user) {
    redirect('/login');
  }

  const isSubAgent = user.role === 'SUB_AGENT';

  // Fetch organization settings from DB to support dynamic logo/name
  const org = user.organizationId ? await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      name: true,
      tagline: true,
      logoUrl: true,
      logoIcon: true,
    }
  }) : null;

  // Icon selector
  const IconComponent = (() => {
    switch (org?.logoIcon) {
      case 'GraduationCap': return GraduationCap;
      case 'BookOpen': return BookOpen;
      case 'School': return School;
      case 'Compass': return Compass;
      case 'ShieldCheck': return ShieldCheck;
      case 'Building': return Building;
      default: return Globe;
    }
  })();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-800 bg-slate-900 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Org Header */}
          <div className="h-20 flex items-center px-4 border-b border-slate-800 space-x-3">
            {org?.logoUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 p-0.5 shadow-sm">
                <img src={org.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            ) : (
              <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shrink-0 flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-bold text-xs text-slate-100 truncate max-w-[210px]" title={org?.name || 'Thinkcone CRM'}>
                {org?.name || 'Thinkcone CRM'}
              </h2>
              <span className="text-[9px] text-slate-400 font-medium tracking-wide block truncate max-w-[210px]" title={org?.tagline || 'Thinkcone Study Abroad'}>
                {org?.tagline || 'Thinkcone Study Abroad'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {!isSubAgent ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-indigo-600 transition-all text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/applicants"
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-indigo-600 transition-all text-sm font-medium"
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Applicants / Leads</span>
                </Link>
                {(user.role === 'DIRECTOR' || user.role === 'FINANCE') && (
                  <Link
                    href="/dashboard/finance"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-indigo-600 transition-all text-sm font-medium"
                  >
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <span>Commissions & Fees</span>
                  </Link>
                )}
                {user.role === 'DIRECTOR' && (
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-indigo-600 transition-all text-sm font-medium"
                  >
                    <Settings className="w-4 h-4 text-indigo-500" />
                    <span>Control Panel</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Sub-Agent Portal
                </div>
                <Link
                  href="/dashboard/applicants"
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-indigo-600 transition-all text-sm font-medium"
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>My Leads</span>
                </Link>
                <Link
                  href="/dashboard/finance"
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-850 hover:text-indigo-600 transition-all text-sm font-medium"
                >
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <span>My Commissions</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User profile / Logout footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-3 px-2 py-1.5 bg-slate-950/40 rounded-2xl border border-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 uppercase shrink-0">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-xs text-slate-200 truncate">{user.name}</div>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold uppercase tracking-wider scale-90 origin-left shrink-0">
                  {user.role}
                </span>
                {user.branchId && (
                  <span className="text-[9px] text-slate-400 flex items-center truncate">
                    <MapPin className="w-2.5 h-2.5 text-slate-500 mr-0.5 shrink-0" />
                    <span className="truncate max-w-[65px]">HQ</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <LogoutButton />

          <div className="pt-1 text-center text-[9px] text-slate-500 font-medium">
            Powered by <a href="https://thinkcone.com.np" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-400 hover:text-indigo-400 transition-all hover:underline">Thinkcone Technology</a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 h-16 border-b border-slate-800/80 bg-slate-900/55 flex items-center justify-between px-8 z-40 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-300">Nepal Operations</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
              Branch ID: {user.branchId ? 'Active' : 'HQ Rollup'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats / date display */}
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Dashboard page children */}
        <div className="p-8 pt-24 flex-1 bg-slate-950 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
