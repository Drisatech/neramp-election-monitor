import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Bell,
  FileCheck2,
  History,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  UserCheck,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Info,
} from 'lucide-react';
import { useElection } from '../context/ElectionContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchAnalyticsOverview,
  fetchCandidateComparisons,
  fetchStatisticalAnomalies,
  fetchDataQualityAlerts,
  updateDataQualityAlert,
  fetchSourceDocumentChanges,
  getAnalyticsCsvExportUrl,
} from '../services/api';
import {
  AnalyticsOverview,
  CandidateComparisonData,
  StatisticalAnomaly,
  DataQualityAlert,
  SourceDocumentChange,
} from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

type AnalyticsTab =
  | 'overview'
  | 'comparisons'
  | 'anomalies'
  | 'alerts'
  | 'sourceChanges'
  | 'historical'
  | 'reports';

export const AdvancedAnalyticsPage: React.FC = () => {
  const {
    selectedElectionId,
    states,
    selectedStateCode,
    setSelectedStateCode,
    lgas,
    selectedLgaCode,
    setSelectedLgaCode,
  } = useElection();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [comparisons, setComparisons] = useState<CandidateComparisonData | null>(null);
  const [anomalies, setAnomalies] = useState<StatisticalAnomaly[]>([]);
  const [alerts, setAlerts] = useState<DataQualityAlert[]>([]);
  const [sourceChanges, setSourceChanges] = useState<SourceDocumentChange[]>([]);

  // Filter states
  const [comparisonLevel, setComparisonLevel] = useState<'NATIONAL' | 'STATE' | 'LGA'>('NATIONAL');
  const [anomalyFilterRule, setAnomalyFilterRule] = useState<string>('');
  const [anomalyFilterSeverity, setAnomalyFilterSeverity] = useState<string>('');
  const [alertFilterSeverity, setAlertFilterSeverity] = useState<string>('');
  const [alertFilterStatus, setAlertFilterStatus] = useState<string>('');
  const [alertActionModal, setAlertActionModal] = useState<DataQualityAlert | null>(null);
  const [alertReviewNotes, setAlertReviewNotes] = useState<string>('');
  const [alertAssignee, setAlertAssignee] = useState<string>('Lead Verifier');
  const [isUpdatingAlert, setIsUpdatingAlert] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Load all analytics data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overRes, compRes, anomRes, altRes, srcRes] = await Promise.all([
        fetchAnalyticsOverview({
          electionId: selectedElectionId,
          state: selectedStateCode || undefined,
          lga: selectedLgaCode || undefined,
        }),
        fetchCandidateComparisons({
          electionId: selectedElectionId,
          level: comparisonLevel,
          filterValue: comparisonLevel === 'STATE' ? selectedStateCode : undefined,
        }),
        fetchStatisticalAnomalies({ electionId: selectedElectionId }),
        fetchDataQualityAlerts({ electionId: selectedElectionId }),
        fetchSourceDocumentChanges({ electionId: selectedElectionId }),
      ]);

      setOverview(overRes.data);
      setComparisons(compRes.data);
      setAnomalies(anomRes.data);
      setAlerts(altRes.data);
      setSourceChanges(srcRes.data);
    } catch (err) {
      console.error('Failed to load advanced analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedElectionId, selectedStateCode, selectedLgaCode, comparisonLevel]);

  // Handle alert status updates
  const handleAlertStatusUpdate = async (alertId: string, newStatus: string) => {
    try {
      setIsUpdatingAlert(true);
      await updateDataQualityAlert(alertId, {
        status: newStatus,
        assignedTo: alertAssignee,
        reviewNotes: alertReviewNotes || undefined,
        reviewerName: `${role.replace('_', ' ')} Coordinator`,
      });
      setActionSuccessMessage(`Alert ${alertId} updated to status: ${newStatus}`);
      setAlertActionModal(null);
      setAlertReviewNotes('');
      // Reload alerts
      const altRes = await fetchDataQualityAlerts({ electionId: selectedElectionId });
      setAlerts(altRes.data);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update alert:', err);
    } finally {
      setIsUpdatingAlert(false);
    }
  };

  const filteredAnomalies = anomalies.filter((a) => {
    if (anomalyFilterRule && a.ruleName !== anomalyFilterRule) return false;
    if (anomalyFilterSeverity && a.severity !== anomalyFilterSeverity) return false;
    return true;
  });

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilterSeverity && a.severity !== alertFilterSeverity) return false;
    if (alertFilterStatus && a.status !== alertFilterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Disclaimer */}
      <DisclaimerBanner lastUpdated={overview?.lastSyncTime} />

      {/* Page Title & Status Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                Advanced Election Analytics & Discrepancy Detection
              </h1>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                2027 MONITORING
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-dimensional analysis of Form EC8A results completeness, candidate margins, statistical anomalies, and data-quality alerts.
            </p>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-slate-700">
              <span className="text-slate-500 text-[11px] block">Active Alerts</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                {overview?.activeAlertsCount ?? alerts.length}
              </span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-slate-700">
              <span className="text-slate-500 text-[11px] block">Statistical Anomalies</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                {anomalies.length}
              </span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-slate-700">
              <span className="text-slate-500 text-[11px] block">Document Changes</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                {sourceChanges.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action feedback banner */}
        {actionSuccessMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & Completeness</span>
          </button>

          <button
            onClick={() => setActiveTab('comparisons')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'comparisons'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Candidate Comparisons</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'anomalies'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Statistical Anomalies</span>
            {anomalies.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {anomalies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Data-Quality Alert Centre</span>
            {alerts.filter((a) => a.status === 'NEW').length > 0 && (
              <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {alerts.filter((a) => a.status === 'NEW').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sourceChanges')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'sourceChanges'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Document Change Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Reports & Exports</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & COMPLETENESS                           */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Electoral Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Expected PUs</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {overview?.completeness.expectedPollingUnits.toLocaleString() ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400">Official PU count</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Results Received</span>
              <span className="text-lg font-bold font-mono text-emerald-800 mt-1 block">
                {overview?.completeness.resultsReceived.toLocaleString() ?? '—'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {overview?.completeness.completenessPercentage !== null
                  ? `${overview?.completeness.completenessPercentage}% complete`
                  : 'Pending baseline'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Verified Results</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {overview?.completeness.verifiedResults.toLocaleString() ?? '—'}
              </span>
              <span className="text-[10px] text-slate-500">
                {overview?.completeness.verificationPercentage !== null
                  ? `${overview?.completeness.verificationPercentage}% of expected`
                  : '—'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Discrepancies</span>
              <span className="text-lg font-bold font-mono text-rose-700 mt-1 block">
                {overview?.completeness.discrepancyFlagged.toLocaleString() ?? '—'}
              </span>
              <span className="text-[10px] text-rose-600">Requires review</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Turnout Rate</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {overview?.turnoutPercentage !== null ? `${overview?.turnoutPercentage}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400">Accredited / Registered</span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Rejected Ballots</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                {overview?.rejectedVotes.toLocaleString() ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400">
                {overview?.rejectedVotePercentage !== null ? `${overview?.rejectedVotePercentage}% of cast` : '—'}
              </span>
            </div>
          </div>

          {/* Completeness Lifecycle Funnel */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Form EC8A Result Completeness Lifecycle Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking progression from polling unit upload to human verification and publication.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Never treats missing results as zero votes.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Not Uploaded</span>
                <span className="text-base font-bold font-mono text-slate-700 mt-1 block">
                  {overview?.completeness.resultsMissing ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Awaiting PU upload</span>
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">2. Ingested (OCR Queue)</span>
                <span className="text-base font-bold font-mono text-blue-900 mt-1 block">
                  {overview?.completeness.awaitingOcr ?? 0}
                </span>
                <span className="text-[10px] text-blue-600">Pending OCR</span>
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">3. Under Verification</span>
                <span className="text-base font-bold font-mono text-amber-900 mt-1 block">
                  {overview?.completeness.underVerification ?? 0}
                </span>
                <span className="text-[10px] text-amber-600">Reviewer workspace</span>
              </div>

              <div className="p-3 bg-rose-50 rounded border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">4. Flagged Discrepancy</span>
                <span className="text-base font-bold font-mono text-rose-900 mt-1 block">
                  {overview?.completeness.discrepancyFlagged ?? 0}
                </span>
                <span className="text-[10px] text-rose-600">Variance identified</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">5. Human Verified</span>
                <span className="text-base font-bold font-mono text-emerald-900 mt-1 block">
                  {overview?.completeness.verifiedResults ?? 0}
                </span>
                <span className="text-[10px] text-emerald-600">Certified by verifier</span>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded border border-slate-800">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">6. Published</span>
                <span className="text-base font-bold font-mono text-white mt-1 block">
                  {overview?.completeness.approvedPublished ?? 0}
                </span>
                <span className="text-[10px] text-slate-300">Public dashboard</span>
              </div>
            </div>
          </div>

          {/* Geographic Breakdown Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Geographic Coverage & Verification Progress by State
                </h3>
                <p className="text-xs text-slate-500">
                  State-by-state completeness rates and current leading candidate party.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {overview?.geographicSummary.length ?? 0} State Jurisdictions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">State</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3 text-right">Expected PUs</th>
                    <th className="py-2.5 px-3 text-right">Received</th>
                    <th className="py-2.5 px-3 text-right">Verified</th>
                    <th className="py-2.5 px-3 text-right">Discrepancies</th>
                    <th className="py-2.5 px-3 text-center">Completeness</th>
                    <th className="py-2.5 px-4 text-center">Leading Party</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(overview?.geographicSummary || []).map((geo) => (
                    <tr key={geo.code} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{geo.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{geo.zone}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{geo.expectedPus.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{geo.receivedPus}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{geo.verifiedPus}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">{geo.discrepantPus}</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {geo.completenessRate !== null ? `${geo.completenessRate}%` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white bg-slate-700">
                          {geo.leadingParty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CANDIDATE COMPARISONS                             */}
      {/* ======================================================== */}
      {activeTab === 'comparisons' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Comparison Scope:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded">
                <button
                  onClick={() => setComparisonLevel('NATIONAL')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    comparisonLevel === 'NATIONAL' ? 'bg-white font-bold shadow-2xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  National
                </button>
                <button
                  onClick={() => setComparisonLevel('STATE')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    comparisonLevel === 'STATE' ? 'bg-white font-bold shadow-2xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  By State
                </button>
              </div>
            </div>

            {comparisonLevel === 'STATE' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Select State:</span>
                <select
                  value={selectedStateCode}
                  onChange={(e) => setSelectedStateCode(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-semibold"
                >
                  <option value="">National</option>
                  {states.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-xs text-slate-500 font-mono">
              Leading Margin: <strong>+{comparisons?.leadingMargin.toLocaleString()} votes</strong>
            </div>
          </div>

          {/* Candidate Standings Table with Vote Margins */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Candidate Standings, Valid-Vote Share & Margins
                </h3>
                <p className="text-xs text-slate-500">
                  Comparing only accredited candidates contesting the same election.
                </p>
              </div>
              <span className="text-xs text-slate-600 font-mono">
                Total Valid Votes: <strong>{comparisons?.totalValidVotes.toLocaleString()}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-3">Party</th>
                    <th className="py-3 px-3 text-right">Votes Tallied</th>
                    <th className="py-3 px-3 text-right">Valid Vote Share</th>
                    <th className="py-3 px-3 text-right">Vote Margin</th>
                    <th className="py-3 px-3 text-center">States Won</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(comparisons?.candidates || []).map((cand, idx) => (
                    <tr key={cand.candidateId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cand.candidateName}</div>
                        <div className="text-[11px] text-slate-500">{cand.partyName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white"
                          style={{ backgroundColor: cand.partyColor }}
                        >
                          {cand.partyCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {cand.totalVotes.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {cand.validVoteShare}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {cand.isLeading ? (
                          <span className="text-emerald-700 font-bold">
                            +{cand.voteMargin.toLocaleString()} (Lead)
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {cand.voteMargin.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {cand.statesWon}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cand.isLeading ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">
                            Leading
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Runner-up</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: STATISTICAL ANOMALIES                             */}
      {/* ======================================================== */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Statutory Explanatory Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Investigative Lead Protocol:</span> Statistical anomalies are quantitative indicators designed to highlight data patterns for field inquiry (e.g., turnout extremes, identical sequences, high rejected rates). They do not constitute evidence of fraud or official misconduct.
            </div>
          </div>

          {/* Anomaly Filters */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
            <select
              value={anomalyFilterRule}
              onChange={(e) => setAnomalyFilterRule(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800"
            >
              <option value="">Detection Rule: All</option>
              <option value="TURNOUT_OUTLIER">Turnout Outlier (&gt;95%)</option>
              <option value="REJECTED_VOTE_RATE_OUTLIER">High Rejected Vote Outlier (&gt;3σ)</option>
              <option value="IDENTICAL_VOTE_SEQUENCE">Identical Vote Sequence</option>
              <option value="HIGH_MARGIN_SKEW">High Margin Skew (&gt;98%)</option>
            </select>

            <select
              value={anomalyFilterSeverity}
              onChange={(e) => setAnomalyFilterSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800"
            >
              <option value="">Severity: All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <span className="text-slate-500 font-mono ml-auto">
              {filteredAnomalies.length} Flagged Anomalies
            </span>
          </div>

          {/* Anomalies List */}
          <div className="space-y-3">
            {filteredAnomalies.map((anom) => (
              <div
                key={anom.id}
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        anom.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {anom.severity} PRIORITY
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-mono">
                      {anom.ruleName.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">({anom.id})</span>
                  </div>

                  <span className="text-xs text-slate-500 font-mono">
                    Detected: {new Date(anom.detectedAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Polling Unit:</span>
                    <span className="font-bold text-slate-800">{anom.pollingUnitName}</span>
                    <span className="text-slate-500 font-mono text-[11px] block">{anom.pollingUnitCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Observed Value vs Expected:</span>
                    <span className="font-bold text-slate-800 font-mono">{anom.observedValue}</span>
                    <span className="text-slate-500 text-[11px] block">Range: {anom.expectedRange}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Investigation Status:</span>
                    <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold mt-0.5">
                      {anom.investigationStatus}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">Analytical Explanation: </span>
                  {anom.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DATA-QUALITY ALERT CENTRE                         */}
      {/* ======================================================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Alert Centre Summary & Filter */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={alertFilterSeverity}
                onChange={(e) => setAlertFilterSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800"
              >
                <option value="">Severity: All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={alertFilterStatus}
                onChange={(e) => setAlertFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-slate-800"
              >
                <option value="">Status: All</option>
                <option value="NEW">New</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500">Active Pipeline:</span>
              <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold">
                {alerts.filter((a) => a.status === 'NEW').length} New
              </span>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                {alerts.filter((a) => a.status === 'UNDER_INVESTIGATION').length} In Progress
              </span>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : alt.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{alt.title}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({alt.id})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded font-mono ${
                        alt.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : alt.status === 'NEW'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alt.status}
                    </span>
                    <button
                      onClick={() => setAlertActionModal(alt)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Manage Alert
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600">{alt.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono border-t border-slate-100 pt-2">
                  <div>
                    PU Code: <strong>{alt.pollingUnitCode || 'National / System'}</strong> · Assigned:{' '}
                    <strong>{alt.assignedTo || 'Unassigned'}</strong>
                  </div>
                  <div>Updated: {new Date(alt.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Alert Action Modal */}
          {alertActionModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Manage Alert: {alertActionModal.id}
                  </h4>
                  <button
                    onClick={() => setAlertActionModal(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-2">
                  <div>
                    <span className="font-semibold text-slate-700 block">Alert Summary:</span>
                    <span className="text-slate-800">{alertActionModal.title}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Assign Reviewer:</span>
                    <input
                      type="text"
                      value={alertAssignee}
                      onChange={(e) => setAlertAssignee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Investigation Notes:</span>
                    <textarea
                      rows={3}
                      value={alertReviewNotes}
                      onChange={(e) => setAlertReviewNotes(e.target.value)}
                      placeholder="Enter findings from polling unit coordinator..."
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAlertStatusUpdate(alertActionModal.id, 'ACKNOWLEDGED')}
                    disabled={isUpdatingAlert}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleAlertStatusUpdate(alertActionModal.id, 'UNDER_INVESTIGATION')}
                    disabled={isUpdatingAlert}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => handleAlertStatusUpdate(alertActionModal.id, 'RESOLVED')}
                    disabled={isUpdatingAlert}
                    className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-bold text-xs"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: SOURCE DOCUMENT CHANGE TRACKER                    */}
      {/* ======================================================== */}
      {activeTab === 'sourceChanges' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Official Document Checksum & Revision Log
            </h3>
            <p className="text-xs text-slate-500">
              Tracks genuine changes to scanned result sheets on the authorized portal using SHA-256 content hashes. Distinguishes genuine file changes from metadata re-indexing.
            </p>
          </div>

          <div className="space-y-3">
            {sourceChanges.map((change) => (
              <div
                key={change.id}
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        change.changeType === 'CONTENT_HASH_CHANGE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {change.changeType}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      PU Code: {change.pollingUnitCode}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      (v{change.previousVersion} → v{change.currentVersion})
                    </span>
                  </div>

                  {change.affectsVerifiedResult && (
                    <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                      Affects Certified Result
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">Previous Hash (SHA-256):</span>
                    <code className="text-slate-800 break-all">{change.previousHash}</code>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">Current Hash (SHA-256):</span>
                    <code className="text-emerald-800 font-bold break-all">{change.currentHash}</code>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700">Audit Notes: </span>
                  {change.auditNotes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: REPORTS & EXPORTS                                 */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Analytics Report Generation & Export
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download structured analytics records with provenance attribution, verification status, and data freshness timestamps.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="font-bold text-slate-900">Standard Data Protection & Export Disclaimers:</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Spreadsheet formula injection protection is enforced (characters =, +, -, @ are sanitized).</li>
                <li>Confidential observer contact details and sensitive evidence are excluded from public exports.</li>
                <li>All records include explicit INEC portal attribution and development simulation notice.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={getAnalyticsCsvExportUrl(selectedElectionId, selectedStateCode)}
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Analytics CSV Dataset</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
