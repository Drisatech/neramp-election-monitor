import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { fetchPollingUnitDetail } from '../services/api';
import { PollingUnit, ResultSheet, Discrepancy } from '../types';
import { SourceDocumentViewer } from '../components/SourceDocumentViewer';
import { VerificationWorkspace } from '../components/VerificationWorkspace';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { useAuth } from '../context/AuthContext';
import { getPartyInfo } from '../constants/parties';

export const PollingUnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role, isSuperOrProjectAdmin } = useAuth();
  const canVerify = isSuperOrProjectAdmin || role === 'RESULT_VERIFIER' || role === 'ELECTION_ANALYST' || role === 'STATE_COORDINATOR';

  const [pu, setPu] = useState<(PollingUnit & { resultSheet?: ResultSheet; discrepancies?: Discrepancy[]; provenance?: any }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'workspace'>('overview');

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

        {/* Tab Switcher */}
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
              <span className="text-[11px] text-slate-500 block">Preserved zero-padded string</span>
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
                <SourceDocumentViewer resultSheet={sheet} pollingUnitCode={pu.code} />
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
                      {Object.entries(sheet.transcription.partyVotes).map(([party, votes]) => {
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

                  {/* Ballot Statistics Summary */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center font-mono">
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 uppercase block">Valid Votes</span>
                      <span className="text-sm font-bold text-slate-900">{sheet.transcription.validVotes}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 uppercase block">Rejected Ballots</span>
                      <span className="text-sm font-bold text-slate-900">{sheet.transcription.rejectedVotes}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-[10px] text-slate-500 uppercase block">Total Cast</span>
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
