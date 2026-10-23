import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Key,
  ArrowRight,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Mail,
  Eye,
  EyeOff,
  User,
  Sparkles,
  MapPin,
  BadgeAlert,
} from 'lucide-react';
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

const PRELOADED_PROFILES: TeamMemberProfile[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
    name: 'Engr. Idris A.',
    email: 'drisatech@gmail.com',
    badge: 'NERAMP-DEV-001',
    jurisdiction: 'National Infrastructure & Security (Full System Access)',
    defaultDestination: '/admin-ingestion',
    description: 'Unrestricted access to system ingestion, database purge, security controls, and management audit logs.',
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
  const { loginWithCredentials, registerWithCredentials, isAuthenticated, user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('drisatech@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Admin@Neramp2026!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('RESULT_VERIFIER');
  const [regJurisdiction, setRegJurisdiction] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick fill helper for recognized management personnel
  const handleQuickSelect = (profile: TeamMemberProfile) => {
    setLoginEmail(profile.email);
    setLoginPassword('Admin@Neramp2026!');
    setErrorMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const authUser = await loginWithCredentials(loginEmail, loginPassword);
      setSuccessMsg(`Authenticated successfully as ${authUser.name}`);

      const matchedProfile = PRELOADED_PROFILES.find((p) => p.role === authUser.role);
      const destination =
        authUser.role === 'SUPER_ADMIN'
          ? '/admin-ingestion'
          : authUser.role === 'RESULT_VERIFIER'
          ? '/verification-queue'
          : authUser.role === 'REGISTERED_OBSERVER'
          ? '/observer-portal'
          : matchedProfile?.defaultDestination || '/admin';

      setTimeout(() => {
        navigate(destination);
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter both passwords.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authUser = await registerWithCredentials({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        jurisdiction: regJurisdiction || 'National Monitoring',
      });

      setSuccessMsg(`Account created and registered permanently. Welcome, ${authUser.name}!`);

      setTimeout(() => {
        navigate(authUser.role === 'SUPER_ADMIN' ? '/admin-ingestion' : '/admin');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
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
            Restricted to authorized election management personnel. Credentials and activities are permanently monitored and logged.
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
                  onClick={() =>
                    navigate(user.role === 'SUPER_ADMIN' ? '/admin-ingestion' : '/admin')
                  }
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  Go to Console
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs: Sign In vs First-Timer Register */}
        <div className="flex border-b border-slate-200 bg-slate-100">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Management Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'REGISTER'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>First-Timer Registration</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Management Sign In */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleSignIn} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. drisatech@gmail.com or name@neramp.org.ng"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Management Password</label>
                <span className="text-[10px] text-slate-400 font-mono">Default: Admin@Neramp2026!</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your management password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-10 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying Credentials...' : 'Authenticate & Open Management Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick-Select Recognised Management Personnel */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Select Accredited Management Personnel
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {PRELOADED_PROFILES.map((prof) => {
                  const isCurrent = loginEmail.toLowerCase() === prof.email.toLowerCase();
                  return (
                    <button
                      key={prof.email}
                      type="button"
                      onClick={() => handleQuickSelect(prof)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                        <span className="truncate">{prof.title}</span>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium truncate">{prof.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{prof.email}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: First-Timer Management Registration */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="p-6 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
              <BadgeAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>First-Time Management Registration:</strong> Create your permanent password and profile. Once registered, your account is stored permanently on the server and survives redeployments.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Engr. Idris A."
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. idris@neramp.org.ng"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password (min. 6)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-10 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Management Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                >
                  <option value="SUPER_ADMIN">Super Administrator (Full System Governance)</option>
                  <option value="PROJECT_ADMIN">Project Administrator (Operational Authority)</option>
                  <option value="ELECTION_ANALYST">Senior Election Analyst (Turnout & Modeling)</option>
                  <option value="STATE_COORDINATOR">State Coordinator (Regional Monitoring)</option>
                  <option value="RESULT_VERIFIER">Result Verifier (Form EC8A Dual-Transcriber)</option>
                  <option value="REGISTERED_OBSERVER">Accredited Field Observer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jurisdiction / Collation Center</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regJurisdiction}
                    onChange={(e) => setRegJurisdiction(e.target.value)}
                    placeholder="e.g. National HQ / Osun Collation"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Account...' : 'Register & Create Management Password'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
