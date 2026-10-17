import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { fetchPublishedDiscrepancies } from '../services/api';
import { Discrepancy } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const DiscrepanciesPage: React.FC = () => {
  const { selectedElectionId } = useElection();
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDiscrepancies() {
      try {
        setIsLoading(true);
        const res = await fetchPublishedDiscrepancies(selectedElectionId);
        setDiscrepancies(res.data);
      } catch (err) {
        console.error('Failed to load discrepancies:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDiscrepancies();
  }, [selectedElectionId]);

  const filtered = discrepancies.filter((d) => {
    if (filterSeverity && d.severity !== filterSeverity) return false;
    if (filterCategory && d.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.pollingUnitCode.toLowerCase().includes(q) ||
        d.pollingUnitName.toLowerCase().includes(q) ||
        d.reviewNotes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Data Discrepancy Registry
          </h1>
          <p className="text-xs text-slate-500">
            Objective detection of arithmetic inconsistencies, OCR variances, and missing records requiring reviewer attention.
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
          {discrepancies.length} Flagged Discrepancies Detected
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PU code or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-emerald-600"
          />
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800"
        >
          <option value="">Severity: All</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800"
        >
          <option value="">Category: All</option>
          <option value="ARITHMETIC_MISMATCH">Arithmetic Mismatch</option>
          <option value="OCR_TRANSCRIPTION_VARIANCE">OCR Variance</option>
          <option value="SOURCE_METADATA_DISCREPANCY">Metadata Discrepancy</option>
          <option value="BALLOT_TOTAL_EXCEEDS_ACCREDITED">Overvoting Flag</option>
        </select>
      </div>

      {/* Discrepancy Cards List */}
      <div className="space-y-3">
        {filtered.map((disc) => (
          <div key={disc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">{disc.pollingUnitCode}</span>
                <span className="text-slate-500 text-xs">· {disc.pollingUnitName} ({disc.stateName})</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    disc.severity === 'HIGH'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {disc.severity} SEVERITY
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Detected: {new Date(disc.detectedAt).toLocaleTimeString()} WAT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Recorded / Extracted Value:</span>
                <span className="font-mono text-slate-800">{disc.originalValue}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Compared Official Expected Value:</span>
                <span className="font-mono text-slate-800">{disc.comparedValue}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <p className="text-slate-600 italic">
                <strong>Review Status: </strong> {disc.status.replace('_', ' ')} — {disc.reviewNotes}
              </p>
              <Link
                to={`/polling-units/${disc.pollingUnitCode}`}
                className="font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0"
              >
                Inspect Result Sheet &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
