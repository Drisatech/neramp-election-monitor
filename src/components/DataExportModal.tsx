import React from 'react';
import { Download, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useElection } from '../context/ElectionContext';

export const DataExportModal: React.FC = () => {
  const { selectedElectionId, selectedStateCode } = useElection();

  const handleDownload = () => {
    const params = new URLSearchParams();
    if (selectedElectionId) params.set('electionId', selectedElectionId);
    if (selectedStateCode) params.set('state', selectedStateCode);
    window.location.href = `/api/v1/reports/export-csv?${params.toString()}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
          Permitted Dataset Export (CSV)
        </h4>
      </div>
      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
        Export verified polling-unit figures and source Form EC8A metadata. Exports include source attribution, verification status headers, and CSV formula injection defenses.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Filtered Polling Units (CSV)</span>
        </button>
        <span className="text-[11px] text-slate-500 font-mono">
          Scope: {selectedStateCode ? `State ${selectedStateCode}` : 'All 36 States & FCT'}
        </span>
      </div>
    </div>
  );
};
