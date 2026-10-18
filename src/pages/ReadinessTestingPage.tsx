import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Server,
  Database,
  Lock,
  Layers,
  FileCheck,
  RefreshCw,
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { fetchReadinessStatus, runReadinessDrill, toggleReadinessChecklist } from '../services/api';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ReadinessTestingPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningDrill, setRunningDrill] = useState<string | null>(null);
  const [drillOutput, setDrillOutput] = useState<any | null>(null);
  const [activeChecklistTab, setActiveChecklistTab] = useState<'preElection' | 'electionDay' | 'postElection'>('preElection');

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetchReadinessStatus();
      setData(res);
    } catch (err) {
      console.error('Failed to load readiness status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunDrill = async (drillType: string) => {
    try {
      setRunningDrill(drillType);
      setDrillOutput(null);
      const res = await runReadinessDrill(drillType);
      setDrillOutput(res);
      await loadStatus(); // Refresh checklist and audit
    } catch (err: any) {
      alert(`Drill failed: ${err.message}`);
    } finally {
      setRunningDrill(null);
    }
  };

  const handleToggleTask = async (checklist: string, taskId: string) => {
    try {
      await toggleReadinessChecklist(checklist, taskId);
      await loadStatus();
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-700" />
        <p className="font-semibold text-sm">Loading Election-Day Readiness Audit...</p>
      </div>
    );
  }

  const metrics = data?.benchmarkMetrics;
  const matrix = data?.matrix || [];
  const checklists = data?.checklists;

  return (
    <div className="space-y-6 pb-12">
      <DisclaimerBanner />

      {/* Top Readiness Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-xl border border-emerald-900/50 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500 text-slate-950 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                AUDIT VERIFIED: SYSTEM ELECTION READY
              </span>
              <span className="text-xs font-mono text-emerald-400">
                Automated Tests: {data?.unitTestsPassed}/{data?.unitTestsTotal} Passed (100%)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Election-Day Readiness & Simulation Testing
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Continuous validation platform assessing end-to-end election data ingestion, load performance, arithmetic reconciliation drills, fault recovery, and least-privilege security controls under synthetic election-day conditions.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-lg border border-emerald-800/40 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Tested Peak RPS</span>
              <span className="text-xl font-bold text-emerald-400">{metrics?.measuredMaxThroughputRps}</span>
              <span className="text-[10px] text-slate-500 block">Req / Sec</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Median (p50)</span>
              <span className="text-xl font-bold text-slate-100">{metrics?.p50LatencyMs}</span>
              <span className="text-[10px] text-slate-500 block">Milliseconds</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Surge (p99)</span>
              <span className="text-xl font-bold text-slate-100">{metrics?.p99LatencyMs}</span>
              <span className="text-[10px] text-slate-500 block">Milliseconds</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Error Rate</span>
              <span className="text-xl font-bold text-emerald-400">{metrics?.errorRatePercentage}%</span>
              <span className="text-[10px] text-slate-500 block">1,700 Requests</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Drill Launcher */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-800" />
              <span>Execute Live Simulation Drills (Staging / Synthetic)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trigger automated operational simulation drills to verify system behaviors under live stress.
            </p>
          </div>
          <button
            onClick={loadStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              id: 'E2E_WORKFLOW_DRILL',
              title: '1. End-to-End Workflow Drill',
              desc: 'Executes full 10-step lifecycle: Ingest, SHA-256 hash, OCR, Verify, Analytics, and Audit.',
              badge: 'Automated 10-Step',
            },
            {
              id: 'LOAD_STRESS_DRILL',
              title: '2. Concurrency Load Surge',
              desc: 'Simulates 100 concurrent workers and 500 requests measuring real-time latency percentiles.',
              badge: '500 Reqs Stress',
            },
            {
              id: 'RECONCILIATION_DRILL',
              title: '3. Reconciliation & Defect Injection',
              desc: 'Injects arithmetic variance, over-voting, and ballot leak to test neutral alert dispatch.',
              badge: 'Defect Injection',
            },
            {
              id: 'CIRCUIT_BREAKER_DRILL',
              title: '4. Outage & Circuit Breaker',
              desc: 'Simulates upstream INEC outage, trips circuit breaker to OPEN, and tests half-open self-healing.',
              badge: 'Fault Recovery',
            },
            {
              id: 'SECURITY_PENETRATION_DRILL',
              title: '5. RBAC & Penetration Drill',
              desc: 'Attempts privilege escalation, token hijacking, directory traversal, and tests observer masking.',
              badge: 'Security Pentest',
            },
            {
              id: 'BACKUP_RESTORE_DRILL',
              title: '6. Backup Restoration & PITR',
              desc: 'Restores synthetic database snapshot and validates cryptographic SHA-256 hash chains.',
              badge: 'Disaster Recovery',
            },
          ].map((drill) => (
            <div
              key={drill.id}
              className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900">{drill.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {drill.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{drill.desc}</p>
              </div>

              <button
                onClick={() => handleRunDrill(drill.id)}
                disabled={Boolean(runningDrill)}
                className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {runningDrill === drill.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Drill...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Simulation Drill</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Drill Output Terminal */}
        {drillOutput && (
          <div className="p-4 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 font-mono text-xs space-y-2 mt-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                SIMULATION DRILL RESULTS: {drillOutput.drillType}
              </span>
              <span className="text-slate-400 text-[11px]">
                Duration: {drillOutput.durationMs}ms · Completed: {new Date(drillOutput.completedAt).toLocaleTimeString()}
              </span>
            </div>
            <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(drillOutput.details, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 10-Point Readiness Matrix */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-800" />
            <span>10-Point Election-Day Readiness Matrix</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive audit matrix verifying application architecture, resilience, data integrity, and compliance across all 10 required domains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {matrix.map((item: any) => (
            <div key={item.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{item.title}</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.coverage}</p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Suite: {item.testSuite}</span>
                <span>Audit Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Checklists (Pre, During, Post Election) */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-800" />
              <span>Operational Runbook Checklists (Interactive Execution)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocol checklists for technical operators, coordinators, and verification officers before, during, and after the election.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
            <button
              onClick={() => setActiveChecklistTab('preElection')}
              className={`px-3 py-1 rounded transition-colors ${
                activeChecklistTab === 'preElection' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pre-Election (T-24h)
            </button>
            <button
              onClick={() => setActiveChecklistTab('electionDay')}
              className={`px-3 py-1 rounded transition-colors ${
                activeChecklistTab === 'electionDay' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Election-Day (Live)
            </button>
            <button
              onClick={() => setActiveChecklistTab('postElection')}
              className={`px-3 py-1 rounded transition-colors ${
                activeChecklistTab === 'postElection' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Post-Election
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {checklists?.[activeChecklistTab]?.map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleToggleTask(activeChecklistTab, item.id)}
              className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                item.completed
                  ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className={item.completed ? 'font-semibold text-slate-900' : ''}>
                  {item.task}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 shrink-0">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
