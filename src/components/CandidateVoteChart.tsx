import React from 'react';
import ReactECharts from 'echarts-for-react';
import { CandidateRanking } from '../types';

interface Props {
  candidateRankings: CandidateRanking[];
  totalValidVotes: number;
}

export const CandidateVoteChart: React.FC<Props> = ({ candidateRankings, totalValidVotes }) => {
  if (!candidateRankings || candidateRankings.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No candidate result records available for this selection.
      </div>
    );
  }

  // Sort descending by votes
  const sorted = [...candidateRankings].sort((a, b) => b.votes - a.votes);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        const cand = sorted[item.dataIndex];
        return `
          <div style="font-size:12px; font-family: sans-serif;">
            <strong>${cand.candidateName}</strong> (${cand.partyCode})<br/>
            Votes: <strong>${cand.votes.toLocaleString()}</strong><br/>
            Share: <strong>${cand.percentage}%</strong> of verified valid votes
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '5%',
      top: '5%',
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
      data: sorted.map((c) => `${c.candidateName} (${c.partyCode})`),
      inverse: true,
      axisLabel: {
        color: '#1e293b',
        fontSize: 12,
        fontWeight: '500',
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    series: [
      {
        name: 'Votes',
        type: 'bar',
        barWidth: '55%',
        data: sorted.map((c) => ({
          value: c.votes,
          itemStyle: { color: c.color || '#16a34a', borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `${params.value.toLocaleString()} (${sorted[params.dataIndex].percentage}%)`,
          fontSize: 11,
          color: '#475569',
          fontWeight: '500',
        },
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Candidate Vote Breakdown (Transcribed & Verified)
          </h3>
          <p className="text-xs text-slate-500">
            Total verified valid votes captured: {totalValidVotes.toLocaleString()}
          </p>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />
    </div>
  );
};
