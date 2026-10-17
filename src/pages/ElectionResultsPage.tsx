import React, { useEffect, useState } from 'react';
import { Layers, Filter, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { useElection } from '../context/ElectionContext';
import { fetchElectionSummary } from '../services/api';
import { ElectionSummary } from '../types';
import { CandidateVoteChart } from '../components/CandidateVoteChart';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const ElectionResultsPage: React.FC = () => {
  const { selectedElectionId, states, selectedStateCode, setSelectedStateCode } = useElection();
  const [summary, setSummary] = useState<ElectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        setIsLoading(true);
        const res = await fetchElectionSummary(selectedElectionId, selectedStateCode);
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load election results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, [selectedElectionId, selectedStateCode]);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Candidate & Political Party Comparative Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Analysis of transcribed votes across certified polling-unit result sheets.
          </p>
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Filter by State:</span>
          <select
            value={selectedStateCode}
            onChange={(e) => setSelectedStateCode(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-emerald-600"
          >
            <option value="">National Aggregate (All States)</option>
            {states.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} State
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <CandidateVoteChart
        candidateRankings={summary?.candidateRankings || []}
        totalValidVotes={summary?.totalValidVotes || 0}
      />

      {/* Detailed Candidate Performance Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Detailed Candidate Standings (Verified Transcriptions)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Total Captured Valid Votes: <strong>{summary?.totalValidVotes.toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate & Running Mate</th>
                <th className="py-3 px-3">Party</th>
                <th className="py-3 px-3 text-right">Verified Votes</th>
                <th className="py-3 px-3 text-right">Percentage Share</th>
                <th className="py-3 px-4 text-center">Verification Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(summary?.candidateRankings || []).map((cand, idx) => (
                <tr key={cand.candidateId} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">#{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{cand.candidateName}</div>
                    <div className="text-[11px] text-slate-500">{cand.partyName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white"
                      style={{ backgroundColor: cand.color }}
                    >
                      {cand.partyCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    {cand.votes.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                    {cand.percentage}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="w-24 bg-slate-100 rounded-full h-2 mx-auto overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cand.percentage}%`, backgroundColor: cand.color }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
