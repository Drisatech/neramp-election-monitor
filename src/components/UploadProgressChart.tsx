import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useThemeAccessibility } from '../context/ThemeAccessibilityContext';

interface Props {
  uploadedCount: number;
  totalPus: number;
  timeline?: { hour: string; uploaded: number; rate: number }[];
}

export const UploadProgressChart: React.FC<Props> = ({ uploadedCount, totalPus, timeline }) => {
  const { theme } = useThemeAccessibility();
  const isDark = theme === 'dark';

  const defaultTimeline = (timeline && timeline.length > 0) ? timeline : [
    { hour: '14:00 WAT', uploaded: 0, rate: 0.0 },
    { hour: '15:00 WAT', uploaded: 0, rate: 0.0 },
    { hour: '16:00 WAT', uploaded: 0, rate: 0.0 },
    { hour: '17:00 WAT', uploaded: 0, rate: 0.0 },
    { hour: '18:00 WAT', uploaded: 0, rate: 0.0 },
    { hour: '19:00 WAT', uploaded: 0, rate: 0.0 },
  ];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any) => {
        const item = params[0];
        const pct = totalPus > 0 ? ((item.value / totalPus) * 100).toFixed(1) : '0.0';
        return `
          <div style="font-size:12px; color:${isDark ? '#f8fafc' : '#0f172a'};">
            <strong>${item.name}</strong><br/>
            Sheets Uploaded: <strong>${item.value}</strong><br/>
            Cumulative Progress: <strong>${pct}%</strong>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: defaultTimeline.map((t) => t.hour),
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: 'Sheets',
      nameTextStyle: { color: isDark ? '#cbd5e1' : '#64748b' },
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#cbd5e1' : '#64748b', fontSize: 11 },
    },
    series: [
      {
        name: 'Cumulative Uploads',
        type: 'line',
        smooth: true,
        data: defaultTimeline.map((t) => t.uploaded),
        itemStyle: { color: isDark ? '#34d399' : '#047857' },
        lineStyle: { width: 3, color: isDark ? '#34d399' : '#047857' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(4, 120, 87, 0.35)' },
              { offset: 1, color: 'rgba(4, 120, 87, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Result-Sheet Upload Progress Over Time
          </h3>
          <p className="text-xs text-slate-500">
            Form EC8A availability progression tracked by retrieval timestamp
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-emerald-800">
            {uploadedCount} / {totalPus} ({totalPus > 0 ? ((uploadedCount / totalPus) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: '260px', width: '100%' }} />
    </div>
  );
};
