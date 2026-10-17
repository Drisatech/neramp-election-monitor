import React, { useEffect, useState } from 'react';
import {
  Database,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Shield,
  RefreshCw,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import {
  fetchIngestionStatus,
  triggerIngestionRun,
  fetchIngestionJobs,
  fetchAuditLogs,
  setDataSourceMode,
  testSourceConnection,
  fetchSchedulerConfig,
  updateSchedulerConfig,
} from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const AdminIngestionPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [scheduler, setScheduler] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);

  // Manual Trigger options
  const [selectedAdapter, setSelectedAdapter] = useState<'InecApprovedSourceAdapter' | 'DevelopmentFixtureAdapter'>(
    'InecApprovedSourceAdapter'
  );
  const [selectedElection, setSelectedElection] = useState('elec-2026-gov-osun');

  const loadAll = async () => {
    try {
      const [stRes, jbRes, adRes, scRes] = await Promise.all([
        fetchIngestionStatus(),
        fetchIngestionJobs(),
        fetchAuditLogs(),
        fetchSchedulerConfig(),
      ]);
      setStatusData(stRes.data);
      setJobs(jbRes.data);
      setAuditLogs(adRes.data);
      setScheduler(scRes.data);
    } catch (err) {
      console.error('Failed to load admin ingestion data:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTestConnection = async () => {
    try {
      setIsTestingConn(true);
      setHealthResult(null);
      const res = await testSourceConnection(selectedAdapter);
      setHealthResult(res.data);
    } catch (err: any) {
      setHealthResult({
        status: 'ERROR',
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleTriggerRun = async () => {
    try {
      setIsRunning(true);
      setTriggerSuccess(null);
      const res = await triggerIngestionRun(selectedAdapter, selectedElection);
      setTriggerSuccess(
        `Ingestion run #${res.data.id} completed. ${res.data.recordsProcessed} polling units processed from ${res.data.sourceAttribution}.`
      );
      await loadAll();
    } catch (err: any) {
      setTriggerSuccess(`Ingestion failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleModeChange = async (newMode: string) => {
    try {
      await setDataSourceMode(newMode);
      await loadAll();
    } catch (err) {
      console.error('Failed to update mode:', err);
    }
  };

  const handleSchedulerToggle = async (enabled: boolean) => {
    try {
      const res = await updateSchedulerConfig({ enabled });
      setScheduler(res.data);
    } catch (err) {
      console.error('Failed to update scheduler:', err);
    }
  };

  const handleSchedulerInterval = async (minutes: number) => {
    try {
      const res = await updateSchedulerConfig({ intervalMinutes: minutes });
      setScheduler(res.data);
    } catch (err) {
      console.error('Failed to update scheduler interval:', err);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner lastUpdated={statusData?.lastSuccessfulRetrieval} />

      {/* Header & Main Ingestion Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            INEC Source Integration & Ingestion Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Authorised data feed management for official election results and polling unit result sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTestingConn ? 'Checking...' : 'Source Connection Health Check'}</span>
          </button>
        </div>
      </div>

      {/* Trigger Notification */}
      {triggerSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-md border border-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{triggerSuccess}</span>
        </div>
      )}

      {/* Connection Diagnostic Result Box */}
      {healthResult && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Source Health Check Result: {healthResult.targetElection}</span>
            </span>
            <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
              {healthResult.status} ({healthResult.latencyMs}ms)
            </span>
          </div>
          <div className="text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div><strong>Portal URL:</strong> {healthResult.portalUrl}</div>
            <div><strong>Rate Limit:</strong> {healthResult.rateLimitQuota}</div>
            <div><strong>Auth Status:</strong> {healthResult.authMode}</div>
          </div>
          <p className="text-slate-700 italic pt-1">{healthResult.message}</p>
        </div>
      )}

      {/* Integration Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Authorised Source Connection Status */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Authorised INEC Integration Details
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Authorised Portal: {statusData?.officialPortalUrl}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Mode:</span>
              <select
                value={statusData?.currentMode || 'OFFICIAL_SOURCE'}
                onChange={(e) => handleModeChange(e.target.value)}
                className="bg-slate-50 border border-slate-300 font-bold rounded px-2 py-1 text-slate-900 focus:outline-emerald-600 text-xs"
              >
                <option value="OFFICIAL_SOURCE">OFFICIAL_SOURCE (INEC IReV Portal)</option>
                <option value="DEVELOPMENT">DEVELOPMENT (Demonstration Fixtures)</option>
                <option value="HISTORICAL">HISTORICAL (Archived Datasets)</option>
                <option value="MANUAL_IMPORT">MANUAL_IMPORT (Admin File Upload)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Target Election</span>
              <span className="font-bold text-slate-900 block mt-1 leading-snug">
                Governorship (2026-08-15 - OSUN)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Connection State</span>
              <span className="font-bold text-emerald-800 block mt-1">
                {statusData?.connectionStatus?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Rate Limit Quota</span>
              <span className="font-bold text-slate-900 block mt-1 font-mono">
                {statusData?.rateLimit || '60 req/min'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Last Successful Retrieval</span>
              <span className="font-bold text-slate-900 block mt-1 font-mono text-[11px]">
                {statusData?.lastSuccessfulRetrieval
                  ? new Date(statusData.lastSuccessfulRetrieval).toLocaleTimeString()
                  : '18:35:00'}{' '}
                WAT
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900">Official Specification Notes:</div>
            <p className="text-slate-600">
              1. <strong>Field Mapping:</strong> INEC IReV Delimitation codes map to canonical zero-padded Polling Unit codes (e.g. <code>29-24-01-001</code>).
            </p>
            <p className="text-slate-600">
              2. <strong>Document Cryptography:</strong> Every EC8A form URL is hashed via SHA-256 upon retrieval to verify provenance and support revised version tracking.
            </p>
            <p className="text-slate-600">
              3. <strong>Rate Limiting & Retries:</strong> Enforces minimum 1.0s spacing between requests with exponential backoff on HTTP 429/503.
            </p>
          </div>
        </div>

        {/* Right: Configurable Scheduled Ingestion Service */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>Configurable Scheduled Ingestion</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                scheduler?.enabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {scheduler?.enabled ? 'SERVICE RUNNING' : 'STOPPED'}
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Background worker service periodically queries the official source adapter to retrieve newly published polling-unit result sheets.
          </p>

          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Service Status</span>
              <button
                onClick={() => handleSchedulerToggle(!scheduler?.enabled)}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                  scheduler?.enabled
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {scheduler?.enabled ? 'Pause Scheduler' : 'Activate Scheduler'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Polling Interval</span>
              <select
                value={scheduler?.intervalMinutes || 5}
                onChange={(e) => handleSchedulerInterval(Number(e.target.value))}
                className="bg-white border border-slate-300 font-semibold rounded px-2 py-1 text-slate-900 text-xs"
              >
                <option value={1}>Every 1 minute</option>
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 60 minutes</option>
              </select>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1 font-mono text-[11px] text-slate-600">
              <div>Last Execution: {scheduler?.lastRunAt ? new Date(scheduler.lastRunAt).toLocaleTimeString() : '18:35:00'} WAT</div>
              <div>Next Execution: {scheduler?.nextRunAt ? new Date(scheduler.nextRunAt).toLocaleTimeString() : '18:40:00'} WAT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Ingestion Command for Authorized Administrators */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
          Manual Ingestion Command for Authorised Administrators
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Target Adapter</label>
            <select
              value={selectedAdapter}
              onChange={(e) => setSelectedAdapter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-emerald-600"
            >
              <option value="InecApprovedSourceAdapter">
                InecApprovedSourceAdapter (Official Portal Integration)
              </option>
              <option value="DevelopmentFixtureAdapter">
                DevelopmentFixtureAdapter (Demonstration Data Only)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Target Election Contest</label>
            <select
              value={selectedElection}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-emerald-600"
            >
              <option value="elec-2026-gov-osun">
                Governorship election - 2026-08-15 - OSUN
              </option>
              <option value="elec-2027-pres">
                2027 Presidential General Election (Demonstration)
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTriggerRun}
              disabled={isRunning}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Executing Ingestion Pipeline...' : 'Execute Manual Ingestion'}</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Manual ingestion triggers execute idempotent syndication. Duplicate result sheets (identical SHA-256 hash) are automatically skipped, and revisions trigger automated document version increments.
        </p>
      </div>

      {/* Ingestion Jobs & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ingestion Jobs History */}
        <div className="lg:col-span-6 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
            Ingestion Pipeline Execution History
          </h3>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{job.id}</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {job.status}
                  </span>
                </div>
                <div className="text-slate-700 font-medium">{job.sourceAttribution || job.adapter}</div>
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>
                    Processed: {job.recordsProcessed} · Discrepancies: {job.discrepanciesDetected || 0}
                  </span>
                  <span>{new Date(job.startedAt).toLocaleTimeString()} WAT</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="lg:col-span-6 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
            Immutable Audit Trail & Retrieval Logs
          </h3>
          <div className="space-y-2">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()} WAT
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{log.details}</p>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Actor: {log.actor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
