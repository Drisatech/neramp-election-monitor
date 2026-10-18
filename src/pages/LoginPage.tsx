import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Key, ArrowRight, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { NerampLogo } from '../components/NerampLogo';

interface TeamMemberProfile {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  badge: string;
  jurisdiction: string;
  defaultDestination: string;
  description: string;
}

const MANAGEMENT_PROFILES: TeamMemberProfile[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
    name: 'Engr. D. Ibrahim (Lead Developer)',
    email: 'drisatech@gmail.com',
    badge: 'NERAMP-DEV-001',
    jurisdiction: 'National Infrastructure & Security (Full System Access)',
    defaultDestination: '/admin-ingestion',
    description: 'Unrestricted access to Cloud Run ingestion, database purge, security controls, and system logs.',
  },
  {
    role: 'PROJECT_ADMIN',
    title: 'Project Administrator',
    name: 'Dr. Amina Bello',
    email: 'amina.bello@neramp.org.ng',
    badge: 'NERAMP-ADM-002',
    jurisdiction: 'National Operations & Policy Oversight',
    defaultDestination: '/admin',
    description: 'Complete operational authority over verifications, discrepancies, and observer deployment.',
  },
  {
    role: 'ELECTION_ANALYST',
    title: 'Senior Election Analyst',
    name: 'Chinedu Okafor',
    email: 'c.okafor@neramp.org.ng',
    badge: 'NERAMP-ANA-014',
    jurisdiction: 'Analytics, Data Ingestion & Turnout Modeling',
    defaultDestination: '/analytics',
    description: 'Statistical outlier detection, turnout anomaly modeling, and ingestion audit.',
  },
  {
    role: 'STATE_COORDINATOR',
    title: 'State Coordinator',
    name: 'Adeyemi Adeleke',
    email: 'adeyemi.a@neramp.org.ng',
    badge: 'NERAMP-ST-029',
    jurisdiction: 'Osun & Ekiti State Joint Operations',
    defaultDestination: '/admin',
    description: 'Regional monitoring command, field team oversight, and state collation verification.',
  },
  {
    role: 'RESULT_VERIFIER',
    title: 'Lead Verification Officer',
    name: 'Funmilayo Adebayo',
    email: 'f.adebayo@neramp.org.ng',
    badge: 'NERAMP-VER-088',
    jurisdiction: 'Form EC8A Dual-Transcriber Queue',
    defaultDestination: '/verification-queue',
    description: 'Visual cross-check of scanned Form EC8A sheets against OCR extracts and arithmetic rules.',
  },
  {
    role: 'REGISTERED_OBSERVER',
    title: 'Accredited Field Observer',
    name: 'Tunde Oladipo',
    email: 't.oladipo@electionwatch.ng',
    badge: 'OBS-SW-042',
    jurisdiction: 'Osogbo LGA & Ife North LGA',
    defaultDestination: '/observer-portal',
    description: 'Accreditation reporting, poll opening status, and polling-unit incident submission.',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, logout } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const activeProfile =
    MANAGEMENT_PROFILES.find((p) => p.role === selectedRole) || MANAGEMENT_PROFILES[0];

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);

    setTimeout(() => {
      login({
        id: `usr-${activeProfile.role.toLowerCase()}`,
        name: activeProfile.name,
        email: activeProfile.email,
        role: activeProfile.role,
        badge: activeProfile.badge,
        jurisdiction: activeProfile.jurisdiction,
      });

      setIsAuthenticating(false);
      navigate(activeProfile.defaultDestination);
    }, 400);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Security Header Banner */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <NerampLogo className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest uppercase text-emerald-400">
                  NERAMP
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  SECURE PORTAL
                </span>
              </div>
              <h1 className="text-base font-bold tracking-tight text-white">
                Management Operations Gateway
              </h1>
            </div>
          </div>
          <Shield className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        {/* Notice */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 text-xs text-slate-600 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            This confidential gateway is restricted to accredited election monitoring personnel. URL is private and not published to public users.
          </span>
        </div>

        {/* If already authenticated */}
        {isAuthenticated && user && (
          <div className="p-6 border-b border-slate-200 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-emerald-800 font-semibold uppercase">Currently Signed In</div>
                  <div className="text-sm font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    Role: {user.role.replace(/_/g, ' ')} · {user.badge}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(activeProfile.defaultDestination)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Authorized Management Persona
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {MANAGEMENT_PROFILES.map((prof) => {
                const isSelected = selectedRole === prof.role;
                return (
                  <button
                    key={prof.role}
                    type="button"
                    onClick={() => setSelectedRole(prof.role)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                      <span>{prof.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate">{prof.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prof.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Profile Summary */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-900">{activeProfile.name}</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                {activeProfile.badge}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">{activeProfile.description}</p>
            <div className="text-slate-500 text-[10px]">
              <strong>Jurisdiction:</strong> {activeProfile.jurisdiction}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Passcode / Authorization PIN
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter authorized credential PIN (Optional for quick drill)"
                className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Super Admin can distribute this link privately to personnel without exposing public sign-in links.
            </p>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isAuthenticating
                ? 'Authenticating Credentials...'
                : `Authenticate as ${activeProfile.title}`}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
