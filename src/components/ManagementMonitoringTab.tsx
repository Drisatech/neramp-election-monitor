import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  Clock,
  Activity,
  CheckCircle2,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  Lock,
  UserCheck,
  Laptop,
  Radio,
  Eye,
  FileText,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchManagementMonitoring } from '../services/api';

export const ManagementMonitoringTab: React.FC = () => {
  const { user, role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOGGED_OUT'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'activities'>('sessions');

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const loadData = async () => {
    if (!isSuperAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchManagementMonitoring();
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load management monitoring:', err);
      setError(err.message || 'Failed to load management monitoring logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh sessions every 12 seconds
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [role]);

  // If user is not super admin, block access completely
  if (!isSuperAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-300 rounded-xl p-8 text-center max-w-2xl mx-auto my-8 space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted to Super Administrator</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The Management Monitoring Logs are classified and strictly restricted to the Super Admin (Engr. Idris A.). Personnel login tracking, active session durations, and management activity audits require elevated root privileges.
        </p>
      </div>
    );
  }

  const exportMonitoringJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neramp-management-monitoring-audit-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '< 1m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const sessions = data?.sessions || data?.allSessions || [];
  const activities = data?.activities || [];
  const summary = {
    totalPersonnel: data?.summary?.totalRegisteredPersonnel || data?.summary?.totalManagementUsers || 0,
    activeSessions: data?.summary?.activeNow || data?.summary?.currentlyActiveSessions || 0,
    totalSessions: data?.summary?.totalSessionsTracked || data?.summary?.totalSessionsLogged || 0,
    totalActivities: data?.summary?.totalActivitiesLogged || data?.summary?.totalActivitiesRecorded || 0,
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s: any) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (s.userName || s.fullName || '').toLowerCase();
      const email = (s.userEmail || s.email || '').toLowerCase();
      const role = (s.role || '').toLowerCase();
      const ip = (s.ipAddress || '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q) || ip.includes(q);
    }
    return true;
  });

  // Filter activities
  const filteredActivities = activities.filter((a: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (a.actor || '').toLowerCase().includes(q) ||
        (a.actorName || '').toLowerCase().includes(q) ||
        (a.action || '').toLowerCase().includes(q) ||
        (a.details || '').toLowerCase().includes(q) ||
        (a.target || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-700/80 rounded-xl text-emerald-100 shadow-xs shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Management Personnel Monitoring Logs</h2>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time audit log tracking when management personnel sign in, how long their authenticated sessions stay active, their client device footprint, and the exact platform activities they execute.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
          <button
            onClick={exportMonitoringJson}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Management Personnel</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {summary.totalPersonnel}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Configured with permanent access</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Active Sessions Now</span>
            </span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {summary.activeSessions}
          </div>
          <span className="text-[10px] text-emerald-700 mt-1 block font-medium">Currently online in platform</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Total Login Sessions</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {summary.totalSessions}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Recorded since system inception</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase">Activities Audited</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {summary.totalActivities}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Immutable management actions</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('sessions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSubTab === 'sessions'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Login Sessions & Durations ({filteredSessions.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('activities')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSubTab === 'activities'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activities Carried Out ({filteredActivities.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search personnel, role, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600 font-medium"
              />
            </div>

            {activeSubTab === 'sessions' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-emerald-600"
              >
                <option value="ALL">All Session States</option>
                <option value="ACTIVE">Active Only (Online)</option>
                <option value="LOGGED_OUT">Logged Out</option>
              </select>
            )}
          </div>
        </div>

        {/* SUBTAB 1: SESSIONS & DURATION */}
        {activeSubTab === 'sessions' && (
          <div className="overflow-x-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-medium">
                No management login sessions match the active criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                    <th className="py-2.5 px-3">Management Personnel</th>
                    <th className="py-2.5 px-3">Email Address</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Login Time (WAT)</th>
                    <th className="py-2.5 px-3">Session Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Client & Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((session: any) => {
                    const isActive = session.status === 'ACTIVE';
                    const name = session.userName || session.fullName || 'Management Personnel';
                    const email = session.userEmail || session.email || '—';
                    const durationText = session.durationFormatted || formatDuration(session.durationSeconds);
                    return (
                      <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                              {name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {session.id.substring(0, 10)}...</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-700">
                          {email}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            session.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : session.role === 'PROJECT_ADMIN'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {session.role}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-600">
                          {new Date(session.loginAt).toLocaleString()}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                            <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
                            <span>{durationText}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                            <span>{isActive ? 'ACTIVE NOW' : 'LOGGED OUT'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 max-w-xs truncate" title={session.userAgent}>
                          <div className="flex items-center gap-1.5">
                            <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{session.ipAddress || '127.0.0.1'} · {session.userAgent || 'Web Browser'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SUBTAB 2: ACTIVITIES CARRIED OUT */}
        {activeSubTab === 'activities' && (
          <div className="overflow-x-auto">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-medium">
                No recorded management activities match the search filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                    <th className="py-2.5 px-3">Timestamp (WAT)</th>
                    <th className="py-2.5 px-3">Management Personnel (Actor)</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Activity Details & Context</th>
                    <th className="py-2.5 px-3">Target Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActivities.map((act: any) => (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{act.actor}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {act.action}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 max-w-md">
                        {act.details}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {act.target || 'PLATFORM_WIDE'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
