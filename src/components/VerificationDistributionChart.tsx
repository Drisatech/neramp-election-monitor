import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useThemeAccessibility } from '../context/ThemeAccessibilityContext';

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
  const { theme } = useThemeAccessibility();
  const isDark = theme === 'dark';

  const data = [
    { value: verified, name: 'Verified Transcriptions', itemStyle: { color: '#16a34a' } },
    { value: pendingVerification, name: 'Awaiting Verification', itemStyle: { color: '#38bdf8' } },
    { value: discrepancies, name: 'Discrepancies Flagged', itemStyle: { color: '#f43f5e' } },
    { value: notUploaded, name: 'Sheet Not Yet Uploaded', itemStyle: { color: isDark ? '#64748b' : '#94a3b8' } },
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: '{b}: <strong>{c}</strong> ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'center',
      textStyle: { fontSize: 11, color: isDark ? '#e2e8f0' : '#334155' },
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
