import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

interface Props {
  lastUpdated?: string;
}

export const DisclaimerBanner: React.FC<Props> = ({ lastUpdated }) => {
  return (
    <div className="bg-slate-100/90 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-xs md:text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
      <div className="flex items-start md:items-center gap-2">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 md:mt-0" />
        <p className="leading-snug">
          <strong className="font-semibold text-slate-900">Disclaimer: </strong>
          Independent election results analysis and monitoring platform. Data is presented with source references and verification status. This platform is not an official INEC website.
        </p>
      </div>
      {lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Last Source Retrieval: {new Date(lastUpdated).toLocaleTimeString()} WAT</span>
        </div>
      )}
    </div>
  );
};
