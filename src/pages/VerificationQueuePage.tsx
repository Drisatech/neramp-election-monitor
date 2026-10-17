import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { fetchPollingUnits } from '../services/api';
import { PollingUnit } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const VerificationQueuePage: React.FC = () => {
  const { selectedElectionId } = useElection();
  const [queue, setQueue] = useState<PollingUnit[]>([]);
  const [filterType, setFilterType] = useState<'PENDING' | 'DISCREPANCY' | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
      try {
        setIsLoading(true);
        const res = await fetchPollingUnits({
          electionId: selectedElectionId,
          uploadStatus: 'UPLOADED',
        });
        setQueue(res.data);
      } catch (err) {
        console.error('Failed to load queue:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQueue();
  }, [selectedElectionId]);

  const filtered = queue.filter((pu) => {
    if (filterType === 'PENDING') return pu.verificationStatus === 'PENDING_VERIFICATION';
    if (filterType === 'DISCREPANCY') return pu.verificationStatus === 'DISCREPANCY_FLAGGED';
    return true;
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Result Transcription Verification Queue
          </h1>
          <p className="text-xs text-slate-500">
            Side-by-side verification workflow for checking uploaded Form EC8A images against extracted OCR tallies.
          </p>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Uploaded Sheets
          </button>
          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filterType === 'PENDING' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Awaiting Review
          </button>
          <button
            onClick={() => setFilterType('DISCREPANCY')}
            className={`px-3 py-1.5 rounded transition-colors ${
              filterType === 'DISCREPANCY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Discrepancies Flagged
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((pu) => (
          <div key={pu.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">{pu.code}</span>
                <span className="text-xs text-slate-500 font-medium">· {pu.name}</span>
              </div>
              <div className="text-xs text-slate-500">
                {pu.stateCode} State · {pu.lgaCode} LGA · Registered: {pu.registeredVoters} · Accredited: {pu.accreditedVoters}
              </div>
            </div>

            <div className="flex items-center gap-4">
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

              <Link
                to={`/polling-units/${pu.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Launch Verification Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
