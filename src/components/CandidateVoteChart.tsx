import React from 'react';
import ReactECharts from 'echarts-for-react';
import { CandidateRanking } from '../types';
import { getPartyInfo } from '../constants/parties';

interface Props {
  candidateRankings: CandidateRanking[];
  totalValidVotes: number;
}

export const CandidateVoteChart: React.FC<Props> = ({ candidateRankings, totalValidVotes }) => {
  if (!candidateRankings || candidateRankings.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No political party result records available for this selection.
      </div>
    );
  }

  // Sort descending by votes, then alphabetically by partyCode
  const sorted = [...candidateRankings].sort((a, b) => b.votes - a.votes || a.partyCode.localeCompare(b.partyCode));

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        const party = sorted[item.dataIndex];
        const info = getPartyInfo(party.partyCode);
        const logoUrl = party.logoUrl || info?.logoUrl || '';
        return `
          <div style="font-size:12px; font-family: sans-serif; display:flex; align-items:center; gap:10px;">
            ${logoUrl ? `<img src="${logoUrl}" alt="${party.partyCode}" style="width:32px;height:32px;object-fit:contain;border-radius:4px;border:1px solid #e2e8f0;background:#fff;padding:2px;" />` : ''}
            <div>
              <strong>${party.partyName}</strong> (${party.partyCode})<br/>
              Votes: <strong>${party.votes.toLocaleString()}</strong><br/>
              Share: <strong>${party.percentage}%</strong> of verified valid votes
            </div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Votes',
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      axisLabel: {
        formatter: (val: number) => val.toLocaleString(),
        color: '#64748b',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((c) => `${c.partyCode} — ${c.partyName}`),
      inverse: true,
      axisLabel: {
        color: '#1e293b',
        fontSize: 11,
        fontWeight: '600',
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    series: [
      {
        name: 'Votes',
        type: 'bar',
        barWidth: '60%',
        data: sorted.map((c) => ({
          value: c.votes,
          itemStyle: { color: c.color || '#16a34a', borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `${params.value.toLocaleString()} (${sorted[params.dataIndex].percentage}%)`,
          fontSize: 10,
          color: '#475569',
          fontWeight: '600',
        },
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Political Party Vote Breakdown (Transcribed & Verified)
          </h3>
          <p className="text-xs text-slate-500">
            All {sorted.length} Official INEC Registered Political Parties · Total verified valid votes captured: {totalValidVotes.toLocaleString()}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          Source: INEC Registered Political Parties
        </span>
      </div>

      {/* Official INEC Party Logos & Quick Tally Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
        {sorted.map((party) => {
          const info = getPartyInfo(party.partyCode);
          const logoUrl = party.logoUrl || info?.logoUrl;
          return (
            <div
              key={party.partyCode}
              className="flex items-center gap-2 p-2 rounded-md border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-colors"
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
                  <span className="text-xs font-black text-slate-900 font-mono truncate">{party.partyCode}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800">{party.percentage}%</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={party.partyName}>
                  {party.partyName}
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-800">
                  {party.votes.toLocaleString()} votes
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ReactECharts option={option} style={{ height: '540px', width: '100%' }} />
    </div>
  );
};
