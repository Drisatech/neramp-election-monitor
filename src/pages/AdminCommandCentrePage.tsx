import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Activity,
  Database,
  RefreshCw,
  Search,
  Plus,
  Key,
  CheckCircle2,
  XCircle,
  Download,
  Layers,
  MapPin,
  Clock,
  Lock,
  FileText,
  Info,
  ExternalLink,
  ShieldAlert,
  Trash2,
  Edit,
  Play,
  Pause,
  AlertTriangle,
  UserCheck,
  Check,
  Eye,
  Sliders,
  Server,
  Cpu,
  BarChart2,
  HardDrive,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useElection } from '../context/ElectionContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { RegisteredVotersImportModal } from '../components/RegisteredVotersImportModal';
import { StorageContentManagementTab } from '../components/StorageContentManagementTab';
import { OFFICIAL_INEC_PARTIES, getPartyInfo } from '../constants/parties';
import {
  fetchCommandCenterMetrics,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserStatus,
  resetUserAccess,
  deleteAdminUser,
  fetchAuditLogsExport,
  fetchVerifierSupervision,
  reassignDisputedResult,
  verifyObserverCredentials,
  publishProtectedIncident,
  pauseIngestionScheduler,
  clearVolatileCache,
  triggerSystemDiagnostics,
  retryFailedJob,
  fetchIngestionJobs,
  fetchConfigElections,
  createConfigElection,
  fetchConfigCandidates,
  createConfigCandidate,
  fetchConfigParties,
  testSourceConnection,
  triggerIngestionRun,
} from '../services/api';
import {
  AdminUser,
  CommandCenterMetrics,
  VerifierSupervisionItem,
  UserRole,
} from '../types';

type AdminTab =
  | 'overview'
  | 'users'
  | 'operations'
  | 'supervision'
  | 'coordination'
  | 'configuration'
  | 'audit'
  | 'storage';

export const AdminCommandCentrePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab: AdminTab = tabParam === 'storage' ? 'storage' : 'overview';

  const { role: activeUserRole, isSuperOrProjectAdmin } = useAuth();
  const { states, elections, selectedElectionId, setSelectedElectionId, refreshElections } = useElection();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<CommandCenterMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [verifiers, setVerifiers] = useState<VerifierSupervisionItem[]>([]);
  const [ingestionJobs, setIngestionJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  // Filtering states
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Modals & Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [accessResetData, setAccessResetData] = useState<any | null>(null);
  const [reassignModalSheetId, setReassignModalSheetId] = useState<string | null>(null);
  const [secondaryVerifierName, setSecondaryVerifierName] = useState<string>('Musa Garba (Secondary Reviewer)');
  const [reassignReason, setReassignReason] = useState<string>('Disputed transcription escalated by Administrator for dual-signature audit');
  const [diagnosticsResult, setDiagnosticsResult] = useState<any | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [isManualIngesting, setIsManualIngesting] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    role: 'REGISTERED_OBSERVER' as UserRole,
    assignedStateCode: '',
    assignedLgaCode: '',
    assignedWardCode: '',
    badge: '',
  });

  // New Election Form State
  const [showCreateElectionModal, setShowCreateElectionModal] = useState(false);
  const [isCreatingElection, setIsCreatingElection] = useState(false);
  const [newElectionForm, setNewElectionForm] = useState({
    title: '',
    electionType: 'GOVERNORSHIP',
    stateCode: 'OSUN',
    date: '2026-08-15',
    sourceReference: 'INEC Official Election Timetable',
  });

  // Load all initial data
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [metricsRes, usersRes, verifRes, jobsRes, partiesRes, candRes] = await Promise.all([
        fetchCommandCenterMetrics(),
        fetchAdminUsers(),
        fetchVerifierSupervision(),
        fetchIngestionJobs(),
        fetchConfigParties(),
        fetchConfigCandidates(),
      ]);

      setMetrics(metricsRes.data);
      setUsers(usersRes.data);
      setVerifiers(verifRes.data);
      setIngestionJobs(jobsRes.data);
      setParties(partiesRes.data);
      setCandidates(candRes.data);
    } catch (err: any) {
      console.error('Failed to load command center data:', err);
      setFeedbackMessage({ type: 'error', text: err.message || 'Error connecting to admin services' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // User Actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminUser(newUserForm);
      showNotification('success', `User account ${newUserForm.email} created successfully.`);
      setShowCreateUserModal(false);
      setNewUserForm({
        fullName: '',
        email: '',
        role: 'REGISTERED_OBSERVER',
        assignedStateCode: '',
        assignedLgaCode: '',
        assignedWardCode: '',
        badge: '',
      });
      const updated = await fetchAdminUsers();
      setUsers(updated.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create user');
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newElectionForm.title.trim()) {
      showNotification('error', 'Please enter an election contest title.');
      return;
    }
    try {
      setIsCreatingElection(true);
      const payload = {
        ...newElectionForm,
        stateCode: newElectionForm.electionType === 'PRESIDENTIAL' ? '' : newElectionForm.stateCode,
      };
      const res = await createConfigElection(payload);
      await refreshElections();
      await loadAllData();
      if (res?.data?.id) {
        setSelectedElectionId(res.data.id);
      }
      showNotification('success', `Contest "${newElectionForm.title}" configured and added to the platform.`);
      setShowCreateElectionModal(false);
      setNewElectionForm({
        title: '',
        electionType: 'GOVERNORSHIP',
        stateCode: 'OSUN',
        date: '2026-08-15',
        sourceReference: 'INEC Official Election Timetable',
      });
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to configure new contest');
    } finally {
      setIsCreatingElection(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateAdminUser(editingUser.id, editingUser);
      showNotification('success', `User account ${editingUser.email} updated.`);
      setEditingUser(null);
      const updated = await fetchAdminUsers();
      setUsers(updated.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user');
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      await toggleUserStatus(user.id);
      showNotification('success', `Status for ${user.email} changed to ${user.isActive ? 'Inactive' : 'Active'}.`);
      const updated = await fetchAdminUsers();
      setUsers(updated.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to toggle status');
    }
  };

  const handleResetAccess = async (user: AdminUser) => {
    try {
      const res = await resetUserAccess(user.id);
      setAccessResetData(res.data);
      showNotification('success', `One-time access reset credentials generated for ${user.email}.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset access');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove account ${user.email}?`)) return;
    try {
      await deleteAdminUser(user.id);
      showNotification('success', `Account ${user.email} removed.`);
      const updated = await fetchAdminUsers();
      setUsers(updated.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete user');
    }
  };

  // Operational Controls
  const handleToggleScheduler = async (paused: boolean) => {
    try {
      await pauseIngestionScheduler(paused);
      showNotification('success', `Ingestion scheduler has been ${paused ? 'paused' : 'resumed'}.`);
      const updatedMetrics = await fetchCommandCenterMetrics();
      setMetrics(updatedMetrics.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to toggle scheduler');
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear volatile application memory cache? All election records, results, and audit trails will remain preserved.')) return;
    try {
      const res = await clearVolatileCache();
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to clear cache');
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      setIsDiagnosticRunning(true);
      const res = await triggerSystemDiagnostics();
      setDiagnosticsResult(res.data);
      showNotification('success', 'Diagnostic health report generated.');
    } catch (err: any) {
      showNotification('error', err.message || 'Diagnostics failed');
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryFailedJob(jobId);
      showNotification('success', `Job ${jobId} re-executed successfully.`);
      const updatedJobs = await fetchIngestionJobs();
      setIngestionJobs(updatedJobs.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to retry job');
    }
  };

  const handleManualIngestion = async () => {
    try {
      setIsManualIngesting(true);
      const res = await triggerIngestionRun('InecApprovedSourceAdapter', 'elec-2026-gov-osun');
      showNotification('success', `Ingestion run completed: ${res.data.recordsProcessed} polling units processed.`);
      const updatedJobs = await fetchIngestionJobs();
      setIngestionJobs(updatedJobs.data);
      const updatedMetrics = await fetchCommandCenterMetrics();
      setMetrics(updatedMetrics.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Manual ingestion failed');
    } finally {
      setIsManualIngesting(false);
    }
  };

  // Verifier Supervision
  const handleReassignDisputed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalSheetId) return;
    try {
      await reassignDisputedResult(reassignModalSheetId, secondaryVerifierName, reassignReason);
      showNotification('success', `Result sheet ${reassignModalSheetId} successfully reassigned to ${secondaryVerifierName}.`);
      setReassignModalSheetId(null);
      const updatedVerif = await fetchVerifierSupervision();
      setVerifiers(updatedVerif.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reassign result sheet');
    }
  };

  // Observer Coordination
  const handleVerifyObserver = async (obs: AdminUser) => {
    try {
      await verifyObserverCredentials(obs.id, obs.badge || 'OBS-VERIFIED-01');
      showNotification('success', `Accreditation verified for observer ${obs.fullName}.`);
      const updated = await fetchAdminUsers();
      setUsers(updated.data);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to verify observer');
    }
  };

  // Audit Logs Export
  const handleExportAuditLogs = async () => {
    try {
      const res = await fetchAuditLogsExport();
      const payload = res.data;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `nigeria_election_watch_audit_trail_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('success', `Certified audit trail exported with SHA-256 hash: ${payload.integritySha256.substring(0, 16)}...`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to export audit logs');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userStatusFilter !== '') {
      const isActiveBool = userStatusFilter === 'active';
      if (u.isActive !== isActiveBool) return false;
    }
    if (userSearchQuery) {
      const q = userSearchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.badge && u.badge.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Editorial & Independence Disclaimer */}
      <DisclaimerBanner />

      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 text-white rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administrative Command Centre</h1>
                <span className="text-[11px] font-mono uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold border border-emerald-300">
                  Mission Control
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized platform governance, observer coordination, operational queues, and tamper-evident audit oversight.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperOrProjectAdmin && (
            <RegisteredVotersImportModal
              onSuccess={() => {
                loadAllData();
                showNotification('success', 'Official INEC Registered Voters & PVC statistics updated across all 37 states, 774 LGAs, 8,809 Wards, and 176,846 Polling Units.');
              }}
            />
          )}

          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>

          <button
            onClick={handleExportAuditLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Certified Audit Log</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Command Centre Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 bg-white px-4 py-2 rounded-lg border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>System Overview</span>
        </button>

        {isSuperOrProjectAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User & Role Governance</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'operations'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Data Operations & Queues</span>
        </button>

        <button
          onClick={() => setActiveTab('supervision')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'supervision'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verification Supervision</span>
        </button>

        <button
          onClick={() => setActiveTab('coordination')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'coordination'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Observer Coordination</span>
        </button>

        {isSuperOrProjectAdmin && (
          <button
            onClick={() => setActiveTab('configuration')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'configuration'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Elections & Geography</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit & Accountability</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'storage'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Storage & Content Management</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SYSTEM OVERVIEW (CENTRAL ADMINISTRATION DASHBOARD) */}
      {/* ======================================================== */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Active Users</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                {metrics.activeUsers} <span className="text-xs font-normal text-slate-400">/ {metrics.totalUsers} Total</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {Object.keys(metrics.usersByRole).length} distinct roles provisioned
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Polling Units Monitored</span>
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                {metrics.resultsReceived}{' '}
                <span className="text-xs font-normal text-slate-400">/ {metrics.configuredPusCount.toLocaleString()} baseline</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Across 36 States + FCT & 774 LGAs
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Human-Verified Sheets</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                {metrics.resultsVerified}{' '}
                <span className="text-xs font-normal text-amber-600">({metrics.resultsPendingVerification} pending)</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {metrics.resultsDisputed} flagged for secondary review
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Unresolved Items</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
                {metrics.unresolvedDiscrepancies + metrics.unresolvedIncidents}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {metrics.unresolvedDiscrepancies} discrepancies · {metrics.unresolvedIncidents} field incidents
              </div>
            </div>
          </div>

          {/* Operational Infrastructure Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OCR Pipeline Status */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">OCR Processing Pipeline</h3>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {metrics.ocrQueueStatus.activeWorkers} Workers Active
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Queue Depth (Pending):</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.ocrQueueStatus.pending}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">In-Flight Processing:</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.ocrQueueStatus.inProgress}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Completed Extractions:</span>
                  <span className="font-mono font-semibold text-emerald-800">{metrics.ocrQueueStatus.completed}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Extraction Latency:</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.ocrQueueStatus.averageLatencySeconds}s / form</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Confidence Policy:</span>
                  <span className="font-semibold text-slate-700">Flag figures &lt; 85%</span>
                </div>
              </div>
            </div>

            {/* Ingestion & INEC Sync Status */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-700" />
                  <h3 className="text-sm font-bold text-slate-900">INEC Ingestion & Sync</h3>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                  {metrics.inecConnectivity.status}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Target Portal:</span>
                  <a
                    href={metrics.inecConnectivity.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <span>IReV Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Source Latency:</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.inecConnectivity.latencyMs} ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Scheduler Cadence:</span>
                  <span className="font-mono font-semibold text-slate-900">Every {metrics.ingestionStatus.intervalMinutes}m</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Last Sync Cycle:</span>
                  <span className="font-mono text-slate-700">{new Date(metrics.ingestionStatus.lastRun).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Rate Limit Quota:</span>
                  <span className="font-mono text-slate-600">{metrics.inecConnectivity.rateLimitQuota}</span>
                </div>
              </div>
            </div>

            {/* System Health Indicators */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">System Health & Storage</h3>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {metrics.systemHealth.apiStatus}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Cloud SQL Instance:</span>
                  <span className="font-semibold text-emerald-800 font-mono">neramp-db (PostgreSQL 16)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Connection Pool:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {metrics.systemHealth.connectionPool.active} active / {metrics.systemHealth.connectionPool.max} max
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Memory Utilization:</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.systemHealth.memoryUsageMb} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">GC Storage Bucket:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {metrics.systemHealth.storageCapacityGb.used} GB / {metrics.systemHealth.storageCapacityGb.total} GB
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">GCS Bucket Name:</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate max-w-[170px]" title="neramp-election-evidence-0652072827">neramp-election-evidence-0652072827</span>
                </div>
              </div>
            </div>
          </div>

          {/* Users by Role Breakdown Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              System Roles & Access Status Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(metrics.usersByRole).map(([r, count]) => (
                <div key={r} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase truncate" title={r}>
                    {r.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: USER & ROLE MANAGEMENT                             */}
      {/* ======================================================== */}
      {activeTab === 'users' && isSuperOrProjectAdmin && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, badge..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600 w-64"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">System Administrator (SUPER_ADMIN)</option>
                <option value="PROJECT_ADMIN">Project Admin</option>
                <option value="ELECTION_ANALYST">Election Analyst</option>
                <option value="STATE_COORDINATOR">State Coordinator</option>
                <option value="LGA_COORDINATOR">LGA Coordinator</option>
                <option value="MONITORING_COORDINATOR">Monitoring Coordinator</option>
                <option value="RESULT_VERIFIER">Verification Officer</option>
                <option value="REGISTERED_OBSERVER">Registered Observer</option>
                <option value="PUBLIC_USER">Public User</option>
              </select>

              {/* Status filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-emerald-600"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role & Access</th>
                    <th className="py-3 px-4">Geographic Responsibility</th>
                    <th className="py-3 px-4">Badge / ID</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.assignedStateCode ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {u.assignedStateCode}
                              {u.assignedLgaCode ? ` · ${u.assignedLgaCode}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">National Scope</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-700">
                        {u.badge || '—'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Edit Role & Jurisdiction"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetAccess(u)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                            title="Reset Password / One-Time Token"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`p-1.5 rounded ${
                              u.isActive
                                ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                          >
                            {u.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                        No users matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DATA OPERATIONS & QUEUES                           */}
      {/* ======================================================== */}
      {activeTab === 'operations' && metrics && (
        <div className="space-y-6">
          {/* Operations Controls Top Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Operational Ingestion Controls & Diagnostics</h2>
              <p className="text-xs text-slate-500">
                Supervise background synchronization, pause queues, and trigger health audits safely.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleToggleScheduler(metrics.ingestionStatus.schedulerPaused ? false : true)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  metrics.ingestionStatus.schedulerPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                }`}
              >
                {metrics.ingestionStatus.schedulerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{metrics.ingestionStatus.schedulerPaused ? 'Resume Scheduler' : 'Pause Scheduler'}</span>
              </button>

              <button
                onClick={handleManualIngestion}
                disabled={isManualIngesting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualIngesting ? 'animate-spin' : ''}`} />
                <span>Execute Ingestion Sync</span>
              </button>

              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                title="Flush temporary memory cache without affecting permanent election results"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear Volatile Cache</span>
              </button>

              <button
                onClick={handleRunDiagnostics}
                disabled={isDiagnosticRunning}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
                <span>Run Diagnostics</span>
              </button>
            </div>
          </div>

          {/* Diagnostics Panel if triggered */}
          {diagnosticsResult && (
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono uppercase text-emerald-400">
                    Live Diagnostic Report ({diagnosticsResult.overallHealth})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(diagnosticsResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {diagnosticsResult.checks.map((chk: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-800/80 rounded border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{chk.service}</div>
                      <div className="text-[10px] text-slate-400">{chk.details}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">{chk.status}</span>
                      {chk.latencyMs && <div className="text-[10px] text-slate-400">{chk.latencyMs}ms</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingestion Jobs History Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Ingestion Execution Queue & Task History
                </h3>
                <p className="text-[11px] text-slate-500">
                  Audit trail of background data sync jobs with retry protection against duplicate requests.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">{ingestionJobs.length} jobs executed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Job ID</th>
                    <th className="py-2.5 px-4">Adapter</th>
                    <th className="py-2.5 px-4">Contest / Scope</th>
                    <th className="py-2.5 px-4">Records Processed</th>
                    <th className="py-2.5 px-4">Execution Time</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingestionJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{j.id}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{j.adapter}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{j.sourceAttribution || 'General Contest'}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-emerald-800">{j.recordsProcessed}</span> processed ·{' '}
                        <span className="text-slate-400">{j.recordsRetrieved} retrieved</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(j.finishedAt || j.startedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                          {j.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRetryJob(j.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
                        >
                          Retry Task
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: VERIFICATION SUPERVISION                           */}
      {/* ======================================================== */}
      {activeTab === 'supervision' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Verification Team Supervision & Dual Review</h2>
              <p className="text-xs text-slate-500">
                Supervise accredited verifiers, track review throughput, and reassign disputed result sheets.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                Active Officers: {verifiers.length}
              </span>
            </div>
          </div>

          {/* Verifier Productivity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifiers.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold font-mono text-xs">
                      {v.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{v.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase">Reviewed</div>
                    <div className="text-base font-bold font-mono text-slate-900">{v.totalReviewed}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase">Approved</div>
                    <div className="text-base font-bold font-mono text-emerald-800">{v.approvedCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase">Flagged</div>
                    <div className="text-base font-bold font-mono text-amber-700">{v.flaggedDiscrepanciesCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase">Avg / Sheet</div>
                    <div className="text-base font-bold font-mono text-slate-800">{v.averageTimePerSheetSeconds}s</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                  <span>Assigned: {v.assignedJurisdiction}</span>
                  <button
                    onClick={() => setReassignModalSheetId('rs-25-01-01-002')}
                    className="text-emerald-800 font-semibold hover:underline"
                  >
                    Reassign Disputed Sheet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: OBSERVER COORDINATION                              */}
      {/* ======================================================== */}
      {activeTab === 'coordination' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Observer Credentialing & Protected Publication</h2>
              <p className="text-xs text-slate-500">
                Manage registered observers, verify field credentials, and protect observer identities when publishing incidents.
              </p>
            </div>
          </div>

          {/* Observers Directory */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Accredited Field Observers
              </h3>
              <span className="text-xs text-slate-500">
                {users.filter((u) => u.role === 'REGISTERED_OBSERVER').length} registered observers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Observer Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Accreditation Badge</th>
                    <th className="py-2.5 px-4">Monitored Jurisdiction</th>
                    <th className="py-2.5 px-4">Assigned PUs</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter((u) => u.role === 'REGISTERED_OBSERVER')
                    .map((obs) => (
                      <tr key={obs.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{obs.fullName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{obs.email}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                          {obs.badge || 'OBS-PENDING'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {obs.assignedStateCode || 'National'}
                          {obs.assignedLgaCode ? ` · ${obs.assignedLgaCode}` : ''}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {obs.assignedPus && obs.assignedPus.length > 0 ? (
                            obs.assignedPus.join(', ')
                          ) : (
                            <span className="text-slate-400 italic">None assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleVerifyObserver(obs)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                          >
                            Verify Accreditation
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: CONFIGURATION (ELECTIONS & GEOGRAPHY)              */}
      {/* ======================================================== */}
      {activeTab === 'configuration' && isSuperOrProjectAdmin && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Election Contests & Geographic Reference Data</h2>
              <p className="text-xs text-slate-500">
                Configure contests, political party ballots, Registered Voters & PVC rolls, and canonical polling unit baselines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <RegisteredVotersImportModal
                onSuccess={() => {
                  loadAllData();
                  showNotification('success', 'Official INEC Registered Voters & PVC statistics updated across all 37 states, 774 LGAs, 8,809 Wards, and 176,846 Polling Units.');
                }}
              />
              <button
                onClick={() => setShowCreateElectionModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Configure New Contest</span>
              </button>
            </div>
          </div>

          {/* Reference Counters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-medium">Configured States</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">37</div>
              <div className="text-[11px] text-slate-400 mt-0.5">36 States + FCT Abuja</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-medium">Local Government Areas</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">774</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Official INEC LGA boundaries</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-medium">Registration Wards</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">8,809</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Collation centres</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-medium">Polling Unit Baseline</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">176,846</div>
              <div className="text-[11px] text-emerald-800 mt-0.5 font-semibold">Strict zero-padded codes</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-slate-500 text-xs font-medium">Registered Voters (INEC)</div>
              <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                {(states.length > 0
                  ? states.reduce((acc, s) => acc + (s.registeredVoters || 0), 0)
                  : 103428715
                ).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">2026 Official Register</div>
            </div>
          </div>

          {/* Configured Election Contests */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  Configured Election Contests ({elections.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Active and scheduled INEC election contests available in the global contest selector.
                </p>
              </div>
              <button
                onClick={() => setShowCreateElectionModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Contest</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {elections.map((elec: any) => {
                const isSelected = elec.id === selectedElectionId;
                return (
                  <div
                    key={elec.id}
                    className={`p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{elec.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                          {elec.electionType || 'GOVERNORSHIP'}
                        </span>
                        {elec.stateCode && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {elec.stateCode}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ID: {elec.id} · Date: {elec.date} · Status: {elec.status || 'CONCLUDED'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-800 text-white text-[11px] font-bold">
                          Active Contest
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedElectionId(elec.id);
                            showNotification('success', `Switched active platform contest to "${elec.title}".`);
                          }}
                          className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold cursor-pointer"
                        >
                          Switch to Contest
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Political Parties */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  Official INEC Registered Political Parties ({(parties.length > 0 ? parties : OFFICIAL_INEC_PARTIES).length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Source: Independent National Electoral Commission (INEC) — https://www.inecnigeria.org/parties
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                22 Official Political Parties Verified
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-slate-100 max-h-96 overflow-y-auto">
              {(parties.length > 0 ? parties : OFFICIAL_INEC_PARTIES).map((p: any) => {
                const info = getPartyInfo(p.code);
                const logoUrl = p.logoUrl || info?.logoUrl;
                const chairman = p.chairman || info?.chairman;
                const secretary = p.secretary || info?.secretary;
                return (
                  <div key={p.id || p.code} className="p-3.5 bg-white flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${p.name} logo`}
                          className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.code}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white font-mono"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.code}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{p.name}</span>
                        </div>
                        {(chairman || secretary) && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {chairman ? `Chairman: ${chairman}` : ''}
                            {chairman && secretary ? ' · ' : ''}
                            {secretary ? `Secretary: ${secretary}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{p.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: AUDIT & ACCOUNTABILITY LOGS                        */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-800" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Audit Trail & Accountability Logs</h3>
                <p className="text-[11px] text-slate-500">
                  Every user authentication, verification sign-off, ingestion run, and configuration change is recorded immutably.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportAuditLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Certified JSON (SHA-256)</span>
            </button>
          </div>

          {/* Audit Logs Stream */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
              <span>Chronological Event Stream</span>
              <span>Protected Provenance</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {metrics &&
                ingestionJobs.map((j, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          INGESTION_JOB
                        </span>
                        <span className="font-mono font-bold text-slate-900">{j.id}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(j.finishedAt || j.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      Executed {j.adapter} on {j.sourceAttribution}. {j.recordsProcessed} polling units processed.
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Actor: system:ingestion_pipeline · Target: {j.id}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: STORAGE & CONTENT MANAGEMENT SYSTEM (CMS)          */}
      {/* ======================================================== */}
      {activeTab === 'storage' && <StorageContentManagementTab />}

      {/* ======================================================== */}
      {/* MODAL: CREATE USER                                        */}
      {/* ======================================================== */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Administrative User</h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Halima Usman"
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. halima.usman@electionwatch.ng"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600"
                >
                  <option value="REGISTERED_OBSERVER">Registered Observer</option>
                  <option value="RESULT_VERIFIER">Verification Officer (RESULT_VERIFIER)</option>
                  <option value="MONITORING_COORDINATOR">Monitoring Coordinator</option>
                  <option value="STATE_COORDINATOR">State Coordinator</option>
                  <option value="LGA_COORDINATOR">LGA Coordinator</option>
                  <option value="ELECTION_ANALYST">Election Analyst</option>
                  <option value="PROJECT_ADMIN">Project Admin</option>
                  <option value="SUPER_ADMIN">System Administrator (SUPER_ADMIN)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned State</label>
                  <select
                    value={newUserForm.assignedStateCode}
                    onChange={(e) => setNewUserForm({ ...newUserForm, assignedStateCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600"
                  >
                    <option value="">National (No State restriction)</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. OBS-SW-099"
                    value={newUserForm.badge}
                    onChange={(e) => setNewUserForm({ ...newUserForm, badge: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-800 text-white font-semibold hover:bg-emerald-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT USER                                          */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit User Account</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="REGISTERED_OBSERVER">Registered Observer</option>
                  <option value="RESULT_VERIFIER">Verification Officer</option>
                  <option value="MONITORING_COORDINATOR">Monitoring Coordinator</option>
                  <option value="STATE_COORDINATOR">State Coordinator</option>
                  <option value="LGA_COORDINATOR">LGA Coordinator</option>
                  <option value="ELECTION_ANALYST">Election Analyst</option>
                  <option value="PROJECT_ADMIN">Project Admin</option>
                  <option value="SUPER_ADMIN">System Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned State</label>
                  <select
                    value={editingUser.assignedStateCode || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, assignedStateCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                  >
                    <option value="">National Scope</option>
                    {states.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge</label>
                  <input
                    type="text"
                    value={editingUser.badge || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, badge: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded bg-emerald-800 text-white font-semibold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ACCESS RESET CREDENTIALS                           */}
      {/* ======================================================== */}
      {accessResetData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-800">
              <Key className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold">Secure Access Credentials Reset</h3>
            </div>
            <p className="text-xs text-slate-600">
              A temporary password and single-use security token have been generated for{' '}
              <strong className="text-slate-900">{accessResetData.email}</strong>.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Temporary Password</span>
                <span className="font-bold text-emerald-900 select-all bg-emerald-100 px-2 py-0.5 rounded">
                  {accessResetData.temporaryPassword}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">One-Time Token</span>
                <span className="text-slate-700 text-[11px] break-all select-all">{accessResetData.resetToken}</span>
              </div>
              <div className="text-[10px] text-amber-700 pt-1">
                Valid for 24 hours. The user must rotate credentials upon first authenticated session.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAccessResetData(null)}
                className="px-4 py-1.5 rounded bg-slate-900 text-white text-xs font-semibold"
              >
                Close & Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REASSIGN DISPUTED RESULT SHEET                     */}
      {/* ======================================================== */}
      {reassignModalSheetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reassign Disputed Sheet for Dual Review</h3>
              <button onClick={() => setReassignModalSheetId(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignDisputed} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Result Sheet</label>
                <input
                  type="text"
                  disabled
                  value={reassignModalSheetId}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Secondary Verification Officer</label>
                <select
                  value={secondaryVerifierName}
                  onChange={(e) => setSecondaryVerifierName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium"
                >
                  <option value="Musa Garba (Secondary Reviewer)">Musa Garba (Secondary Reviewer - Ikeja)</option>
                  <option value="Fatima Usman (Monitoring Coordinator)">Fatima Usman (Monitoring Coordinator)</option>
                  <option value="Ngozi Eze (Project Admin Review)">Ngozi Eze (Project Admin Review)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Escalation Justification</label>
                <textarea
                  rows={3}
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignModalSheetId(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded bg-emerald-800 text-white font-semibold">
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIGURE NEW ELECTION CONTEST                     */}
      {/* ======================================================== */}
      {showCreateElectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure New Election Contest</h3>
                <p className="text-xs text-slate-500">
                  Register a new INEC election contest for real-time result collation and public dashboard monitoring.
                </p>
              </div>
              <button
                onClick={() => setShowCreateElectionModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contest Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Ondo State Governorship Election or 2027 Presidential Election"
                  value={newElectionForm.title}
                  onChange={(e) => setNewElectionForm({ ...newElectionForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contest Type</label>
                  <select
                    value={newElectionForm.electionType}
                    onChange={(e) => setNewElectionForm({ ...newElectionForm, electionType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600 font-semibold"
                  >
                    <option value="PRESIDENTIAL">Presidential Election (National)</option>
                    <option value="GOVERNORSHIP">Governorship Election (State)</option>
                    <option value="SENATORIAL">Senatorial District Election</option>
                    <option value="HOUSE_OF_REPS">House of Representatives</option>
                    <option value="STATE_ASSEMBLY">State House of Assembly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Election Date</label>
                  <input
                    type="date"
                    required
                    value={newElectionForm.date}
                    onChange={(e) => setNewElectionForm({ ...newElectionForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              {newElectionForm.electionType !== 'PRESIDENTIAL' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target State Jurisdiction</label>
                  <select
                    value={newElectionForm.stateCode}
                    onChange={(e) => setNewElectionForm({ ...newElectionForm, stateCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600 font-semibold"
                  >
                    {states.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Source Reference</label>
                <input
                  type="text"
                  required
                  value={newElectionForm.sourceReference}
                  onChange={(e) => setNewElectionForm({ ...newElectionForm, sourceReference: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateElectionModal(false)}
                  className="px-3.5 py-2 rounded border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingElection}
                  className="px-4 py-2 rounded bg-emerald-800 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingElection ? 'Saving Contest...' : 'Create & Activate Contest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
