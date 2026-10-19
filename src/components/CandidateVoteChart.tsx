import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { CandidateRanking } from '../types';
import { getPartyInfo } from '../constants/parties';
import { useThemeAccessibility } from '../context/ThemeAccessibilityContext';
import { useElection } from '../context/ElectionContext';
import {
  ChevronRight,
  X,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileText,
} from 'lucide-react';

export interface PartyPollingUnitBreakdownItem {
  id: string;
  code: string;
  name: string;
  stateCode: string;
  stateName: string;
  lgaCode: string;
  lgaName: string;
  wardCode: string;
  wardName: string;
  partyVotes: number;
  validVotes: number;
  rejectedVotes: number;
  totalVotesCast: number;
  registeredVoters: number;
  accreditedVoters: number;
  partyPercentage: number;
  verificationStatus: string;
  resultSheetId?: string;
}

interface PartyDrilldownModalProps {
  party: CandidateRanking | null;
  electionId: string;
  stateFilter?: string;
  lgaFilter?: string;
  wardFilter?: string;
  onClose: () => void;
}

export const PartyPollingUnitDrilldownModal: React.FC<PartyDrilldownModalProps> = ({
  party,
  electionId,
  stateFilter,
  lgaFilter,
  wardFilter,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [pollingUnits, setPollingUnits] = useState<PartyPollingUnitBreakdownItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithVotes, setOnlyWithVotes] = useState(false);

  useEffect(() => {
    if (!party) return;
    let isMounted = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (stateFilter) params.set('state', stateFilter);
    if (lgaFilter) params.set('lga', lgaFilter);
    if (wardFilter) params.set('ward', wardFilter);

    fetch(
      `/api/v1/elections/${electionId}/party-results/${encodeURIComponent(party.partyCode)}/polling-units?${params.toString()}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data?.pollingUnits) {
          setPollingUnits(json.data.pollingUnits);
        }
      })
      .catch((err) => console.error('Failed to load party polling unit breakdown:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [party, electionId, stateFilter, lgaFilter, wardFilter]);

  if (!party) return null;

  const info = getPartyInfo(party.partyCode);
  const logoUrl = party.logoUrl || info?.logoUrl;

  const filteredPus = pollingUnits.filter((pu) => {
    if (onlyWithVotes && pu.partyVotes <= 0) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      pu.code.toLowerCase().includes(q) ||
      pu.name.toLowerCase().includes(q) ||
      pu.lgaName.toLowerCase().includes(q) ||
      pu.wardName.toLowerCase().includes(q) ||
      pu.stateName.toLowerCase().includes(q)
    );
  });

  const totalPartyVotesInView = filteredPus.reduce((acc, p) => acc + p.partyVotes, 0);
  const pusWithVotesCount = pollingUnits.filter((p) => p.partyVotes > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={party.partyCode}
                className="w-11 h-11 rounded-lg object-contain bg-white border border-slate-700 p-1 shrink-0"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm text-white shrink-0"
                style={{ backgroundColor: party.color }}
              >
                {party.partyCode}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: party.color }}
                >
                  {party.partyCode}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {party.partyName} — Polling Unit Vote Breakdown
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Polling unit tally across uploaded Form EC8A result sheets • Total Party Votes:{' '}
                <strong className="text-white font-mono">{party.votes.toLocaleString()}</strong> ({party.percentage}% of valid votes)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close drill-down"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Ribbon & Filter Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">Polling Units Transcribed: </span>
              <span className="font-bold text-slate-900 font-mono">{pollingUnits.length.toLocaleString()}</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">PUs Where {party.partyCode} Scored Votes: </span>
              <span className="font-bold text-emerald-700 font-mono">{pusWithVotesCount.toLocaleString()}</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium">Sum of {party.partyCode} Votes: </span>
              <span className="font-bold text-slate-900 font-mono">{totalPartyVotesInView.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyWithVotes}
                onChange={(e) => setOnlyWithVotes(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Only PUs with &gt;0 votes
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PU code, name, LGA, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
              />
            </div>
          </div>
        </div>

        {/* Polling Units Breakdown Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Loading {party.partyName} ({party.partyCode}) votes across polling units...
              </p>
            </div>
          ) : filteredPus.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching polling unit records found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your search filter or unchecking the &gt;0 votes filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Polling Unit</th>
                  <th className="py-3 px-4">LGA &amp; Ward</th>
                  <th className="py-3 px-4 text-right">{party.partyCode} Votes</th>
                  <th className="py-3 px-4 text-right">PU Valid Votes</th>
                  <th className="py-3 px-4 text-right">{party.partyCode} Share in PU</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Form EC8A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredPus.map((pu) => (
                  <tr key={pu.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-emerald-700">{pu.code}</div>
                      <div className="font-semibold text-slate-900 text-xs mt-0.5">{pu.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {pu.lgaName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ward: {pu.wardName} ({pu.stateName})
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className="inline-block px-2.5 py-1 rounded-md font-mono font-extrabold text-sm"
                        style={{
                          backgroundColor: `${party.color}15`,
                          color: party.color,
                        }}
                      >
                        {pu.partyVotes.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-700">
                      {pu.validVotes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, pu.partyPercentage)}%`,
                              backgroundColor: party.color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-700 w-12 text-right">
                          {pu.partyPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pu.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : pu.verificationStatus === 'DISCREPANCY_FLAGGED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> Transcribed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/polling-unit/${pu.id}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Inspect PU <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filteredPus.length} of {pollingUnits.length} uploaded polling units for this contest
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

interface Props {
  candidateRankings: CandidateRanking[];
  totalValidVotes: number;
}

export const CandidateVoteChart: React.FC<Props> = ({ candidateRankings, totalValidVotes }) => {
  const { theme } = useThemeAccessibility();
  const { selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode } = useElection();
  const isDark = theme === 'dark';
  const [drilldownParty, setDrilldownParty] = useState<CandidateRanking | null>(null);

  // Filter out parties with 0 votes so the dashboard only shows parties with votes > 0
  const sorted = [...(candidateRankings || [])]
    .filter((c) => c.votes > 0)
    .sort((a, b) => b.votes - a.votes || a.partyCode.localeCompare(b.partyCode));

  if (sorted.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 text-center space-y-2">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Political Party Vote Breakdown (Transcribed &amp; Verified)
        </h3>
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm">
          <p className="font-semibold text-slate-600">No political party with votes greater than zero for this selection yet.</p>
          <p className="text-xs text-slate-400 mt-1">Parties with zero (0) votes are hidden to keep the dashboard focused.</p>
        </div>
      </div>
    );
  }

  const chartHeight = Math.max(260, Math.min(540, sorted.length * 42 + 60));

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any) => {
        const item = params[0];
        const party = sorted[item.dataIndex];
        if (!party) return '';
        const info = getPartyInfo(party.partyCode);
        const logoUrl = party.logoUrl || info?.logoUrl || '';
        return `
          <div style="font-size:12px; font-family: sans-serif; display:flex; align-items:center; gap:10px; color:${isDark ? '#f8fafc' : '#0f172a'};">
            ${logoUrl ? `<img src="${logoUrl}" alt="${party.partyCode}" style="width:32px;height:32px;object-fit:contain;border-radius:4px;border:1px solid #e2e8f0;background:#fff;padding:2px;" />` : ''}
            <div>
              <strong>${party.partyName}</strong> (${party.partyCode})<br/>
              Votes: <strong>${party.votes.toLocaleString()}</strong><br/>
              Share: <strong>${party.percentage}%</strong> of verified valid votes<br/>
              <span style="color:#059669;font-size:11px;font-weight:bold;">Click to view Polling Unit breakdown →</span>
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Votes',
      nameTextStyle: { color: isDark ? '#cbd5e1' : '#64748b' },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0', type: 'dashed' } },
      axisLabel: {
        formatter: (val: number) => val.toLocaleString(),
        color: isDark ? '#cbd5e1' : '#64748b',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((c) => `${c.partyCode} — ${c.partyName}`),
      inverse: true,
      axisLabel: {
        color: isDark ? '#f1f5f9' : '#1e293b',
        fontSize: 11,
        fontWeight: '600',
      },
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
    },
    series: [
      {
        name: 'Votes',
        type: 'bar',
        barWidth: '60%',
        cursor: 'pointer',
        data: sorted.map((c) => ({
          value: c.votes,
          itemStyle: { color: c.color || '#16a34a', borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `${params.value.toLocaleString()} (${sorted[params.dataIndex]?.percentage ?? 0}%)`,
          fontSize: 10,
          color: isDark ? '#e2e8f0' : '#475569',
          fontWeight: '600',
        },
      },
    ],
  };

  const onChartEvents = {
    click: (params: any) => {
      if (params && typeof params.dataIndex === 'number' && sorted[params.dataIndex]) {
        setDrilldownParty(sorted[params.dataIndex]);
      }
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Political Party Vote Breakdown (Transcribed &amp; Verified)
          </h3>
          <p className="text-xs text-slate-500">
            Showing {sorted.length} Political Parties with Votes &gt; 0 · Total verified valid votes:{' '}
            <strong className="text-slate-800 font-mono">{totalValidVotes.toLocaleString()}</strong> ·{' '}
            <span className="text-emerald-700 font-semibold">Click any party to drill down into Polling Unit votes</span>
          </p>
        </div>
        <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
          Interactive Polling Unit Drill-Down
        </span>
      </div>

      {/* Official INEC Party Logos & Quick Tally Grid (Only Parties with Votes > 0) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
        {sorted.map((party) => {
          const info = getPartyInfo(party.partyCode);
          const logoUrl = party.logoUrl || info?.logoUrl;
          return (
            <button
              key={party.partyCode}
              type="button"
              onClick={() => setDrilldownParty(party)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all text-left group cursor-pointer"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${party.partyName} logo`}
                  className="w-8 h-8 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                  style={{ backgroundColor: party.color }}
                >
                  {party.partyCode}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-slate-900 font-mono truncate group-hover:text-emerald-800">
                    {party.partyCode}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800">{party.percentage}%</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={party.partyName}>
                  {party.partyName}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] font-mono font-bold text-slate-800">
                    {party.votes.toLocaleString()} votes
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <ReactECharts
        option={option}
        onEvents={onChartEvents}
        style={{ height: `${chartHeight}px`, width: '100%' }}
      />

      {drilldownParty && (
        <PartyPollingUnitDrilldownModal
          party={drilldownParty}
          electionId={selectedElectionId}
          stateFilter={selectedStateCode || undefined}
          lgaFilter={selectedLgaCode || undefined}
          wardFilter={selectedWardCode || undefined}
          onClose={() => setDrilldownParty(null)}
        />
      )}
    </div>
  );
};

