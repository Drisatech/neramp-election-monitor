import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
    wards,
    selectedWardCode,
    setSelectedWardCode,
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
  const [offset, setOffset] = useState<number>(0);
  const limit = 50;
  const [expectedStats, setExpectedStats] = useState<{
    totalLgas: number;
    totalWards: number;
    expectedPus: number;
    registeredVoters: number;
    pvcsCollected: number;
    pvcCollectionRate: number;
    uploadedCount: number;
    verifiedCount: number;
    awaitingUploadCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reset pagination offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode, uploadStatusFilter, verificationStatusFilter, searchQuery]);

  const loadPollingUnits = async (currentOffset = offset) => {
    try {
      setIsLoading(true);
      const res = await fetchPollingUnits({
        electionId: selectedElectionId,
        state: selectedStateCode || undefined,
        lga: selectedLgaCode || undefined,
        ward: selectedWardCode || undefined,
        uploadStatus: uploadStatusFilter || undefined,
        verificationStatus: verificationStatusFilter || undefined,
        search: searchQuery || undefined,
        limit,
        offset: currentOffset,
      });
      setPollingUnits(res.data);
      setTotalCount(res.pagination.total);
      if (res.expectedStats) {
        setExpectedStats(res.expectedStats);
      }
    } catch (err) {
      console.error('Failed to load polling units:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPollingUnits(offset);
  }, [
    selectedElectionId,
    selectedStateCode,
    selectedLgaCode,
    selectedWardCode,
    uploadStatusFilter,
    verificationStatusFilter,
    searchQuery,
    offset,
  ]);

  const activeState = states.find((s) => s.code === selectedStateCode);
  const activeLga = lgas.find((l) => l.code === selectedLgaCode);
  const activeWard = wards.find((w) => w.code === selectedWardCode);

  const scopeLabel = activeWard
    ? `${activeState?.name || selectedStateCode} › ${activeLga?.name || selectedLgaCode} › ${activeWard.name}`
    : activeLga
    ? `${activeState?.name || selectedStateCode} › ${activeLga.name}`
    : activeState
    ? `${activeState.name} State`
    : 'National (All 36 States & FCT)';

  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Polling-Unit Directory & Expected Result Sheets Explorer
          </h1>
          <p className="text-xs text-slate-500">
            Drill down from National (176,846 PUs) to State, LGA, Electoral Ward, and individual Polling Units to inspect Form EC8A uploads.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md">
          Showing <strong>{pollingUnits.length > 0 ? offset + 1 : 0}–{offset + pollingUnits.length}</strong> of{' '}
          <strong>{totalCount.toLocaleString()}</strong> polling units
        </div>
      </div>

      {/* Official INEC Expected Result Sheets & Voter Statistics Summary */}
      {expectedStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Scope</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5" title={scopeLabel}>
              {scopeLabel}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {expectedStats.totalLgas.toLocaleString()} LGAs · {expectedStats.totalWards.toLocaleString()} Wards
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Expected Result Sheets</span>
            <span className="text-base font-bold font-mono text-emerald-950 block mt-0.5">
              {expectedStats.expectedPus.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Official INEC PUs</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Uploaded Sheets</span>
            <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
              {expectedStats.uploadedCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 font-mono">
              {expectedStats.verifiedCount.toLocaleString()} Verified
            </span>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Awaiting Upload</span>
            <span className="text-base font-bold font-mono text-amber-950 block mt-0.5">
              {expectedStats.awaitingUploadCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-700">Expected outstanding</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Voters</span>
            <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
              {expectedStats.registeredVoters.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">INEC Official Roll</span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              PVCs Collected ({expectedStats.pvcCollectionRate.toFixed(2)}%)
            </span>
            <span className="text-base font-bold font-mono text-emerald-800 block mt-0.5">
              {expectedStats.pvcsCollected.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Eligible with PVC</span>
          </div>
        </div>
      )}

      {/* Comprehensive Hierarchical Drill-Down & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PU Code (e.g. LA-01-01-001), name, Electoral Ward, LGA, or State..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-bold text-slate-600 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Drill-Down:</span>
          </span>

          {/* State */}
          <select
            value={selectedStateCode}
            onChange={(e) => setSelectedStateCode(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600 font-medium"
          >
            <option value="">National: All 36 States & FCT (176,846 PUs)</option>
            {states.map((st) => (
              <option key={st.code} value={st.code}>
                {st.name} ({st.totalLgas} LGAs · {st.totalWards ?? 0} Wards · {st.totalPus.toLocaleString()} PUs)
              </option>
            ))}
          </select>

          {/* LGA */}
          {selectedStateCode && (
            <select
              value={selectedLgaCode}
              onChange={(e) => setSelectedLgaCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600 font-medium"
            >
              <option value="">All LGAs in {selectedStateCode} ({lgas.length})</option>
              {lgas.map((lga) => (
                <option key={lga.code} value={lga.code}>
                  {lga.name} ({lga.totalWards} Wards · {lga.totalPus.toLocaleString()} PUs)
                </option>
              ))}
            </select>
          )}

          {/* Electoral Ward */}
          {selectedLgaCode && (
            <select
              value={selectedWardCode}
              onChange={(e) => setSelectedWardCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 focus:outline-emerald-600 font-medium"
            >
              <option value="">All Electoral Wards ({wards.length})</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name} ({w.totalPus} Expected PUs)
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
            <option value="NOT_YET_UPLOADED">Not Yet Uploaded (Expected)</option>
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

          {(selectedStateCode ||
            selectedLgaCode ||
            selectedWardCode ||
            uploadStatusFilter ||
            verificationStatusFilter ||
            searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-2"
            >
              Reset All
            </button>
          )}

          <button
            onClick={() => loadPollingUnits(offset)}
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

      {/* Pagination Bar */}
      {totalCount > limit && (
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-600 font-mono">
            Page <strong>{Math.floor(offset / limit) + 1}</strong> of{' '}
            <strong>{Math.ceil(totalCount / limit).toLocaleString()}</strong> ({totalCount.toLocaleString()} Expected Polling Units)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              disabled={offset + limit >= totalCount}
              onClick={() => setOffset(offset + limit)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

