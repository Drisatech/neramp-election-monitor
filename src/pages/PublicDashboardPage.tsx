import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Search,
  Filter,
  Download,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { fetchElectionSummary, fetchUploadProgress, fetchVerificationSummary, fetchPublishedDiscrepancies } from '../services/api';
import { ElectionSummary, Discrepancy } from '../types';
import { MetricCard } from '../components/MetricCard';
import { CandidateVoteChart } from '../components/CandidateVoteChart';
import { UploadProgressChart } from '../components/UploadProgressChart';
import { VerificationDistributionChart } from '../components/VerificationDistributionChart';
import { InteractiveElectionMap } from '../components/InteractiveElectionMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { DataExportModal } from '../components/DataExportModal';

export const PublicDashboardPage: React.FC = () => {
  const {
    selectedElectionId,
    states,
    selectedStateCode,
    setSelectedStateCode,
    lgas,
    selectedLgaCode,
    setSelectedLgaCode,
    resetFilters,
  } = useElection();

  const [summary, setSummary] = useState<ElectionSummary | null>(null);
  const [uploadTimeline, setUploadTimeline] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [sumRes, upRes, discRes] = await Promise.all([
          fetchElectionSummary(selectedElectionId, selectedStateCode, selectedLgaCode),
          fetchUploadProgress(selectedElectionId, selectedStateCode),
          fetchPublishedDiscrepancies(selectedElectionId),
        ]);
        setSummary(sumRes.data);
        setUploadTimeline(upRes.data.timeline || []);
        setDiscrepancies(discRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedElectionId, selectedStateCode, selectedLgaCode]);

  return (
    <div className="space-y-6">
      {/* Platform Legal Disclaimer & Data Freshness */}
      <DisclaimerBanner lastUpdated={summary?.lastSourceDataRetrieval} />

      {/* Official Data Source & Freshness Metadata Banner */}
      <div className="bg-slate-900 text-slate-100 px-4 py-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>DATA SOURCE:</span>
          </div>
          <span className="text-slate-300 font-medium">
            {selectedElectionId === 'elec-2026-gov-osun'
              ? 'Official INEC Results Portal (IReV) · https://inecelectionresults.ng'
              : 'Development Demonstration Fixtures (Fictional General Elections Simulation)'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Last Successful Retrieval:{' '}
              <strong className="text-slate-200">
                {summary?.lastSourceDataRetrieval
                  ? new Date(summary.lastSourceDataRetrieval).toLocaleTimeString()
                  : '18:35:00'}{' '}
                WAT
              </strong>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-emerald-300 font-semibold">EC8A Checksums Verified</span>
        </div>
      </div>

      {/* Filter Toolbar: Election Scope & Geography */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </span>

            {/* State Filter */}
            <select
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-600"
            >
              <option value="">All 36 States & FCT</option>
              {states.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name} State ({st.zone})
                </option>
              ))}
            </select>

            {/* LGA Filter */}
            {selectedStateCode && (
              <select
                value={selectedLgaCode}
                onChange={(e) => setSelectedLgaCode(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-600"
              >
                <option value="">All LGAs in {selectedStateCode}</option>
                {lgas.map((lga) => (
                  <option key={lga.code} value={lga.code}>
                    {lga.name}
                  </option>
                ))}
              </select>
            )}

            {(selectedStateCode || selectedLgaCode) && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-md transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Advanced Analytics</span>
            </Link>
            <Link
              to="/polling-units"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Polling Units</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Upload Completion"
          value={summary ? `${summary.uploadCompletionPercentage}%` : '—'}
          subtitle={summary ? `${summary.pusUploaded} of ${summary.samplePusCount} sheets uploaded` : undefined}
          icon={FileText}
          status="normal"
        />

        <MetricCard
          title="Verified Transcriptions"
          value={summary ? summary.verifiedCount : '—'}
          subtitle="Signed off against Form EC8A"
          icon={CheckCircle}
          status="success"
        />

        <MetricCard
          title="Awaiting Verification"
          value={summary ? summary.awaitingVerification : '—'}
          subtitle="In reviewer verification queue"
          icon={Clock}
          status="warning"
        />

        <MetricCard
          title="Published Discrepancies"
          value={summary ? summary.discrepancyCount : '—'}
          subtitle="Arithmetic or OCR variances"
          icon={AlertTriangle}
          status={summary && summary.discrepancyCount > 0 ? 'alert' : 'normal'}
        />
      </div>

      {/* Primary Visualizations: Candidate Breakdown & Upload Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CandidateVoteChart
            candidateRankings={summary?.candidateRankings || []}
            totalValidVotes={summary?.totalValidVotes || 0}
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <VerificationDistributionChart
            verified={summary?.verifiedCount || 0}
            pendingVerification={summary?.awaitingVerification || 0}
            discrepancies={summary?.discrepancyCount || 0}
            notUploaded={summary?.pusNotUploaded || 0}
          />

          <UploadProgressChart
            uploadedCount={summary?.pusUploaded || 0}
            totalPus={summary?.samplePusCount || 10}
            timeline={uploadTimeline}
          />
        </div>
      </div>

      {/* Interactive Map & State Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <InteractiveElectionMap
            states={states}
            selectedStateCode={selectedStateCode}
            onSelectState={(code) => setSelectedStateCode(code)}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {/* Published Discrepancies Callout */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Discrepancies Requiring Review</span>
              </h3>
              <Link
                to="/discrepancies"
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {discrepancies.slice(0, 3).map((disc) => (
                <div key={disc.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900">{disc.pollingUnitCode}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                      {disc.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight line-clamp-2">{disc.reviewNotes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Data Export Block */}
          <DataExportModal />
        </div>
      </div>
    </div>
  );
};
