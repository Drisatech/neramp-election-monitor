import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  ShieldCheck,
  History,
  FileText,
  Clock,
  Layers,
  Info,
  Check,
  User,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { ResultSheet } from '../types';
import { reviewVerificationRecord, correctTranscription } from '../services/api';
import { SourceDocumentViewer } from './SourceDocumentViewer';
import { getPartyInfo } from '../constants/parties';

interface Props {
  resultSheet: ResultSheet;
  pollingUnitCode: string;
  onUpdate?: () => void;
}

export const VerificationWorkspace: React.FC<Props> = ({ resultSheet, pollingUnitCode, onUpdate }) => {
  const [validVotes, setValidVotes] = useState(resultSheet.transcription.validVotes);
  const [rejectedVotes, setRejectedVotes] = useState(resultSheet.transcription.rejectedVotes);
  const [totalVotesCast, setTotalVotesCast] = useState(resultSheet.transcription.totalVotesCast);
  const [partyVotes, setPartyVotes] = useState<Record<string, number>>({ ...resultSheet.transcription.partyVotes });
  const [correctionReason, setCorrectionReason] = useState('');
  const [notes, setNotes] = useState(resultSheet.verifierNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'transcribe' | 'history' | 'audit' | 'ballotStats'>('transcribe');

  React.useEffect(() => {
    setValidVotes(resultSheet.transcription.validVotes);
    setRejectedVotes(resultSheet.transcription.rejectedVotes);
    setTotalVotesCast(resultSheet.transcription.totalVotesCast);
    setPartyVotes({ ...resultSheet.transcription.partyVotes });
    setNotes(resultSheet.verifierNotes || '');
  }, [resultSheet]);

  // Real-time arithmetic check
  const calculatedCast = Number(validVotes) + Number(rejectedVotes);
  const arithmeticMatches = calculatedCast === Number(totalVotesCast);

  const handlePartyVoteChange = (party: string, val: number) => {
    const updated = { ...partyVotes, [party]: Math.max(0, val) };
    setPartyVotes(updated);
    const sumValid = Object.values(updated).reduce((acc, v) => acc + v, 0);
    setValidVotes(sumValid);
  };

  const handleSaveCorrection = async () => {
    if (!correctionReason.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify the reason for this transcription correction.' });
      return;
    }
    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      await correctTranscription(resultSheet.id, {
        validVotes,
        rejectedVotes,
        totalVotesCast,
        partyVotes,
        correctionReason,
      });
      setStatusMessage({ type: 'success', text: `Transcription v${resultSheet.version + 1} saved with immutable audit log.` });
      setCorrectionReason('');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save transcription.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewDecision = async (decision: 'APPROVED' | 'DISCREPANCY_FLAGGED') => {
    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      await reviewVerificationRecord(resultSheet.id, decision, notes);
      setStatusMessage({
        type: 'success',
        text: decision === 'APPROVED' ? 'Result marked as Verified.' : 'Discrepancy flagged and logged for secondary review.',
      });
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to submit review.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default version history if not already on object
  const versionHistory = resultSheet.versionHistory || [
    {
      versionNumber: 1,
      actor: 'SYSTEM_OCR',
      actionType: 'OCR_INGESTION',
      timestamp: resultSheet.uploadTimestamp,
      reason: 'Initial machine extraction from Form EC8A scan.',
    },
  ];

  // Default audit logs if not already on object
  const auditLogs = resultSheet.auditLogs || [
    {
      id: 'audit-01',
      actor: 'SYSTEM_OCR_PIPELINE',
      action: 'PROCESS_RESULT_SHEET',
      target: resultSheet.pollingUnitCode,
      details: `Form EC8A processed. SHA-256: ${resultSheet.fileHash.substring(0, 16)}...`,
      timestamp: resultSheet.retrievalTimestamp,
    },
  ];

  const requiresReview =
    resultSheet.requiresHumanReview ||
    resultSheet.ocrConfidence < 85 ||
    !resultSheet.arithmeticCheck?.passed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Source Document Viewer */}
      <div className="lg:col-span-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span className="flex items-center gap-1.5 text-slate-800">
            <FileText className="w-4 h-4 text-emerald-800" />
            <span>PRIMARY SOURCE DOCUMENT (READ-ONLY)</span>
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono">
            NEVER MODIFIED OR ALTERED
          </span>
        </div>
        <SourceDocumentViewer resultSheet={resultSheet} pollingUnitCode={pollingUnitCode} onRefreshOcr={onUpdate} />
      </div>

      {/* Right Column: Transcription & Verification Form */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Human Verification & Transcription Workspace
              </h3>
              <p className="text-xs text-slate-500">
                Compare official Form EC8A figures against extracted OCR tallies. Machine OCR is never automatically verified.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {resultSheet.isConfidential && (
                <div className="flex items-center gap-1 text-[11px] font-mono bg-rose-50 text-rose-800 px-2 py-1 rounded border border-rose-200 font-bold">
                  <span>CONFIDENTIAL / RESTRICTED</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-mono bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Accredited Verifier</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs for Workspace Context */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
            <button
              onClick={() => setActiveWorkspaceTab('transcribe')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeWorkspaceTab === 'transcribe'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transcription Form
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('ballotStats')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeWorkspaceTab === 'ballotStats'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ballot Statistics</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('history')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeWorkspaceTab === 'history'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Version History (v{resultSheet.version})</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('audit')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                activeWorkspaceTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* Tab 1: Transcription Form */}
          {activeWorkspaceTab === 'transcribe' && (
            <div className="space-y-4">
              {/* Human Review Required Banner if flagged */}
              {requiresReview && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Human Review Mandated for this Polling Unit</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {resultSheet.reviewReasons?.length
                      ? resultSheet.reviewReasons.join(' ')
                      : 'OCR confidence score is below threshold or arithmetic variance detected on Form EC8A.'}
                  </p>
                </div>
              )}

              {/* Arithmetic Consistency Banner */}
              <div
                className={`p-3 rounded-md border text-xs flex items-center justify-between ${
                  arithmeticMatches
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {arithmeticMatches ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">Ballot Arithmetic Rule: </span>
                    <span>
                      Valid ({validVotes}) + Rejected ({rejectedVotes}) = {calculatedCast}{' '}
                      {arithmeticMatches
                        ? '== Recorded Cast (' + totalVotesCast + ')'
                        : '!= Recorded Cast (' + totalVotesCast + ')'}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[11px] uppercase">
                  {arithmeticMatches ? 'Arithmetic Sound' : 'Discrepancy Detected'}
                </span>
              </div>

              {/* Candidate / Party Vote Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">
                    Extracted Party Vote Breakdown
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Grey: Raw OCR | White: Editable Working Copy
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(partyVotes).map(([party, votes]) => {
                    const partyInfo = getPartyInfo(party);
                    return (
                      <div key={party} className="p-2 bg-slate-50 rounded border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5 gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {partyInfo?.logoUrl && (
                              <img
                                src={partyInfo.logoUrl}
                                alt={party}
                                className="w-5 h-5 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                              />
                            )}
                            <span className="font-bold text-slate-900 text-xs truncate" title={partyInfo?.name || party}>
                              {partyInfo?.code || party}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono bg-white px-1 rounded border border-slate-200 shrink-0">
                            OCR: {resultSheet.ocrExtraction.partyVotes[party] ?? '—'}
                          </span>
                        </div>
                        {partyInfo?.name && (
                          <div className="text-[10px] text-slate-500 truncate mb-1" title={partyInfo.name}>
                            {partyInfo.name}
                          </div>
                        )}
                        <input
                          type="number"
                          min="0"
                          value={votes}
                          onChange={(e) => handlePartyVoteChange(party, parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-emerald-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall Ballot Totals */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Valid Votes Total
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={validVotes}
                    onChange={(e) => setValidVotes(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">
                    OCR: {resultSheet.ocrExtraction.validVotes}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Rejected Ballots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rejectedVotes}
                    onChange={(e) => setRejectedVotes(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">
                    OCR: {resultSheet.ocrExtraction.rejectedVotes}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Total Votes Cast
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalVotesCast}
                    onChange={(e) => setTotalVotesCast(parseInt(e.target.value, 10) || 0)}
                    className={`w-full border rounded px-2 py-1.5 text-xs font-mono font-bold ${
                      arithmeticMatches ? 'bg-slate-50 border-slate-300' : 'bg-rose-50 border-rose-400 text-rose-900'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">
                    OCR: {resultSheet.ocrExtraction.totalVotesCast}
                  </span>
                </div>
              </div>

              {/* Correction Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Correction Reason (Required when adjusting transcribed figures):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Visual inspection of Form EC8A confirms candidate score is 150 (OCR misread smudged ink as 142)."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Corrected Transcription (Increments Version)</span>
                </button>
              </div>

              {/* Verifier Notes & Action Decision */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Verifier Notes & Observation Remarks:
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter observations on Presiding Officer stamps, signatures, legibility, and physical condition..."
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                {statusMessage && (
                  <div
                    className={`p-2.5 rounded text-xs font-medium ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('APPROVED')}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Verified</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReviewDecision('DISCREPANCY_FLAGGED')}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Flag Data Discrepancy</span>
                  </button>
                </div>
              </div>

              {/* Editorial / Regulatory Integrity Notice */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard Methodology Protocol:</strong> Discrepancies identify arithmetic or transcription differences requiring human resolution. They must not be characterized as fraud. Machine extractions are never automatically verified.
                </span>
              </div>
            </div>
          )}

          {/* Tab: Ballot Statistics */}
          {activeWorkspaceTab === 'ballotStats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Form EC8A Ballot Accounting (Section A)</span>
                <span className="text-[11px] font-mono">Independent Reconciliation</span>
              </div>

              {resultSheet.ballotStatistics ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Registered Voters</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {resultSheet.ballotStatistics.registeredVoters.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Accredited Voters (BVAS)</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {resultSheet.ballotStatistics.accreditedVoters.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Ballots Issued to PU</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {resultSheet.ballotStatistics.ballotsIssued.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Unused Ballots</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {resultSheet.ballotStatistics.unusedBallots.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Spoiled Ballots</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {resultSheet.ballotStatistics.spoiledBallots.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Rejected Ballots</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-1">
                        {resultSheet.ballotStatistics.rejectedVotes.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Accounting Reconciliation Check */}
                  {(() => {
                    const stats = resultSheet.ballotStatistics;
                    const accountedFor = stats.unusedBallots + stats.spoiledBallots + stats.rejectedVotes + stats.validVotes;
                    const isReconciled = accountedFor === stats.ballotsIssued;
                    const diff = Math.abs(accountedFor - stats.ballotsIssued);

                    return (
                      <div
                        className={`p-3 rounded-md border text-xs space-y-1.5 ${
                          isReconciled
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            {isReconciled ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            )}
                            <span>Ballot Inventory Allocation Check</span>
                          </span>
                          <span className="font-mono uppercase text-[11px]">
                            {isReconciled ? 'Balanced' : `Variance: ${diff} Ballots`}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Ballots Issued ({stats.ballotsIssued}) vs Accounted ({stats.unusedBallots} unused + {stats.spoiledBallots} spoiled + {stats.rejectedVotes} rejected + {stats.validVotes} valid = {accountedFor}).
                          {!isReconciled && ' Variance detected in returning officer ballot inventory tally; recorded as discrepancy.'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-500">
                  Form EC8A ballot statistics have not yet been extracted for this polling unit.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Version History */}
          {activeWorkspaceTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Transcription Revisions</span>
                <span className="text-[11px] font-mono">Current: v{resultSheet.version}</span>
              </div>
              <div className="space-y-2">
                {versionHistory.map((v, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="font-mono text-slate-900">Version {v.versionNumber} ({v.actionType})</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(v.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-700">Editor:</span> {v.actor}
                    </div>
                    <div className="text-slate-500 italic text-[11px]">
                      "{v.reason}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Reviewer Audit Trail */}
          {activeWorkspaceTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">Tamper-Evident Reviewer Actions</span>
                <span className="text-[11px] font-mono">{auditLogs.length} entries</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      <span className="font-semibold">Actor:</span> {log.actor}
                    </div>
                    <div className="text-slate-500 text-[11px]">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
