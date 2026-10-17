import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: string;
  status?: 'normal' | 'success' | 'warning' | 'alert';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = 'normal',
}) => {
  const statusBorder = {
    normal: 'border-slate-200',
    success: 'border-emerald-200 bg-emerald-50/30',
    warning: 'border-amber-200 bg-amber-50/20',
    alert: 'border-rose-200 bg-rose-50/20',
  }[status];

  const statusValueColor = {
    normal: 'text-slate-900',
    success: 'text-emerald-800',
    warning: 'text-amber-800',
    alert: 'text-rose-800',
  }[status];

  return (
    <div className={`p-4 rounded-lg bg-white border ${statusBorder} shadow-2xs transition-shadow hover:shadow-xs`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>
      <div className={`text-2xl font-bold font-mono tracking-tight ${statusValueColor}`}>
        {value}
      </div>
      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          {trend && <span className="font-medium text-slate-700">{trend}</span>}
          {trend && subtitle && <span aria-hidden="true">·</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
