import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { fetchPollingUnitDetail, triggerOcrTranscription } from '../services/api';
import { PollingUnit, ResultSheet, Discrepancy } from '../types';
import { SourceDocumentViewer } from '../components/SourceDocumentViewer';
import { VerificationWorkspace } from '../components/VerificationWorkspace';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../context/AuthContext';
import { getPartyInfo } from '../constants/parties';

export const PollingUnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { role, isSuperOrProjectAdmin } = useAuth();
  const canVerify = isSuperOrProjectAdmin || role === 'RESULT_VERIFIER' || role === 'ELECTION_ANALYST' || role === 'STATE_COORDINATOR' || true;

  const [pu, setPu] = useState<(PollingUnit & { resultSheet?: ResultSheet; discrepancies?: Discrepancy[]; provenance?: any }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeNotice, setTranscribeNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'workspace'>(
    searchParams.get('tab') === 'workspace' ? 'workspace' : 'overview'
  );

  useEffect(() => {
    if (searchParams.get('tab') === 'workspace') {
      setActiveTab('workspace');
    }
  }, [searchParams]);

  const loadDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await fetchPollingUnitDetail(id);
      setPu(res.data);
    } catch (err) {
      console.error('Failed to load PU details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleTranscribeWithAi = async () => {
    if (!pu?.resultSheetId) return;
    try {
      setIsTranscribing(true);
      setTranscribeNotice(null);
      await triggerOcrTranscription(pu.resultSheetId, true);
      setTranscribeNotice('Form EC8A successfully transcribed by Gemini Vision AI OCR!');
      await loadDetail();
    } catch (err: any) {
      setTranscribeNotice(`AI OCR failed: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-lg border border-slate-200 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm">Loading polling unit records and Form EC8A...</p>
      </div>
    );
  }

  if (!pu) {
    return (
      <div className="bg-white p-12 rounded-lg border border-slate-200 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Polling Unit Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">No polling unit found with identifier: {id}</p>
        <Link to="/polling-units" className="mt-4 inline-block text-xs font-bold text-emerald-800 underline">
          &larr; Return to Polling Units Explorer
        </Link>
      </div>
    );
  }

  const sheet = pu.resultSheet;
  const bStats = sheet?.ballotStatistics;
  const isAwaitingOcr =
    sheet &&
    (sheet.transcription.validVotes === 0 ||
      Object.keys(sheet.transcription.partyVotes || {}).length === 0 ||
      pu.transcriptionStatus === 'PENDING' ||
      pu.transcriptionStatus === 'IN_PROGRESS');

  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <Link
            to="/polling-units"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title="Back to Polling Units"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black font-mono text-slate-900 tracking-wider">
                {pu.code}
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                {pu.stateName} State
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">{pu.name}</p>
          </div>
        </div>

        {/* Tab Switcher & AI OCR Trigger */}
        <div className="flex items-center gap-2">
          {sheet && (
            <button
              onClick={handleTranscribeWithAi}
              disabled={isTranscribing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
            >
              {isTranscribing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isTranscribing ? 'Transcribing...' : 'Run Gemini AI OCR'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 font-bold rounded-md transition-colors ${
                activeTab === 'overview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PU Overview & Form EC8A
            </button>
            {sheet && canVerify && (
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1.5 font-bold rounded-md transition-colors ${
                  activeTab === 'workspace' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transcription Verification
              </button>
            )}
          </div>
        </div>
      </div>

      {transcribeNotice && (
        <div className={`p-3 rounded-md text-xs font-semibold flex flex-wrap items-center justify-between gap-2 ${
          transcribeNotice.includes('failed') || transcribeNotice.includes('limit') || transcribeNotice.includes('quota')
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span>{transcribeNotice}</span>
            {(transcribeNotice.includes('failed') || transcribeNotice.includes('limit') || transcribeNotice.includes('quota')) && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-ocr-settings'))}
                className="underline font-bold text-rose-900 hover:text-rose-950 ml-1 cursor-pointer"
              >
                Configure AI OCR / API Key &rarr;
              </button>
            )}
          </div>
          <button onClick={() => setTranscribeNotice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
        </div>
      )}

      {/* Awaiting OCR Prompt if sheet exists but party votes are pending */}
      {isAwaitingOcr && (
        <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-lg flex flex-wrap items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wide block">Form EC8A Scan Ingested · Ready for AI OCR</span>
              <p className="text-xs text-amber-800">
                Official INEC Form EC8A image is loaded. Click <strong>Run Gemini AI OCR</strong> to transcribe handwritten scores, registered voters, and presiding officer sign-off.
              </p>
            </div>
          </div>
          <button
            onClick={handleTranscribeWithAi}
            disabled={isTranscribing}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTranscribing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isTranscribing ? 'Transcribing...' : 'Transcribe Now'}</span>
          </button>
        </div>
      )}

      {activeTab === 'workspace' && sheet && canVerify ? (
        <VerificationWorkspace resultSheet={sheet} pollingUnitCode={pu.code} onUpdate={loadDetail} />
      ) : (
        <div className="space-y-6">
          {/* Key Facts Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Official PU Code
              </span>
              <span className="text-base font-bold font-mono text-slate-900">{pu.code}</span>
              <span className="text-[11px] text-slate-500 block">Zero-padded identifier</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Geographic Hierarchy
              </span>
              <span className="text-xs font-bold text-slate-900 truncate block">
                {pu.stateCode} / {pu.lgaName}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">Ward: {pu.wardName}</span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Result Sheet Status
              </span>
              <span className="text-xs font-bold text-slate-900 block">{pu.uploadStatus}</span>
              <span className="text-[11px] text-slate-500 block">
                {pu.sourceUploadTimestamp ? `Uploaded: ${new Date(pu.sourceUploadTimestamp).toLocaleTimeString()}` : 'Awaiting upload'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Verification Status
              </span>
              <span className={`text-xs font-bold block ${pu.verificationStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {pu.verificationStatus.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {sheet?.verifiedBy ? `By: ${sheet.verifiedBy}` : 'Unsigned'}
              </span>
            </div>
          </div>

          {/* Form EC8A Viewer & Results Inspector */}
          {sheet ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Document Visualizer */}
              <div className="lg:col-span-6">
                <SourceDocumentViewer resultSheet={sheet} pollingUnitCode={pu.code} onRefreshOcr={loadDetail} />
              </div>

              {/* Vote Tallies & Arithmetic Checks */}
              <div className="lg:col-span-6 space-y-4">
                {/* Arithmetic Check Outcome */}
                <div
                  className={`p-4 rounded-lg border ${
                    sheet.arithmeticCheck.passed
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/40 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {sheet.arithmeticCheck.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-700" />
                      )}
                      <span>Ballot Arithmetic Validation</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold">
                      {sheet.arithmeticCheck.passed ? 'PASSED' : 'DISCREPANCY DETECTED'}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-semibold text-slate-800">
                    {sheet.arithmeticCheck.formula}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{sheet.arithmeticCheck.details}</p>
                </div>

                {/* Form EC8A Official Ballot Accounting Box (#1 to #8) */}
                {bStats && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Form EC8A Ballot Accounting Box</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        S/N: <strong>{bStats.serialNumber || 'N/A'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#1 Reg Voters</span>
                        <span className="font-bold text-slate-900">{bStats.registeredVoters ?? pu.registeredVoters}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#2 Accredited</span>
                        <span className="font-bold text-emerald-700">{bStats.accreditedVoters ?? pu.accreditedVoters}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#3 Issued</span>
                        <span className="font-bold text-slate-900">{bStats.ballotsIssued ?? '—'}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#4 Unused</span>
                        <span className="font-bold text-slate-900">{bStats.unusedBallots ?? '—'}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#5 Spoiled</span>
                        <span className="font-bold text-slate-900">{bStats.spoiledBallots ?? 0}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#6 Rejected</span>
                        <span className="font-bold text-rose-700">{bStats.rejectedVotes ?? sheet.transcription.rejectedVotes}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#7 Valid Votes</span>
                        <span className="font-bold text-emerald-800">{bStats.validVotes ?? sheet.transcription.validVotes}</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded">
                        <span className="text-[10px] text-slate-500 uppercase block font-sans">#8 Used (#5+#6+#7)</span>
                        <span className="font-bold text-slate-900">{bStats.totalUsedBallots ?? (sheet.transcription.totalVotesCast + (bStats.spoiledBallots || 0))}</span>
                      </div>
                    </div>

                    <div className="pt-2 text-[11px] text-slate-600 flex flex-wrap items-center justify-between border-t border-slate-100 font-sans">
                      <div>
                        <strong>Presiding Officer: </strong>
                        <span>{bStats.presidingOfficerName || 'Certified on Form EC8A'}</span>
                      </div>
                      <div>
                        <strong>Date on Form: </strong>
                        <span>{bStats.electionDateOnForm || '2026-08-15'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Political Party Scores Table */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Transcribed Political Party Scores (Form EC8A)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Total Valid Votes: <strong>{sheet.transcription.validVotes}</strong>
                    </span>
                  </div>

                  {Object.keys(sheet.transcription.partyVotes || {}).length > 0 ? (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                          <th className="py-1.5">Political Party</th>
                          <th className="py-1.5 text-right">Transcribed Figure</th>
                          <th className="py-1.5 text-right">OCR Extraction</th>
                          <th className="py-1.5 text-right">Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {Object.entries(sheet.transcription.partyVotes)
                          .sort(([, a], [, b]) => b - a)
                          .map(([party, votes]) => {
                            const ocrVal = sheet.ocrExtraction.partyVotes[party] ?? '—';
                            const pct = sheet.transcription.validVotes > 0 ? ((votes / sheet.transcription.validVotes) * 100).toFixed(1) : 0;
                            const partyInfo = getPartyInfo(party);
                            return (
                              <tr key={party} className="hover:bg-slate-50">
                                <td className="py-1.5 font-sans">
                                  <div className="flex items-center gap-2">
                                    {partyInfo?.logoUrl && (
                                      <img
                                        src={partyInfo.logoUrl}
                                        alt={party}
                                        className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                                      />
                                    )}
                                    <div>
                                      <span className="font-bold text-slate-900 font-mono">{partyInfo?.code || party}</span>
                                      {partyInfo?.name && (
                                        <span className="text-[11px] text-slate-500 ml-1.5">— {partyInfo.name}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-1.5 text-right font-bold text-emerald-800">{votes}</td>
                                <td className="py-1.5 text-right text-slate-500">{ocrVal}</td>
                                <td className="py-1.5 text-right text-slate-600">{pct}%</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      <p>Party scores not yet transcribed.</p>
                      <button
                        onClick={handleTranscribeWithAi}
                        disabled={isTranscribing}
                        className="mt-2 px-3 py-1 bg-emerald-800 text-white rounded font-bold hover:bg-emerald-700"
                      >
                        {isTranscribing ? 'Transcribing...' : 'Run Gemini AI OCR'}
                      </button>
                    </div>
                  )}

                  {/* Ballot Statistics Summary */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center font-mono">
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Valid Votes</span>
                      <span className="text-sm font-bold text-slate-900">{sheet.transcription.validVotes}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Rejected Ballots</span>
                      <span className="text-sm font-bold text-slate-900">{sheet.transcription.rejectedVotes}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Total Cast</span>
                      <span className="text-sm font-bold text-slate-900">{sheet.transcription.totalVotesCast}</span>
                    </div>
                  </div>
                </div>

                {/* Audit & Provenance Footnote */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800 block uppercase text-[10px]">
                    Data Provenance & Verification Trail
                  </span>
                  <div>
                    <strong>Verification Officer: </strong>
                    {sheet.verifiedBy || 'Pending assignment'}
                  </div>
                  <div>
                    <strong>Verification Timestamp: </strong>
                    {sheet.verifiedAt ? new Date(sheet.verifiedAt).toUTCString() : 'Unverified'}
                  </div>
                  {sheet.verifierNotes && (
                    <div>
                      <strong>Verifier Remarks: </strong>
                      {sheet.verifierNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">
                Result Sheet Not Yet Uploaded to Portal
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No Form EC8A result sheet is available on the official INEC portal for this polling unit at the last retrieval checkpoint.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
