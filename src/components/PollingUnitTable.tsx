import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { PollingUnit } from '../types';

interface Props {
  pollingUnits: PollingUnit[];
  isLoading: boolean;
}

export const PollingUnitTable: React.FC<Props> = ({ pollingUnits, isLoading }) => {
  const getUploadStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Uploaded
          </span>
        );
      case 'NOT_YET_UPLOADED':
        return (
          <span className="inline-flex items-center gap-1 text-amber-800 font-medium text-xs">
            <Clock className="w-3.5 h-3.5" />
            Not Yet Uploaded
          </span>
        );
      case 'SOURCE_UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-xs">
            <XCircle className="w-3.5 h-3.5" />
            Source Unavailable
          </span>
        );
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold text-xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'DISCREPANCY_FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Discrepancy Flagged
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 text-sky-700 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Awaiting Verification
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">N/A</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm">Loading polling units database...</p>
      </div>
    );
  }

  if (pollingUnits.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">No polling units found matching your active filters.</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting the geographic or status filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
              <th className="py-3 px-4">PU Identifier</th>
              <th className="py-3 px-4">Polling Unit Name</th>
              <th className="py-3 px-3">State</th>
              <th className="py-3 px-3">LGA</th>
              <th className="py-3 px-3">Ward</th>
              <th className="py-3 px-3">Result Sheet</th>
              <th className="py-3 px-3">Source Uploaded</th>
              <th className="py-3 px-3">Transcription</th>
              <th className="py-3 px-3">Verification</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-normal">
            {pollingUnits.map((pu) => (
              <tr key={pu.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Zero-padded string identifier */}
                <td className="py-3 px-4 font-mono font-bold text-slate-900 tracking-wider">
                  {pu.code}
                </td>
                <td className="py-3 px-4 max-w-[240px]">
                  <div className="font-medium text-slate-900 truncate" title={pu.name}>
                    {pu.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Reg: {pu.registeredVoters.toLocaleString()} · PVC: {(pu.pvcsCollected ?? Math.round(pu.registeredVoters * 0.93)).toLocaleString()} · Acc: {pu.accreditedVoters || '0'}
                  </div>
                </td>
                <td className="py-3 px-3 font-medium">{pu.stateCode}</td>
                <td className="py-3 px-3 text-slate-600 font-mono">{pu.lgaCode}</td>
                <td className="py-3 px-3 text-slate-600 font-mono">{pu.wardCode}</td>
                <td className="py-3 px-3">{getUploadStatusBadge(pu.uploadStatus)}</td>
                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                  {pu.sourceUploadTimestamp ? new Date(pu.sourceUploadTimestamp).toLocaleTimeString() : '—'}
                </td>
                <td className="py-3 px-3">
                  <span className="text-slate-600">
                    {pu.transcriptionStatus === 'COMPLETED' ? 'Transcribed' : pu.transcriptionStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-3">{getVerificationStatusBadge(pu.verificationStatus)}</td>
                <td className="py-3 px-4 text-right">
                  <Link
                    to={`/polling-units/${pu.id}`}
                    className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
