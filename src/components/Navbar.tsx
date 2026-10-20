import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Vote,
  MapPin,
  FileText,
  AlertTriangle,
  Shield,
  Layers,
  Database,
  Info,
  Menu,
  X,
  UserCheck,
  CheckCircle2,
  BarChart3,
  Activity,
  Sun,
  Moon,
  Accessibility,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useElection } from '../context/ElectionContext';
import { useThemeAccessibility } from '../context/ThemeAccessibilityContext';
import { UserRole, Election } from '../types';
import { NerampLogo } from './NerampLogo';
import { AiOcrSettingsModal } from './AiOcrSettingsModal';

export function formatMenuElectionTitle(elec: Election): string {
  const type = String(elec.electionType || '').toUpperCase();
  const id = elec.id || '';

  // Clean state name (e.g. "Osun", "Ekiti", "Lagos")
  const stateRaw = elec.stateName || (elec.stateCode ? `${elec.stateCode}` : '');
  const stateClean = stateRaw ? stateRaw.replace(/\s+State/i, '').trim() : '';

  // Elections that have been held (Osun and Ekiti Governorship) have the state name added and date attached
  if (id === 'elec-2026-gov-osun' || (type === 'GOVERNORSHIP' && (elec.stateCode === 'OSUN' || stateClean.toUpperCase() === 'OSUN'))) {
    return 'Governorship Election - Osun - 2026-08-15';
  }
  if (id === 'elec-2026-gov-ekiti' || (type === 'GOVERNORSHIP' && (elec.stateCode === 'EKITI' || stateClean.toUpperCase() === 'EKITI'))) {
    return 'Governorship Election - Ekiti - 2026-06-20';
  }

  if (type === 'GOVERNORSHIP') {
    const statePart = stateClean ? ` - ${stateClean}` : '';
    const datePart = elec.date ? ` - ${elec.date}` : '';
    return `Governorship Election${statePart}${datePart}`;
  }

  // Senate: with state name attached
  if (type === 'SENATE') {
    const statePart = stateClean ? ` - ${stateClean}` : '';
    const district = elec.senatorialDistrict ? ` (${elec.senatorialDistrict})` : '';
    const datePart = elec.date ? ` - ${elec.date}` : '';
    return `Senate Election${statePart}${district}${datePart}`;
  }

  // House of Reps: with state name attached
  if (type === 'REPS' || type === 'HOUSE_OF_REPRESENTATIVES') {
    const statePart = stateClean ? ` - ${stateClean}` : '';
    const constName = elec.constituencyName ? ` (${elec.constituencyName})` : '';
    const datePart = elec.date ? ` - ${elec.date}` : '';
    return `House of Representative Election${statePart}${constName}${datePart}`;
  }

  // House of Assembly: with state name attached
  if (type === 'ASSEMBLY' || type === 'HOUSE_OF_ASSEMBLY' || type === 'STATE_ASSEMBLY') {
    const statePart = stateClean ? ` - ${stateClean}` : '';
    const constName = elec.constituencyName ? ` (${elec.constituencyName})` : '';
    const datePart = elec.date ? ` - ${elec.date}` : '';
    return `House of Assembly${statePart}${constName}${datePart}`;
  }

  if (type === 'PRESIDENTIAL' || id.includes('presidential')) {
    // Only year since election has not held yet
    const yearPart = elec.date ? elec.date.slice(0, 4) : '2027';
    return `Presidential Election - ${yearPart}`;
  }

  const statePart = stateClean ? ` - ${stateClean}` : '';
  const datePart = elec.date ? ` - ${elec.date}` : '';
  return `${elec.title || 'Election'}${statePart}${datePart}`;
}

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { role, switchRole, user, isAuthenticated, logout } = useAuth();
  const { elections, selectedElectionId, setSelectedElectionId } = useElection();
  const { theme, toggleTheme, activePwdFeaturesCount } = useThemeAccessibility();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenOcr = () => setIsOcrModalOpen(true);
    window.addEventListener('open-ai-ocr-settings', handleOpenOcr);
    return () => window.removeEventListener('open-ai-ocr-settings', handleOpenOcr);
  }, []);

  // Contest Switcher: strictly only elections that have been held (e.g. Osun & Ekiti, or concluded)
  const heldElections = elections.filter((elec) => {
    const status = String(elec.status || '').toUpperCase();
    return (
      status === 'CONCLUDED' ||
      status === 'COMPLETED' ||
      elec.hasBeenHeld === true ||
      elec.id === 'elec-2026-gov-osun' ||
      elec.id === 'elec-2026-gov-ekiti'
    );
  });
  const contestSwitcherElections = heldElections.length > 0 ? heldElections : elections;

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    roles?: UserRole[];
  }

  const allNavLinks: NavItem[] = [
    { to: '/', label: 'Overview', icon: Vote },
    { to: '/results', label: 'Party Results', icon: Layers },
    { to: '/map', label: 'Map Explorer', icon: MapPin },
    { to: '/polling-units', label: 'Polling Units', icon: FileText },
    {
      to: '/analytics',
      label: 'Advanced Analytics',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'ELECTION_ANALYST', 'STATE_COORDINATOR', 'MONITORING_COORDINATOR'],
    },
    {
      to: '/discrepancies',
      label: 'Discrepancies',
      icon: AlertTriangle,
      roles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'ELECTION_ANALYST', 'STATE_COORDINATOR', 'RESULT_VERIFIER', 'MONITORING_COORDINATOR'],
    },
    {
      to: '/incidents',
      label: 'Incidents',
      icon: Shield,
      roles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'STATE_COORDINATOR', 'LGA_COORDINATOR', 'MONITORING_COORDINATOR', 'REGISTERED_OBSERVER'],
    },
    {
      to: '/observer-portal',
      label: 'Observer Field Portal',
      icon: UserCheck,
      roles: ['REGISTERED_OBSERVER', 'STATE_COORDINATOR', 'LGA_COORDINATOR', 'MONITORING_COORDINATOR', 'SUPER_ADMIN', 'PROJECT_ADMIN'],
    },
    {
      to: '/verification-queue',
      label: 'Result Verification',
      icon: CheckCircle2,
      roles: ['RESULT_VERIFIER', 'ELECTION_ANALYST', 'STATE_COORDINATOR', 'LGA_COORDINATOR', 'MONITORING_COORDINATOR', 'SUPER_ADMIN', 'PROJECT_ADMIN'],
    },
    {
      to: '/admin',
      label: 'Command Centre',
      icon: Shield,
      roles: ['STATE_COORDINATOR', 'LGA_COORDINATOR', 'MONITORING_COORDINATOR', 'SUPER_ADMIN', 'PROJECT_ADMIN'],
    },
    {
      to: '/admin-ingestion',
      label: 'Ingestion & Status',
      icon: Database,
      roles: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'ELECTION_ANALYST'],
    },
    {
      to: '/readiness-testing',
      label: 'Readiness & Testing',
      icon: Activity,
      roles: ['SUPER_ADMIN', 'PROJECT_ADMIN'],
    },
    { to: '/methodology', label: 'Methodology', icon: Info },
  ];

  const navLinks = allNavLinks.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const roles: { role: UserRole; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'System Administrator' },
    { role: 'PROJECT_ADMIN', label: 'Project Admin' },
    { role: 'ELECTION_ANALYST', label: 'Election Analyst' },
    { role: 'STATE_COORDINATOR', label: 'State Coordinator' },
    { role: 'LGA_COORDINATOR', label: 'LGA Coordinator' },
    { role: 'MONITORING_COORDINATOR', label: 'Monitoring Coordinator' },
    { role: 'RESULT_VERIFIER', label: 'Verification Officer' },
    { role: 'REGISTERED_OBSERVER', label: 'Registered Observer' },
    { role: 'PUBLIC_USER', label: 'Public User' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Keyboard Skip Link for PWD Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-950 focus:font-bold focus:rounded-md focus:shadow-lg"
      >
        Skip to Main Content
      </a>
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-100">
          {/* Logo & Platform Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <NerampLogo className="w-11 h-11" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  NERAMP
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Nigeria Election Results Analysis and Monitoring Platform
              </p>
            </div>
          </Link>

          {/* Right Header Controls: Election Selector & Role Switcher */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Election Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Contest:</span>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-600 cursor-pointer max-w-[240px] truncate"
              >
                {contestSwitcherElections.map((elec) => (
                  <option key={elec.id} value={elec.id}>
                    {formatMenuElectionTitle(elec)}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Background Switch (Bright / Dark) & PWD Accessibility Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
                title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bright</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-pwd-accessibility'))}
                aria-label="Open PWD Accessibility Settings"
                title="PWD Accessibility Options (Alt + A)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
              >
                <Accessibility className="w-3.5 h-3.5 text-emerald-700" />
                <span>PWD Access</span>
                {activePwdFeaturesCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-black rounded-full bg-amber-400 text-slate-950">
                    {activePwdFeaturesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOcrModalOpen(true)}
                aria-label="Open AI OCR Configuration & Status"
                title="Gemini Vision AI OCR Engine, Status & API Key Configuration"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>AI OCR</span>
              </button>
            </div>

            {/* Management User Profile or Hidden for Public */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                      {user.role.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* Only Super Admin has access to Developer Persona Switcher; other personnel see their locked role */}
                {role === 'SUPER_ADMIN' ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors cursor-pointer"
                      title="Switch test persona (Developer Super Admin Only)"
                    >
                      <span>Role: {role.replace(/_/g, ' ')}</span>
                    </button>

                    {roleMenuOpen && (
                      <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          Dev Persona Switcher
                        </div>
                        {roles.map((r) => (
                          <button
                            key={r.role}
                            onClick={() => {
                              switchRole(r.role);
                              setRoleMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer ${
                              role === r.role ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{r.label}</span>
                            {role === r.role && <span className="text-emerald-700 text-xs">Active</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
                    Role: {role.replace(/_/g, ' ')}
                  </div>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded transition-colors cursor-pointer"
                  title="Sign out of management portal"
                >
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu & quick theme/PWD buttons */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-pwd-accessibility'))}
              aria-label="Open PWD Accessibility Settings"
              className="p-2 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 cursor-pointer"
            >
              <Accessibility className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-md focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <div className="py-2 border-b border-slate-100">
            <label className="text-xs font-semibold text-slate-500 block mb-1">Election Contest:</label>
            <select
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs rounded-md p-2"
            >
              {contestSwitcherElections.map((elec) => (
                <option key={elec.id} value={elec.id}>
                  {formatMenuElectionTitle(elec)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Authenticated Management Display */}
          {isAuthenticated && user && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                    {user.role.replace(/_/g, ' ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded"
                >
                  Sign Out
                </button>
              </div>

              {role === 'SUPER_ADMIN' && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Dev Test Personas:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-2 py-1 text-[11px] text-left rounded ${
                          role === r.role ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AiOcrSettingsModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
      />
    </header>
  );
};
