import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { fetchPollingUnits, triggerBatchOcrTranscription } from '../services/api';
import { PollingUnit } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const VerificationQueuePage: React.FC = () => {
  const { selectedElectionId } = useElection();
  const [queue, setQueue] = useState<PollingUnit[]>([]);
  const [filterType, setFilterType] = useState<'PENDING' | 'DISCREPANCY' | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchOcrRunning, setIsBatchOcrRunning] = useState(false);
  const [batchOcrNotice, setBatchOcrNotice] = useState<string | null>(null);
  const [inspectingPu, setInspectingPu] = useState<PollingUnit | null>(null);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const res = await fetchPollingUnits({
        electionId: selectedElectionId,
        uploadStatus: 'UPLOADED',
        limit: 100,
      });
      // Sort strictly by recently uploaded result time/date in INEC portal (most recent at the top)
      const sorted = [...(res.data || [])].sort((a, b) => {
        const timeA = new Date(a.sourceUploadTimestamp || a.lastRetrievedTimestamp || 0).getTime();
        const timeB = new Date(b.sourceUploadTimestamp || b.lastRetrievedTimestamp || 0).getTime();
        return timeB - timeA;
      });
      setQueue(sorted);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedElectionId]);

  const handleBatchOcr = async () => {
    try {
      setIsBatchOcrRunning(true);
      setBatchOcrNotice(null);
      const res = await triggerBatchOcrTranscription(selectedElectionId, 6);
      setBatchOcrNotice(res.message);
      await loadQueue();
    } catch (err: any) {
      setBatchOcrNotice(`Batch OCR error: ${err.message}`);
    } finally {
      setIsBatchOcrRunning(false);
    }
  };

  const filtered = queue
    .filter((pu) => {
      if (filterType === 'PENDING') return pu.verificationStatus === 'PENDING_VERIFICATION';
      if (filterType === 'DISCREPANCY') return pu.verificationStatus === 'DISCREPANCY_FLAGGED';
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.sourceUploadTimestamp || a.lastRetrievedTimestamp || 0).getTime();
      const timeB = new Date(b.sourceUploadTimestamp || b.lastRetrievedTimestamp || 0).getTime();
      return timeB - timeA;
    });

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Result Transcription Verification Queue
            </h1>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
              Arranged by Latest INEC Portal Upload
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Side-by-side verification workflow. Results are arranged with the most recently uploaded sheets in the INEC Results Portal at the top of the log.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBatchOcr}
            disabled={isBatchOcrRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded text-xs font-bold transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Batch transcribe pending Form EC8A result sheets using Gemini Vision AI OCR"
          >
            {isBatchOcrRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isBatchOcrRunning ? 'Running OCR...' : 'Batch Transcribe with Gemini AI'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-ocr-settings'))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold transition-colors cursor-pointer"
            title="Configure Gemini Models and attach custom Paid API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>AI OCR Settings</span>
          </button>

          {/* Filter Segmented Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Uploaded Sheets
            </button>
            <button
              onClick={() => setFilterType('PENDING')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                filterType === 'PENDING' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Awaiting Review
            </button>
            <button
              onClick={() => setFilterType('DISCREPANCY')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                filterType === 'DISCREPANCY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Discrepancies Flagged
            </button>
          </div>
        </div>
      </div>

      {batchOcrNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchOcrNotice}</span>
          </div>
          <button onClick={() => setBatchOcrNotice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white p-12 rounded-lg border border-slate-200 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Loading verification queue and Form EC8A result sheets...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-slate-200 text-center text-slate-500">
          <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Sheets in Selected Verification Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            All uploaded result sheets have either been verified or match other filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pu, idx) => {
            const uploadDate = pu.sourceUploadTimestamp
              ? new Date(pu.sourceUploadTimestamp).toLocaleString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'Unknown Time';

            return (
              <div
                key={pu.id}
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{pu.code}</span>
                    <span className="text-xs text-slate-600 font-medium">· {pu.name}</span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>INEC Upload: {uploadDate}</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {pu.stateCode} State · {pu.lgaCode} LGA · Registered: {pu.registeredVoters} · Accredited: {pu.accreditedVoters}
                  </div>
                </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    pu.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : pu.verificationStatus === 'DISCREPANCY_FLAGGED'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-sky-50 text-sky-800 border border-sky-200'
                  }`}
                >
                  {pu.verificationStatus.replace(/_/g, ' ')}
                </span>

                <button
                  type="button"
                  onClick={() => setInspectingPu(pu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition-colors cursor-pointer"
                  title="Inspect Form EC8A document scan inline"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>Inspect Form EC8A</span>
                </button>

                <Link
                  to={`/polling-units/${pu.id}?tab=workspace`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>Launch Verification Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Inline Quick Inspect Form EC8A Modal */}
      {inspectingPu && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Form EC8A Result Sheet: {inspectingPu.code}
                  </h3>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    {inspectingPu.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {inspectingPu.name} · {inspectingPu.stateCode} State / {inspectingPu.lgaCode}
                </p>
              </div>
              <button
                onClick={() => setInspectingPu(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image Container */}
            <div className="bg-slate-900 rounded-lg p-2 min-h-[420px] max-h-[500px] flex items-center justify-center overflow-hidden">
              <img
                src={`/api/v1/result-sheets/rs-${inspectingPu.code}/image`}
                alt={`EC8A Scan for PU ${inspectingPu.code}`}
                className="max-h-[480px] max-w-full object-contain rounded border border-slate-700 shadow-lg"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/api/v1/polling-units/${inspectingPu.id}/ec8a-image`;
                }}
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-mono">
                Reg Voters: <strong>{inspectingPu.registeredVoters}</strong> · Accredited: <strong>{inspectingPu.accreditedVoters}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingPu(null)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to={`/polling-units/${inspectingPu.id}?tab=workspace`}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Open Full Verification Workspace →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
