import { Election, ElectionSummary, State, LGA, Ward, PollingUnit, Discrepancy, IncidentReport } from '../types';

const API_BASE = '/api/v1';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchElections(): Promise<{ data: Election[]; total: number }> {
  const res = await fetch(`${API_BASE}/elections`);
  if (!res.ok) throw new Error('Failed to fetch elections');
  return res.json();
}

export async function fetchElectionSummary(
  electionId: string,
  state?: string,
  lga?: string
): Promise<{ data: ElectionSummary }> {
  const params = new URLSearchParams();
  if (state) params.set('state', state);
  if (lga) params.set('lga', lga);
  const res = await fetch(`${API_BASE}/elections/${electionId}/summary?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch election summary');
  return res.json();
}

export async function fetchUploadProgress(electionId: string, state?: string) {
  const params = new URLSearchParams();
  if (state) params.set('state', state);
  const res = await fetch(`${API_BASE}/elections/${electionId}/upload-progress?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch upload progress');
  return res.json();
}

export async function fetchVerificationSummary(electionId: string) {
  const res = await fetch(`${API_BASE}/elections/${electionId}/verification-summary`);
  if (!res.ok) throw new Error('Failed to fetch verification summary');
  return res.json();
}

export async function fetchStates(): Promise<{ data: State[]; total: number }> {
  const res = await fetch(`${API_BASE}/states`);
  if (!res.ok) throw new Error('Failed to fetch states');
  return res.json();
}

export async function fetchLgas(state?: string): Promise<{ data: LGA[]; total: number }> {
  const params = new URLSearchParams();
  if (state) params.set('state', state);
  const res = await fetch(`${API_BASE}/lgas?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch LGAs');
  return res.json();
}

export async function fetchWards(lga?: string, state?: string): Promise<{ data: Ward[]; total: number }> {
  const params = new URLSearchParams();
  if (lga) params.set('lga', lga);
  if (state) params.set('state', state);
  const res = await fetch(`${API_BASE}/wards?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch wards');
  return res.json();
}

export async function fetchPollingUnits(params: {
  electionId?: string;
  state?: string;
  lga?: string;
  ward?: string;
  uploadStatus?: string;
  verificationStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: PollingUnit[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> {
  const q = new URLSearchParams();
  if (params.electionId) q.set('electionId', params.electionId);
  if (params.state) q.set('state', params.state);
  if (params.lga) q.set('lga', params.lga);
  if (params.ward) q.set('ward', params.ward);
  if (params.uploadStatus) q.set('uploadStatus', params.uploadStatus);
  if (params.verificationStatus) q.set('verificationStatus', params.verificationStatus);
  if (params.search) q.set('search', params.search);
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/polling-units?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch polling units');
  return res.json();
}

export async function fetchPollingUnitDetail(id: string) {
  const res = await fetch(`${API_BASE}/polling-units/${id}`);
  if (!res.ok) throw new Error('Failed to fetch polling unit detail');
  return res.json();
}

export async function fetchPublishedDiscrepancies(electionId: string): Promise<{ data: Discrepancy[]; total: number }> {
  const res = await fetch(`${API_BASE}/elections/${electionId}/published-discrepancies`);
  if (!res.ok) throw new Error('Failed to fetch discrepancies');
  return res.json();
}

export async function fetchPublishedIncidents(electionId: string): Promise<{ data: IncidentReport[]; total: number }> {
  const res = await fetch(`${API_BASE}/elections/${electionId}/published-incidents`);
  if (!res.ok) throw new Error('Failed to fetch published incidents');
  return res.json();
}

export async function submitIncidentReport(payload: {
  category: string;
  stateName: string;
  lgaName: string;
  pollingUnitCode?: string;
  description: string;
  severity: string;
}) {
  const res = await fetch(`${API_BASE}/observer/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit incident report');
  return res.json();
}

export async function reviewVerificationRecord(resultSheetId: string, decision: 'APPROVED' | 'DISCREPANCY_FLAGGED', notes: string) {
  const res = await fetch(`${API_BASE}/verification/${resultSheetId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, notes }),
  });
  if (!res.ok) throw new Error('Failed to submit verification review');
  return res.json();
}

export async function correctTranscription(
  resultSheetId: string,
  data: {
    validVotes: number;
    rejectedVotes: number;
    totalVotesCast: number;
    partyVotes: Record<string, number>;
    correctionReason: string;
  }
) {
  const res = await fetch(`${API_BASE}/verification/${resultSheetId}/correct-transcription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to correct transcription');
  return res.json();
}

export async function fetchVerificationHistory(resultSheetId: string) {
  const res = await fetch(`${API_BASE}/verification/${resultSheetId}/history`);
  if (!res.ok) throw new Error('Failed to fetch verification history');
  return res.json();
}

export async function fetchIngestionStatus() {
  const res = await fetch(`${API_BASE}/admin/ingestion/status`);
  if (!res.ok) throw new Error('Failed to fetch ingestion status');
  return res.json();
}

export async function triggerIngestionRun(
  adapter = 'InecApprovedSourceAdapter',
  electionId = 'elec-2026-gov-osun',
  maxWards = 20
) {
  const res = await fetch(`${API_BASE}/admin/ingestion/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapter, electionId, maxWards }),
  });
  if (!res.ok) throw new Error('Failed to trigger ingestion run');
  return res.json();
}

export async function testSourceConnection(adapter = 'InecApprovedSourceAdapter') {
  const res = await fetch(`${API_BASE}/admin/ingestion/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adapter }),
  });
  if (!res.ok) throw new Error('Failed to test source connection');
  return res.json();
}

export async function fetchSchedulerConfig() {
  const res = await fetch(`${API_BASE}/admin/ingestion/scheduler`);
  if (!res.ok) throw new Error('Failed to fetch scheduler configuration');
  return res.json();
}

export async function updateSchedulerConfig(data: {
  enabled?: boolean;
  intervalMinutes?: number;
  adapter?: string;
  targetElectionId?: string;
}) {
  const res = await fetch(`${API_BASE}/admin/ingestion/scheduler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update scheduler configuration');
  return res.json();
}

export async function fetchIngestionJobs() {
  const res = await fetch(`${API_BASE}/admin/ingestion/jobs`);
  if (!res.ok) throw new Error('Failed to fetch ingestion jobs');
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/admin/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function setDataSourceMode(mode: string) {
  const res = await fetch(`${API_BASE}/admin/set-data-source`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error('Failed to set data source mode');
  return res.json();
}

// Advanced Analytics & Discrepancies
export async function fetchAnalyticsOverview(params: {
  electionId?: string;
  state?: string;
  lga?: string;
  verificationStatus?: string;
}) {
  const q = new URLSearchParams();
  if (params.electionId) q.set('electionId', params.electionId);
  if (params.state) q.set('state', params.state);
  if (params.lga) q.set('lga', params.lga);
  if (params.verificationStatus) q.set('verificationStatus', params.verificationStatus);

  const res = await fetch(`${API_BASE}/analytics/overview?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

export async function fetchCandidateComparisons(params: {
  electionId?: string;
  level?: string;
  filterValue?: string;
}) {
  const q = new URLSearchParams();
  if (params.electionId) q.set('electionId', params.electionId);
  if (params.level) q.set('level', params.level);
  if (params.filterValue) q.set('filterValue', params.filterValue);

  const res = await fetch(`${API_BASE}/analytics/candidate-comparisons?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch candidate comparisons');
  return res.json();
}

export async function fetchStatisticalAnomalies(params?: {
  electionId?: string;
  ruleName?: string;
  severity?: string;
}) {
  const q = new URLSearchParams();
  if (params?.electionId) q.set('electionId', params.electionId);
  if (params?.ruleName) q.set('ruleName', params.ruleName);
  if (params?.severity) q.set('severity', params.severity);

  const res = await fetch(`${API_BASE}/analytics/anomalies?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch statistical anomalies');
  return res.json();
}

export async function fetchDataQualityAlerts(params?: {
  electionId?: string;
  severity?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.electionId) q.set('electionId', params.electionId);
  if (params?.severity) q.set('severity', params.severity);
  if (params?.status) q.set('status', params.status);

  const res = await fetch(`${API_BASE}/analytics/alerts?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch data quality alerts');
  return res.json();
}

export async function updateDataQualityAlert(
  alertId: string,
  payload: {
    status: string;
    assignedTo?: string;
    reviewNotes?: string;
    reviewerName?: string;
  }
) {
  const res = await fetch(`${API_BASE}/analytics/alerts/${alertId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update alert');
  return res.json();
}

export async function fetchSourceDocumentChanges(params?: {
  electionId?: string;
  pollingUnitCode?: string;
}) {
  const q = new URLSearchParams();
  if (params?.electionId) q.set('electionId', params.electionId);
  if (params?.pollingUnitCode) q.set('pollingUnitCode', params.pollingUnitCode);

  const res = await fetch(`${API_BASE}/analytics/source-changes?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch source document changes');
  return res.json();
}

export async function fetchHistoricalComparisons(resultSheetId: string) {
  const res = await fetch(`${API_BASE}/analytics/historical-comparisons/${resultSheetId}`);
  if (!res.ok) throw new Error('Failed to fetch historical comparisons');
  return res.json();
}

export function getAnalyticsCsvExportUrl(electionId: string, state?: string) {
  const q = new URLSearchParams();
  q.set('electionId', electionId);
  if (state) q.set('state', state);
  return `${API_BASE}/analytics/reports/export?${q.toString()}`;
}

// ==========================================
// Administrative Command Centre Endpoints
// ==========================================

export async function fetchCommandCenterMetrics() {
  const res = await fetch(`${API_BASE}/admin/command-center/metrics`);
  if (!res.ok) throw new Error('Failed to fetch command center metrics');
  return res.json();
}

export async function fetchAdminUsers(params?: { role?: string; isActive?: boolean; search?: string }) {
  const q = new URLSearchParams();
  if (params?.role) q.set('role', params.role);
  if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
  if (params?.search) q.set('search', params.search);

  const res = await fetch(`${API_BASE}/admin/users?${q.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return res.json();
}

export async function createAdminUser(data: any) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to create user');
  }
  return res.json();
}

export async function updateAdminUser(id: string, data: any) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to update user');
  }
  return res.json();
}

export async function toggleUserStatus(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/toggle-status`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle user status');
  return res.json();
}

export async function resetUserAccess(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/reset-access`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset user access');
  return res.json();
}

export async function deleteAdminUser(id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}

export async function fetchAuditLogsExport() {
  const res = await fetch(`${API_BASE}/admin/audit-logs/export`);
  if (!res.ok) throw new Error('Failed to export audit logs');
  return res.json();
}

export async function fetchVerifierSupervision() {
  const res = await fetch(`${API_BASE}/admin/supervision/verifiers`);
  if (!res.ok) throw new Error('Failed to fetch verifier supervision data');
  return res.json();
}

export async function reassignDisputedResult(resultSheetId: string, secondaryVerifierName: string, reason: string) {
  const res = await fetch(`${API_BASE}/admin/supervision/reassign-disputed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultSheetId, secondaryVerifierName, reason }),
  });
  if (!res.ok) throw new Error('Failed to reassign disputed result');
  return res.json();
}

export async function verifyObserverCredentials(observerId: string, badge: string) {
  const res = await fetch(`${API_BASE}/admin/observers/${observerId}/verify-credentials`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ badge }),
  });
  if (!res.ok) throw new Error('Failed to verify observer credentials');
  return res.json();
}

export async function publishProtectedIncident(incidentId: string, publishNotes?: string) {
  const res = await fetch(`${API_BASE}/admin/incidents/${incidentId}/publish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishNotes }),
  });
  if (!res.ok) throw new Error('Failed to publish protected incident');
  return res.json();
}

export async function pauseIngestionScheduler(paused: boolean) {
  const res = await fetch(`${API_BASE}/admin/operations/pause-scheduler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paused }),
  });
  if (!res.ok) throw new Error('Failed to update scheduler state');
  return res.json();
}

export async function clearVolatileCache() {
  const res = await fetch(`${API_BASE}/admin/operations/clear-cache`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear volatile cache');
  return res.json();
}

export async function triggerSystemDiagnostics() {
  const res = await fetch(`${API_BASE}/admin/operations/diagnostics`);
  if (!res.ok) throw new Error('Failed to run system diagnostics');
  return res.json();
}

export async function retryFailedJob(jobId: string) {
  const res = await fetch(`${API_BASE}/admin/operations/retry-job/${jobId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry job');
  return res.json();
}

export async function fetchConfigElections() {
  const res = await fetch(`${API_BASE}/admin/config/elections`);
  if (!res.ok) throw new Error('Failed to fetch elections configuration');
  return res.json();
}

export async function createConfigElection(data: any) {
  const res = await fetch(`${API_BASE}/admin/config/elections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save election configuration');
  return res.json();
}

export async function fetchConfigCandidates() {
  const res = await fetch(`${API_BASE}/admin/config/candidates`);
  if (!res.ok) throw new Error('Failed to fetch candidates configuration');
  return res.json();
}

export async function createConfigCandidate(data: any) {
  const res = await fetch(`${API_BASE}/admin/config/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save candidate');
  return res.json();
}

export async function fetchConfigParties() {
  const res = await fetch(`${API_BASE}/admin/config/parties`);
  if (!res.ok) throw new Error('Failed to fetch parties');
  return res.json();
}

export async function uploadEvidenceFile(filename: string, fileContentBase64: string, contentType?: string) {
  const res = await fetch(`${API_BASE}/evidence/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, fileContentBase64, contentType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Failed to upload and validate evidence');
  }
  return res.json();
}

export async function fetchSystemHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health probe returned unhealthy status');
  return res.json();
}

export async function fetchReadinessProbe() {
  const res = await fetch(`${API_BASE}/health/ready`);
  if (!res.ok) throw new Error('Service is not ready');
  return res.json();
}

export async function fetchReadinessStatus() {
  const res = await fetch(`${API_BASE}/admin/readiness/status`);
  if (!res.ok) throw new Error('Failed to fetch readiness status');
  return res.json();
}

export async function runReadinessDrill(drillType: string) {
  const res = await fetch(`${API_BASE}/admin/readiness/run-drill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drillType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to execute drill');
  }
  return res.json();
}

export async function toggleReadinessChecklist(checklist: string, taskId: string) {
  const res = await fetch(`${API_BASE}/admin/readiness/toggle-checklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checklist, taskId }),
  });
  if (!res.ok) throw new Error('Failed to toggle checklist task');
  return res.json();
}

export async function purgeDemonstrationData() {
  const res = await fetch(`${API_BASE}/admin/data/purge-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to purge demo data');
  }
  return res.json();
}

