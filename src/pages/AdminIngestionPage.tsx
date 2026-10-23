import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Play,
  Pause,
  Square,
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
  Trash2,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  HardDrive,
  Radio,
  Timer,
  CopyX,
  History,
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
  purgeDemonstrationData,
  triggerBatchOcrTranscription,
  uploadAndTranscribeFormEc8a,
  fetchLoopExtractionStatus,
  startLiveLoopExtraction,
  pauseLiveLoopExtraction,
  stopLiveLoopExtraction,
  triggerLoopExtractionNow,
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

  // Live Collation Loop Extraction State
  const [loopStatus, setLoopStatus] = useState<any>(null);
  const [loopIntervalMinutes, setLoopIntervalMinutes] = useState<number>(2);
  const [isLoopActionRunning, setIsLoopActionRunning] = useState(false);
  const [loopFeedback, setLoopFeedback] = useState<string | null>(null);
  const [secondsUntilNextCycle, setSecondsUntilNextCycle] = useState<number | null>(null);

  const [maxWards, setMaxWards] = useState<number>(20);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);

  // Gemini Vision AI OCR states
  const [isBatchOcrRunning, setIsBatchOcrRunning] = useState(false);
  const [batchOcrNotice, setBatchOcrNotice] = useState<string | null>(null);
  const [isUploadingSheet, setIsUploadingSheet] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadedResultData, setUploadedResultData] = useState<{
    puId: string;
    puCode: string;
    puName: string;
    validVotes: number;
    verificationUrl: string;
  } | null>(null);

  // Manual Trigger options
  const [selectedAdapter, setSelectedAdapter] = useState<'InecApprovedSourceAdapter' | 'DevelopmentFixtureAdapter'>(
    'InecApprovedSourceAdapter'
  );
  const [selectedElection, setSelectedElection] = useState('elec-2026-gov-osun');

  const loadLoopStatus = async () => {
    try {
      const res = await fetchLoopExtractionStatus();
      setLoopStatus(res.data);
      if (res.data?.intervalSeconds) {
        setLoopIntervalMinutes(Math.max(1, Math.round(res.data.intervalSeconds / 60)));
      }
    } catch (err) {
      // Loop status load failure non-fatal
    }
  };

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
      await loadLoopStatus();
    } catch (err) {
      console.error('Failed to load admin ingestion data:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Poll loop extraction status periodically
  useEffect(() => {
    const timer = setInterval(() => {
      loadLoopStatus();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown timer to next loop cycle
  useEffect(() => {
    if (!loopStatus?.isRunning || loopStatus?.isPaused || !loopStatus?.nextRunAt) {
      setSecondsUntilNextCycle(null);
      return;
    }

    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((new Date(loopStatus.nextRunAt).getTime() - Date.now()) / 1000));
      setSecondsUntilNextCycle(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [loopStatus]);

  // Live Loop Extraction Handlers
  const handleStartLoop = async () => {
    try {
      setIsLoopActionRunning(true);
      setLoopFeedback(null);
      const res = await startLiveLoopExtraction(loopIntervalMinutes * 60, selectedElection);
      setLoopStatus(res.data);
      setLoopFeedback(`Live Loop Extraction started: querying INEC portal every ${loopIntervalMinutes} minute(s).`);
      await loadAll();
    } catch (err: any) {
      setLoopFeedback(`Failed to start loop: ${err.message}`);
    } finally {
      setIsLoopActionRunning(false);
    }
  };

  const handlePauseLoop = async () => {
    try {
      setIsLoopActionRunning(true);
      const res = await pauseLiveLoopExtraction();
      setLoopStatus(res.data);
      setLoopFeedback('Live Loop Extraction paused.');
    } catch (err: any) {
      setLoopFeedback(`Failed to pause loop: ${err.message}`);
    } finally {
      setIsLoopActionRunning(false);
    }
  };

  const handleStopLoop = async () => {
    try {
      setIsLoopActionRunning(true);
      const res = await stopLiveLoopExtraction();
      setLoopStatus(res.data);
      setLoopFeedback('Live Loop Extraction stopped.');
      setSecondsUntilNextCycle(null);
    } catch (err: any) {
      setLoopFeedback(`Failed to stop loop: ${err.message}`);
    } finally {
      setIsLoopActionRunning(false);
    }
  };

  const handleTriggerLoopNow = async () => {
    try {
      setIsLoopActionRunning(true);
      const res = await triggerLoopExtractionNow();
      setLoopStatus(res.data);
      setLoopFeedback(res.message);
      await loadAll();
    } catch (err: any) {
      setLoopFeedback(`Manual cycle execution failed: ${err.message}`);
    } finally {
      setIsLoopActionRunning(false);
    }
  };

  const handlePurgeDemo = async () => {
    try {
      setIsPurging(true);
      setPurgeSuccess(null);
      const res = await purgeDemonstrationData();
      setPurgeSuccess(res.message);
      await loadAll();
    } catch (err: any) {
      setPurgeSuccess(`Purge failed: ${err.message}`);
    } finally {
      setIsPurging(false);
    }
  };

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
      const res = await triggerIngestionRun(selectedAdapter, selectedElection, maxWards);
      const processed = res.data?.recordsProcessed || 0;
      const skipped = res.data?.duplicatesSkipped || 0;
      const revised = res.data?.revisedCount || 0;
      setTriggerSuccess(
        `Ingestion run completed: ${processed} new polling unit(s) uploaded, ${skipped} existing unchanged unit(s) skipped to prevent duplicates, ${revised} altered result sheet(s) versioned.`
      );
      await loadAll();
    } catch (err: any) {
      setTriggerSuccess(`Ingestion failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleBatchOcr = async () => {
    try {
      setIsBatchOcrRunning(true);
      setBatchOcrNotice(null);
      const res = await triggerBatchOcrTranscription(selectedElection, 6);
      setBatchOcrNotice(res.message);
      await loadAll();
    } catch (err: any) {
      setBatchOcrNotice(`Batch OCR error: ${err.message}`);
    } finally {
      setIsBatchOcrRunning(false);
    }
  };

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingSheet(true);
      setUploadNotice(null);
      setUploadedResultData(null);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string) || '';
          const res = await uploadAndTranscribeFormEc8a({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
            fileName: file.name,
            electionId: selectedElection,
          });
          setUploadNotice(`✅ ${res.message}`);
          if (res.data?.pollingUnit) {
            setUploadedResultData({
              puId: res.data.pollingUnit.id,
              puCode: res.data.pollingUnit.code,
              puName: res.data.pollingUnit.name,
              validVotes: res.data.resultSheet?.transcription?.validVotes || 0,
              verificationUrl: res.data.verificationUrl || `/polling-units/${res.data.pollingUnit.id}?tab=workspace`,
            });
          }
          await loadAll();
        } catch (err: any) {
          setUploadNotice(`❌ Upload transcription failed: ${err.message}`);
        } finally {
          setIsUploadingSheet(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadNotice(`❌ Error reading file: ${err.message}`);
      setIsUploadingSheet(false);
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
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-ocr-settings'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Configure Gemini Vision AI OCR engine, rate limits, latency diagnostics, and API keys"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>AI OCR Settings</span>
          </button>
          <Link
            to="/admin?tab=storage"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-semibold transition-colors shadow-2xs"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage & Content Management</span>
          </Link>
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

        {/* Right: Live Loop Extraction Engine for Ongoing Election Result Collation */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
                <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Live Loop Extraction Engine
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Live ongoing election result collation
                </span>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                loopStatus?.isRunning && !loopStatus?.isPaused
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : loopStatus?.isPaused
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  loopStatus?.isRunning && !loopStatus?.isPaused
                    ? 'bg-emerald-500 animate-ping'
                    : loopStatus?.isPaused
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>
                {loopStatus?.isRunning && !loopStatus?.isPaused
                  ? 'ACTIVE LOOP'
                  : loopStatus?.isPaused
                  ? 'PAUSED'
                  : 'IDLE / STOPPED'}
              </span>
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Continuously polls the official INEC portal based on a schedule timer to capture freshly uploaded results during live election collation. Polling units already in the system are skipped to prevent duplicate records, while altered sheets trigger automated version history logging.
          </p>

          {/* Feedback banner */}
          {loopFeedback && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded font-medium flex items-center justify-between">
              <span>{loopFeedback}</span>
              <button onClick={() => setLoopFeedback(null)} className="text-emerald-700 font-bold hover:text-emerald-900 ml-2">×</button>
            </div>
          )}

          {/* Schedule Timer Config */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Collation Loop Interval
              </label>
              <select
                value={loopIntervalMinutes}
                onChange={(e) => setLoopIntervalMinutes(Number(e.target.value))}
                disabled={loopStatus?.isRunning}
                className="w-full bg-white border border-slate-300 font-semibold rounded px-2 py-1 text-slate-900 text-xs disabled:opacity-60"
              >
                <option value={1}>Every 1 minute (Fast)</option>
                <option value={2}>Every 2 minutes (Recommended)</option>
                <option value={3}>Every 3 minutes</option>
                <option value={5}>Every 5 minutes</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
              </select>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Target Contest
              </label>
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                disabled={loopStatus?.isRunning}
                className="w-full bg-white border border-slate-300 font-semibold rounded px-2 py-1 text-slate-900 text-xs disabled:opacity-60"
              >
                <option value="elec-2026-gov-osun">Osun Gov 2026 (Live)</option>
                <option value="elec-2026-gov-ekiti">Ekiti Gov 2026 (Live)</option>
              </select>
            </div>
          </div>

          {/* Real-time Countdown Banner */}
          {loopStatus?.isRunning && !loopStatus?.isPaused && (
            <div className="p-2.5 bg-emerald-900 text-white rounded-lg flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-300 animate-spin" />
                <span className="text-xs font-semibold">Next Loop Extraction Cycle:</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-700">
                {secondsUntilNextCycle !== null ? `${secondsUntilNextCycle}s remaining` : 'Calculating...'}
              </span>
            </div>
          )}

          {/* Loop Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Cycles</span>
              <span className="text-base font-bold text-slate-900 block mt-0.5 font-mono">
                {loopStatus?.currentCycle || 0}
              </span>
            </div>

            <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 uppercase font-bold block">New PUs</span>
              <span className="text-base font-bold text-emerald-800 block mt-0.5 font-mono">
                {loopStatus?.newlyUploadedCount || 0}
              </span>
            </div>

            <div className="p-2 bg-blue-50 rounded border border-blue-200" title="Existing polling units skipped to avoid duplicate entries">
              <span className="text-[10px] text-blue-700 uppercase font-bold block flex items-center justify-center gap-0.5">
                <CopyX className="w-2.5 h-2.5" />
                <span>Skipped</span>
              </span>
              <span className="text-base font-bold text-blue-800 block mt-0.5 font-mono">
                {loopStatus?.duplicatesSkippedCount || 0}
              </span>
            </div>

            <div className="p-2 bg-amber-50 rounded border border-amber-200" title="Altered results uploaded with version history recorded">
              <span className="text-[10px] text-amber-700 uppercase font-bold block flex items-center justify-center gap-0.5">
                <History className="w-2.5 h-2.5" />
                <span>Revised</span>
              </span>
              <span className="text-base font-bold text-amber-800 block mt-0.5 font-mono">
                {loopStatus?.revisedVersionCount || 0}
              </span>
            </div>
          </div>

          {/* Loop Control Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {!loopStatus?.isRunning ? (
              <button
                onClick={handleStartLoop}
                disabled={isLoopActionRunning}
                className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Live Extraction Loop</span>
              </button>
            ) : (
              <>
                <button
                  onClick={loopStatus?.isPaused ? handleStartLoop : handlePauseLoop}
                  disabled={isLoopActionRunning}
                  className={`flex-1 py-2 px-3 rounded font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer ${
                    loopStatus?.isPaused
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {loopStatus?.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{loopStatus?.isPaused ? 'Resume Loop' : 'Pause Loop'}</span>
                </button>

                <button
                  onClick={handleStopLoop}
                  disabled={isLoopActionRunning}
                  className="py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </>
            )}

            <button
              onClick={handleTriggerLoopNow}
              disabled={isLoopActionRunning}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-slate-300 cursor-pointer"
              title="Execute an extraction cycle immediately without waiting for the timer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoopActionRunning ? 'animate-spin' : ''}`} />
              <span>Poll Now</span>
            </button>
          </div>

          {/* Loop Recent Execution Log */}
          {loopStatus?.log && loopStatus.log.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Recent Loop Collation Activity
              </span>
              <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] font-mono">
                {loopStatus.log.slice(0, 5).map((entry: any, idx: number) => (
                  <div key={idx} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">Cycle #{entry.cycle}:</span>{' '}
                      <span className="text-emerald-700 font-semibold">+{entry.newlyUploaded} new</span>,{' '}
                      <span className="text-blue-700">{entry.duplicatesSkipped} skipped</span>,{' '}
                      <span className="text-amber-700">{entry.revisedVersionCount} revised</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Clean-Slate: Purge Demo Fixtures */}
      <div className="bg-amber-50/70 p-5 rounded-lg border border-amber-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Production Clean-Slate: Purge Demo Fixtures</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Remove all non-official demo fixtures and reset the system to live official INEC election results only (Ekiti and Osun State).
            </p>
          </div>

          <button
            onClick={handlePurgeDemo}
            disabled={isPurging}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPurging ? 'Purging Demo Data...' : 'Purge All Demo Data'}</span>
          </button>
        </div>

        {purgeSuccess && (
          <div className="p-3 bg-white rounded border border-amber-300 text-xs text-emerald-800 font-medium">
            ✅ {purgeSuccess}
          </div>
        )}
      </div>

      {/* Gemini Vision AI OCR Transcription Engine */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-lg border border-emerald-700 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800/80 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Gemini Vision AI OCR Engine (INEC Form EC8A Transcription)</span>
                <span className="text-[10px] font-mono bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded border border-emerald-600">
                  gemini-3.5-flash-lite · Active
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Machine reads handwritten votes in figures, words, and ballot accounting box (#1 to #8) from official Form EC8A scans.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-ocr-settings'))}
              className="px-3.5 py-1.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-100 hover:text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 border border-teal-500/40 shadow-xs cursor-pointer"
              title="Configure Gemini Vision AI OCR engine, rate limits, latency diagnostics, and API keys"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Configure AI OCR / API Key</span>
            </button>

            <button
              onClick={handleBatchOcr}
              disabled={isBatchOcrRunning}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isBatchOcrRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isBatchOcrRunning ? 'Transcribing Batch...' : 'Run Batch Gemini AI OCR (6 Sheets)'}</span>
            </button>

            <label className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer">
              <UploadCloud className="w-3.5 h-3.5 text-teal-300" />
              <span>{isUploadingSheet ? 'Processing Image...' : 'Upload & Transcribe Form EC8A'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isUploadingSheet}
                onChange={handleDirectFileUpload}
              />
            </label>
          </div>
        </div>

        {batchOcrNotice && (
          <div className="p-3 bg-emerald-800/60 border border-emerald-500 text-emerald-100 rounded text-xs font-semibold flex items-center justify-between">
            <span>{batchOcrNotice}</span>
            <button onClick={() => setBatchOcrNotice(null)} className="text-emerald-300 hover:text-white">×</button>
          </div>
        )}

        {uploadNotice && (
          <div className="p-3 bg-slate-800/90 border border-emerald-500 text-emerald-100 rounded text-xs font-semibold flex items-center justify-between">
            <span>{uploadNotice}</span>
            <button onClick={() => setUploadNotice(null)} className="text-emerald-300 hover:text-white">×</button>
          </div>
        )}

        {uploadedResultData && (
          <div className="p-4 bg-emerald-950/90 border-2 border-emerald-400 rounded-lg text-xs space-y-2.5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white text-sm">
                    Result Sheet Ingested: {uploadedResultData.puName} ({uploadedResultData.puCode})
                  </span>
                  <span className="block text-[11px] text-emerald-200 mt-0.5">
                    Total Valid Votes: {uploadedResultData.validVotes.toLocaleString()} · Status: Awaiting Verification Review
                  </span>
                </div>
              </div>
              <Link
                to={uploadedResultData.verificationUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded text-xs shadow-md transition-all uppercase tracking-wide"
              >
                <span>Open Result Verification Page →</span>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-2.5 bg-black/30 rounded border border-emerald-900/60">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">1. Form Identification</span>
            <span className="text-slate-200 block mt-0.5">Detects Form S/N, State, LGA, Ward, and PU code.</span>
          </div>
          <div className="p-2.5 bg-black/30 rounded border border-emerald-900/60">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">2. Dual Column Cross-Verification</span>
            <span className="text-slate-200 block mt-0.5">Validates "In Figures" vs "In Words" (e.g. 100 vs ONE HUNDRED).</span>
          </div>
          <div className="p-2.5 bg-black/30 rounded border border-emerald-900/60">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">3. Arithmetic Verification</span>
            <span className="text-slate-200 block mt-0.5">Enforces Valid + Rejected = Cast, and checks vs Accredited Voters.</span>
          </div>
        </div>
      </div>

      {/* Manual Ingestion Command for Authorized Administrators */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
          Manual Ingestion Command for Authorised Administrators
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Target Adapter</label>
            <select
              value={selectedAdapter}
              onChange={(e) => setSelectedAdapter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-emerald-600"
            >
              <option value="InecApprovedSourceAdapter">
                InecApprovedSourceAdapter (Official INEC Portal Integration)
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
                Governorship election - 2026-08-15 - OSUN (Official Live)
              </option>
              <option value="elec-2026-gov-ekiti">
                Governorship election - 2026-06-20 - EKITI (Official Live)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Ingestion Batch Size</label>
            <select
              value={maxWards}
              onChange={(e) => setMaxWards(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-emerald-600"
            >
              <option value={5}>5 Wards (~35 Polling Units)</option>
              <option value={10}>10 Wards (~70 Polling Units)</option>
              <option value={20}>20 Wards (~140 Polling Units)</option>
              <option value={50}>50 Wards (~350 Polling Units)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTriggerRun}
              disabled={isRunning}
              className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Executing Ingestion Pipeline...' : 'Execute Manual Ingestion'}</span>
            </button>
          </div>
        </div>

        {triggerSuccess && (
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900 font-semibold">
            {triggerSuccess}
          </div>
        )}

        <div className="p-3 bg-emerald-50/80 rounded border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Automatic Duplicate Avoidance & Version History Tracking Active</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            When manually pulling already concluded results batch by batch from INEC portal, polling units already uploaded are automatically skipped to avoid duplicate entries. If a result has been altered or updated on the INEC portal, it is re-ingested with an automated version history record without overwriting previous audit data.
          </p>
        </div>
      </div>

      {/* Ingestion Jobs & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ingestion Jobs History */}
        <div className="lg:col-span-6 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">
            Ingestion Pipeline Execution History
          </h3>
          <div className="space-y-2">
            {jobs.map((job: any) => (
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
            {auditLogs.slice(0, 10).map((log: any) => (
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
