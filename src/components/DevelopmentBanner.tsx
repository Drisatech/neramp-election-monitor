import React from 'react';
import { AlertTriangle, Database } from 'lucide-react';
import { useElection } from '../context/ElectionContext';

export const DevelopmentBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 font-semibold text-xs md:text-sm tracking-wide shadow-xs flex items-center justify-between border-b border-amber-600">
      <div className="flex items-center gap-2 mx-auto">
        <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
        <span className="text-center font-bold">
          DEVELOPMENT MODE — DEMONSTRATION DATA ONLY. NOT OFFICIAL ELECTION RESULTS.
        </span>
      </div>
      <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-medium opacity-90">
        <Database className="w-3.5 h-3.5" />
        <span>Source: Development Fixture Adapter</span>
      </div>
    </div>
  );
};
