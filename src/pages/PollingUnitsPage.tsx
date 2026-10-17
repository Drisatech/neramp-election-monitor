import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, FileText } from 'lucide-react';
import { useElection } from '../context/ElectionContext';
import { fetchPollingUnits } from '../services/api';
import { PollingUnit } from '../types';
import { PollingUnitTable } from '../components/PollingUnitTable';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const PollingUnitsPage: React.FC = () => {
  const {
    selectedElectionId,
    states,
    selectedStateCode,
    setSelectedStateCode,
    lgas,
    selectedLgaCode,
    setSelectedLgaCode,
    uploadStatusFilter,
    setUploadStatusFilter,
    verificationStatusFilter,
    setVerificationStatusFilter,
    searchQuery,
    setSearchQuery,
    resetFilters,
  } = useElection();

  const [pollingUnits, setPollingUnits] = useState<PollingUnit[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadPollingUnits = async () => {
    try {
      setIsLoading(true);
      const res = await fetchPollingUnits({
        electionId: selectedElectionId,
        state: selectedStateCode || undefined,
        lga: selectedLgaCode || undefined,
        uploadStatus: uploadStatusFilter || undefined,
        verificationStatus: verificationStatusFilter || undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setPollingUnits(res.data);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load polling units:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPollingUnits();
  }, [selectedElectionId, selectedStateCode, selectedLgaCode, uploadStatusFilter, verificationStatusFilter, searchQuery]);

  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Polling-Unit Explorer & Result Sheets
          </h1>
          <p className="text-xs text-slate-500">
            Search individual polling units, verify Form EC8A result sheet availability, and inspect transcriptions.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md">
          Showing <strong>{pollingUnits.length}</strong> of <strong>{totalCount}</strong> polling units
        </div>
      </div>

      {/* Comprehensive Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PU Code (e.g. 25-01-01-001), name, LGA, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-bold text-slate-600 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </span>

          {/* State */}
          <select
            value={selectedStateCode}
            onChange={(e) => setSelectedStateCode(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600"
          >
            <option value="">State: All 36 States & FCT</option>
            {states.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} State
              </option>
            ))}
          </select>

          {/* LGA */}
          {selectedStateCode && (
            <select
              value={selectedLgaCode}
              onChange={(e) => setSelectedLgaCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600"
            >
              <option value="">LGA: All LGAs in {selectedStateCode}</option>
              {lgas.map((lga) => (
                <option key={lga.code} value={lga.code}>
                  {lga.name}
                </option>
              ))}
            </select>
          )}

          {/* Upload Status */}
          <select
            value={uploadStatusFilter}
            onChange={(e) => setUploadStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600"
          >
            <option value="">Result Sheet: All Statuses</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="NOT_YET_UPLOADED">Not Yet Uploaded</option>
            <option value="SOURCE_UNAVAILABLE">Source Unavailable</option>
          </select>

          {/* Verification Status */}
          <select
            value={verificationStatusFilter}
            onChange={(e) => setVerificationStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600"
          >
            <option value="">Verification: All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING_VERIFICATION">Awaiting Verification</option>
            <option value="DISCREPANCY_FLAGGED">Discrepancy Flagged</option>
          </select>

          {(selectedStateCode || selectedLgaCode || uploadStatusFilter || verificationStatusFilter || searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-2"
            >
              Reset All
            </button>
          )}

          <button
            onClick={loadPollingUnits}
            className="ml-auto inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2 py-1"
            title="Refresh records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Polling Units Table */}
      <PollingUnitTable pollingUnits={pollingUnits} isLoading={isLoading} />
    </div>
  );
};
