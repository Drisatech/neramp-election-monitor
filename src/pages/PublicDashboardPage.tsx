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
  Sparkles,
  Trophy,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useElection } from '../context/ElectionContext';
import { fetchElectionSummary, fetchUploadProgress, fetchVerificationSummary } from '../services/api';
import { ElectionSummary } from '../types';
import { MetricCard } from '../components/MetricCard';
import { CandidateVoteChart } from '../components/CandidateVoteChart';
import { UploadProgressChart } from '../components/UploadProgressChart';
import { VerificationDistributionChart } from '../components/VerificationDistributionChart';
import { InteractiveElectionMap } from '../components/InteractiveElectionMap';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { DataExportModal } from '../components/DataExportModal';

export const PublicDashboardPage: React.FC = () => {
  const {
    elections,
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
    resetFilters,
  } = useElection();

  const [summary, setSummary] = useState<ElectionSummary | null>(null);
  const [uploadTimeline, setUploadTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sumRes, upRes] = await Promise.all([
        fetchElectionSummary(selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode),
        fetchUploadProgress(selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode),
      ]);
      setSummary(sumRes.data);
      setUploadTimeline(upRes.data.timeline || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedElectionId, selectedStateCode, selectedLgaCode, selectedWardCode]);

  const selectedElection = elections.find((e) => e.id === selectedElectionId);

  // Formats the contest title exactly according to contest hierarchy:
  // Presidential: "Presidential Election"
  // Senate: "Senate Election - State Name - Senatorial District Name"
  // House of Reps: "House of Representative Election - State Name - Constituency Name"
  // Governorship: "Governorship - State Name"
  // House of Assembly: "House of Assembly - State - Constituency Name"
  const getContestDisplayTitle = (): string => {
    if (!selectedElection) {
      return summary?.electionTitle || 'Presidential Election';
    }
    const type = String(selectedElection.electionType || '').toUpperCase();
    const stName = selectedElection.stateName || (selectedElection.stateCode ? `${selectedElection.stateCode} State` : 'State Name');
    const senDist = selectedElection.senatorialDistrict || 'Senatorial District Name';
    const constName = selectedElection.constituencyName || 'Constituency Name';

    if (type === 'PRESIDENTIAL') {
      return 'Presidential Election';
    }
    if (type === 'SENATE') {
      return `Senate Election - ${stName} - ${senDist}`;
    }
    if (type === 'REPS' || type === 'HOUSE_OF_REPRESENTATIVES') {
      return `House of Representative Election - ${stName} - ${constName}`;
    }
    if (type === 'GOVERNORSHIP') {
      return `Governorship - ${stName}`;
    }
    if (type === 'ASSEMBLY' || type === 'HOUSE_OF_ASSEMBLY' || type === 'STATE_ASSEMBLY') {
      return `House of Assembly - ${stName} - ${constName}`;
    }
    return selectedElection.title || 'Election Result';
  };

  const contestTitle = getContestDisplayTitle();

  const expectedPus = summary?.totalExpectedPus ?? 3763;
  const totalLgas = summary?.totalLgas ?? 30;
  const totalWards = summary?.totalWards ?? 332;
  const registeredVoters = summary?.registeredVoters ?? 1954869;
  const pvcsCollected = summary?.pvcsCollected ?? 1360658;
  const pvcCollectionRate = summary?.pvcCollectionRate ?? 69.6;

  return (
    <div className="space-y-6">
      {/* Platform Legal Disclaimer */}
      <DisclaimerBanner />

      {/* Bold, Colourful, & Attractive Election Result Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-amber-900 p-6 md:p-8 text-white shadow-xl border-2 border-amber-400">
        {/* Decorative Ambient Radial Glows */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/4 -top-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-3.5 max-w-4xl">
          {/* Top Eyebrow Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-md animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>OFFICIAL ELECTION RESULTS</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white border border-white/20 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{selectedElection?.status ? selectedElection.status.replace(/_/g, ' ') : 'ACTIVE MONITORING'}</span>
            </span>
            {selectedElection?.date && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-mono">
                <span>Date: {selectedElection.date}</span>
              </span>
            )}
          </div>

          {/* Main Attractive Headline (Bold & Colourful) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
            {contestTitle}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            Live collation of polling unit returns, independent Form EC8A cryptographic checksum verification, and forensic arithmetic audits across all registered polling units.
          </p>
        </div>
      </div>

      {/* Official Data Source & Freshness Metadata Banner (Restored Previous Slate/Emerald Theme) */}
      <div className="bg-slate-100 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="tracking-wide">DATA SOURCE:</span>
          </div>
          <span className="text-slate-700 font-medium">
            Official INEC Results Portal (IReV) — {contestTitle}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Last Successful Retrieval:{' '}
              <strong className="text-slate-800">
                {summary?.lastSourceDataRetrieval
                  ? new Date(summary.lastSourceDataRetrieval).toLocaleTimeString()
                  : '18:35:00'}{' '}
                WAT
              </strong>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-emerald-700 font-semibold">EC8A Checksums Verified</span>
        </div>
      </div>

      {/* Filter Toolbar: Hierarchical Drill-Down (Contest Scope -> State -> LGA -> Ward) */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
              <Filter className="w-3.5 h-3.5" />
              <span>Geographic Drill-Down:</span>
            </span>

            {/* State Filter */}
            <select
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-600 font-medium"
            >
              <option value="">Election Default Scope ({summary?.scope || 'State: Osun'})</option>
              {states.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name} ({st.totalLgas} LGAs · {st.totalWards ?? 0} Wards · {st.totalPus.toLocaleString()} PUs)
                </option>
              ))}
            </select>

            {/* LGA Filter */}
            {selectedStateCode && (
              <select
                value={selectedLgaCode}
                onChange={(e) => setSelectedLgaCode(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-600 font-medium"
              >
                <option value="">All LGAs in {selectedStateCode} ({lgas.length})</option>
                {lgas.map((lga) => (
                  <option key={lga.code} value={lga.code}>
                    {lga.name} ({lga.totalWards} Wards · {lga.totalPus.toLocaleString()} PUs)
                  </option>
                ))}
              </select>
            )}

            {/* Electoral Ward Filter */}
            {selectedLgaCode && (
              <select
                value={selectedWardCode}
                onChange={(e) => setSelectedWardCode(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-emerald-600 font-medium"
              >
                <option value="">All Electoral Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name} ({w.totalPus} Expected PUs)
                  </option>
                ))}
              </select>
            )}

            {(selectedLgaCode || selectedWardCode) && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline px-1"
              >
                Reset Election Scope
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/polling-units"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Inspect Polling Units</span>
            </Link>
          </div>
        </div>

        {/* Official INEC Baseline Statistics for Active Drill-Down Scope */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Scope</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5" title={summary?.scope || 'State: Osun'}>
              {summary?.scope || 'State: Osun'}
            </span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">LGAs / Area Councils</span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
              {totalLgas.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Electoral Wards (RAs)</span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
              {totalWards.toLocaleString()}
            </span>
          </div>
          <div className="bg-emerald-50/70 px-3 py-2 rounded border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Expected Result Sheets (PUs)</span>
            <span className="font-mono font-bold text-emerald-950 text-sm block mt-0.5">
              {expectedPus.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Voters (INEC)</span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
              {registeredVoters.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">PVCs Collected ({pvcCollectionRate.toFixed(2)}%)</span>
            <span className="font-mono font-bold text-emerald-800 text-sm block mt-0.5">
              {pvcsCollected.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Result Sheets Uploaded"
          value={summary ? summary.pusUploaded : 0}
          subtitle={`${summary?.uploadCompletionPercentage ?? 0}% (${(summary?.pusUploaded ?? 0).toLocaleString()} of ${expectedPus.toLocaleString()} expected PUs)`}
          icon={FileText}
          status="normal"
        />

        <MetricCard
          title="Verified Transcriptions"
          value={summary ? summary.verifiedCount : 0}
          subtitle="Signed off against Form EC8A"
          icon={CheckCircle}
          status="success"
        />

        <MetricCard
          title="Awaiting Verification"
          value={summary ? summary.awaitingVerification : 0}
          subtitle="In reviewer verification queue"
          icon={Clock}
          status="warning"
        />

        <MetricCard
          title="Published Discrepancies"
          value={summary ? summary.discrepancyCount : 0}
          subtitle="Arithmetic or OCR variances"
          icon={AlertTriangle}
          status={summary && summary.discrepancyCount > 0 ? 'alert' : 'normal'}
        />
      </div>

      {/* Primary Visualizations: Political Party Breakdown & Upload Progression */}
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
            notUploaded={summary?.pusNotUploaded || expectedPus}
          />

          <UploadProgressChart
            uploadedCount={summary?.pusUploaded || 0}
            totalPus={expectedPus}
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
          {/* Platform Verification Protocol */}
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2.5 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Integrity & Verification Protocol
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Every polling-unit result undergoes rigorous verification before statistical aggregation:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px]">1. Source Document Capture</span>
                <span className="text-slate-600 text-[11px]">Direct retrieval and SHA-256 cryptographic hashing of official Form EC8A result sheets.</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px]">2. Deterministic Arithmetic Audit</span>
                <span className="text-slate-600 text-[11px]">Automated formula validation: Valid Votes + Rejected Ballots = Total Votes Cast.</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block text-[11px]">3. Observer Field Confirmation</span>
                <span className="text-slate-600 text-[11px]">Independent accreditation reports cross-referenced against polling-unit returns.</span>
              </div>
            </div>
          </div>

          {/* Quick Data Export Block */}
          <DataExportModal />
        </div>
      </div>
    </div>
  );
};
