import React from 'react';
import ReactECharts from 'echarts-for-react';

interface Props {
  verified: number;
  pendingVerification: number;
  discrepancies: number;
  notUploaded: number;
}

export const VerificationDistributionChart: React.FC<Props> = ({
  verified,
  pendingVerification,
  discrepancies,
  notUploaded,
}) => {
  const data = [
    { value: verified, name: 'Verified Transcriptions', itemStyle: { color: '#16a34a' } },
    { value: pendingVerification, name: 'Awaiting Verification', itemStyle: { color: '#0284c7' } },
    { value: discrepancies, name: 'Discrepancies Flagged', itemStyle: { color: '#dc2626' } },
    { value: notUploaded, name: 'Sheet Not Yet Uploaded', itemStyle: { color: '#94a3b8' } },
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <strong>{c}</strong> ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'center',
      textStyle: { fontSize: 11, color: '#334155' },
    },
    series: [
      {
        name: 'Verification Status',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
        labelLine: { show: false },
        data,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="mb-2 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Verification Pipeline Status
        </h3>
        <p className="text-xs text-slate-500">
          Distribution across transcription validation and discrepancy detection
        </p>
      </div>
      <ReactECharts option={option} style={{ height: '240px', width: '100%' }} />
    </div>
  );
};
