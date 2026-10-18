import React, { useEffect, useState } from 'react';
import { useElection } from '../context/ElectionContext';
import { fetchElectionSummary } from '../services/api';
import { ElectionSummary } from '../types';
import { CandidateVoteChart } from '../components/CandidateVoteChart';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { getPartyInfo } from '../constants/parties';

export const ElectionResultsPage: React.FC = () => {
  const {
    selectedElectionId,
    states,
    selectedStateCode,
    setSelectedStateCode,
    lgas,
    selectedLgaCode,
    setSelectedLgaCode,
    wards,
    selectedWardCode,
    setSelectedWardCode,
    resetFilters,
  } = useElection();
  const [summary, setSummary] = useState<ElectionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        setIsLoading(true);
        const res = await fetchElectionSummary(
          selectedElectionId,
          selectedStateCode || undefined,
          selectedLgaCode || undefined,
          selectedWardCode || undefined
        );
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load election results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadResults();
  }, [selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode]);

  const expectedPus = summary?.totalExpectedPus ?? 176846;
  const registeredVoters = summary?.registeredVoters ?? 103428715;
  const pvcsCollected = summary?.pvcsCollected ?? 96506605;
  const pvcCollectionRate = summary?.pvcCollectionRate ?? 93.31;

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Political Party Comparative Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Analysis of transcribed votes by official INEC registered political party across certified polling-unit result sheets.
            </p>
          </div>

          {/* Hierarchical Drill-Down Filters: National -> State -> LGA -> Ward */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Drill-Down:</span>
            <select
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-emerald-600"
            >
              <option value="">National Aggregate (36 States & FCT)</option>
              {states.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name} ({st.totalPus.toLocaleString()} PUs)
                </option>
              ))}
            </select>

            {selectedStateCode && (
              <select
                value={selectedLgaCode}
                onChange={(e) => setSelectedLgaCode(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-emerald-600"
              >
                <option value="">All LGAs ({lgas.length})</option>
                {lgas.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.totalPus.toLocaleString()} PUs)
                  </option>
                ))}
              </select>
            )}

            {selectedLgaCode && (
              <select
                value={selectedWardCode}
                onChange={(e) => setSelectedWardCode(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-slate-900 focus:outline-emerald-600"
              >
                <option value="">All Electoral Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name} ({w.totalPus} PUs)
                  </option>
                ))}
              </select>
            )}

            {(selectedStateCode || selectedLgaCode || selectedWardCode) && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Scope Baseline Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Scope</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">
              {summary?.scope || 'National (36 States & FCT)'}
            </span>
          </div>
          <div className="bg-emerald-50/70 px-3 py-2 rounded border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Expected Result Sheets</span>
            <span className="font-mono font-bold text-emerald-950 text-sm block mt-0.5">
              {(summary?.pusUploaded ?? 0).toLocaleString()} / {expectedPus.toLocaleString()} Uploaded
            </span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Voters (INEC)</span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
              {registeredVoters.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              PVCs Collected ({pvcCollectionRate.toFixed(2)}%)
            </span>
            <span className="font-mono font-bold text-emerald-800 text-sm block mt-0.5">
              {pvcsCollected.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <CandidateVoteChart
        candidateRankings={summary?.candidateRankings || []}
        totalValidVotes={summary?.totalValidVotes || 0}
      />

      {/* Detailed Political Party Performance Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Detailed Political Party Standings (Verified Transcriptions)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Total Captured Valid Votes: <strong>{(summary?.totalValidVotes || 0).toLocaleString()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Political Party</th>
                <th className="py-3 px-3">Party Code</th>
                <th className="py-3 px-3 text-right">Verified Votes</th>
                <th className="py-3 px-3 text-right">Percentage Share</th>
                <th className="py-3 px-4 text-center">Verification Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(summary?.candidateRankings || []).map((party, idx) => {
                const partyInfo = getPartyInfo(party.partyCode);
                const logoUrl = party.logoUrl || partyInfo?.logoUrl;
                return (
                  <tr key={party.partyCode} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${party.partyName} logo`}
                            className="w-8 h-8 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                          />
                        ) : null}
                        <div>
                          <div className="font-bold text-slate-900">{party.partyName}</div>
                          {partyInfo?.chairman && (
                            <div className="text-[10px] text-slate-400">
                              National Chairman: {partyInfo.chairman}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white"
                        style={{ backgroundColor: party.color }}
                      >
                        {party.partyCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {party.votes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                      {party.percentage}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-24 bg-slate-100 rounded-full h-2 mx-auto overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${party.percentage}%`, backgroundColor: party.color }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
