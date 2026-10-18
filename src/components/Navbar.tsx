import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useElection } from '../context/ElectionContext';
import { UserRole } from '../types';
import { NerampLogo } from './NerampLogo';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { role, switchRole } = useAuth();
  const { elections, selectedElectionId, setSelectedElectionId } = useElection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    roles?: UserRole[];
  }

  const allNavLinks: NavItem[] = [
    { to: '/', label: 'Overview', icon: Vote },
    { to: '/analytics', label: 'Advanced Analytics', icon: BarChart3 },
    { to: '/results', label: 'Candidate Results', icon: Layers },
    { to: '/map', label: 'Map Explorer', icon: MapPin },
    { to: '/polling-units', label: 'Polling Units', icon: FileText },
    { to: '/discrepancies', label: 'Discrepancies', icon: AlertTriangle },
    { to: '/incidents', label: 'Incidents', icon: Shield },
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
                {elections.map((elec) => (
                  <option key={elec.id} value={elec.id}>
                    {elec.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                title="Switch active user role for testing"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Role: {role.replace('_', ' ')}</span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Test Persona
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between ${
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
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
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
              {elections.map((elec) => (
                <option key={elec.id} value={elec.id}>
                  {elec.title}
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

          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium block mb-1">Switch Test Role:</span>
            <div className="grid grid-cols-2 gap-1">
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2 py-1.5 text-xs text-left rounded ${
                    role === r.role ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
