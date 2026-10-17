export type ElectionType = 'PRESIDENTIAL' | 'GOVERNORSHIP' | 'SENATE' | 'REPS' | 'ASSEMBLY';

export interface Election {
  id: string;
  title: string;
  electionType: ElectionType;
  date: string;
  status: string;
  sourceReference: string;
  isDemonstration: boolean;
}

export interface State {
  id: string;
  code: string;
  name: string;
  zone: string;
  totalLgas: number;
  totalPus: number;
  registeredVoters: number;
  latitude: number;
  longitude: number;
}

export interface LGA {
  id: string;
  code: string;
  name: string;
  stateCode: string;
  totalWards: number;
  totalPus: number;
}

export interface Ward {
  id: string;
  code: string;
  name: string;
  lgaCode: string;
  stateCode: string;
  totalPus: number;
}

export interface PollingUnit {
  id: string;
  code: string; // Zero-padded string identifier e.g. "25-01-01-001"
  name: string;
  stateCode: string;
  lgaCode: string;
  wardCode: string;
  registeredVoters: number;
  accreditedVoters: number;
  electionId: string;
  uploadStatus: 'UPLOADED' | 'NOT_YET_UPLOADED' | 'SOURCE_UNAVAILABLE';
  transcriptionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_APPLICABLE';
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'DISCREPANCY_FLAGGED' | 'NOT_APPLICABLE';
  sourceUploadTimestamp?: string;
  lastRetrievedTimestamp?: string;
  resultSheetId?: string;
  latitude?: number;
  longitude?: number;
  stateName?: string;
  lgaName?: string;
  wardName?: string;
}

export interface ResultSheet {
  id: string;
  pollingUnitCode: string;
  electionId: string;
  formType: 'EC8A';
  sourceUrl: string;
  fileHash: string; // SHA-256
  imageUrl: string;
  uploadTimestamp: string;
  retrievalTimestamp: string;
  ocrConfidence: number;
  sourceStatus: 'ORIGINAL' | 'REVISED_VERSION';
  version: number;
  transcription: {
    validVotes: number;
    rejectedVotes: number;
    totalVotesCast: number;
    partyVotes: Record<string, number>;
  };
  ocrExtraction: {
    validVotes: number;
    rejectedVotes: number;
    totalVotesCast: number;
    partyVotes: Record<string, number>;
    rawText: string;
  };
  arithmeticCheck: {
    passed: boolean;
    difference: number;
    formula: string;
    details: string;
  };
  verifierNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isConfidential?: boolean;
  requiresHumanReview?: boolean;
  reviewReasons?: string[];
  ballotStatistics?: {
    registeredVoters: number;
    accreditedVoters: number;
    ballotsIssued: number;
    unusedBallots: number;
    spoiledBallots: number;
    rejectedVotes: number;
    validVotes: number;
    totalVotesCast: number;
  };
  versionHistory?: Array<{
    versionNumber: number;
    actor: string;
    actionType: string;
    timestamp: string;
    reason: string;
    previousPartyVotes?: Record<string, number>;
    newPartyVotes?: Record<string, number>;
  }>;
  auditLogs?: Array<{
    id: string;
    actor: string;
    action: string;
    target: string;
    details: string;
    timestamp: string;
  }>;
}

export interface Discrepancy {
  id: string;
  electionId: string;
  pollingUnitCode: string;
  pollingUnitName: string;
  stateName: string;
  lgaName: string;
  category: 'ARITHMETIC_MISMATCH' | 'OCR_TRANSCRIPTION_VARIANCE' | 'BALLOT_TOTAL_EXCEEDS_ACCREDITED' | 'OVERVOTING_FLAG' | 'SOURCE_METADATA_DISCREPANCY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  originalValue: string;
  comparedValue: string;
  detectedAt: string;
  status: 'REQUIRES_REVIEW' | 'UNDER_REVIEW' | 'VERIFIED_CORRECTED' | 'REJECTED';
  reviewNotes: string;
  resolvedAt?: string;
}

export interface IncidentReport {
  id: string;
  electionId: string;
  category: 'DELAYED_OPENING' | 'BVAS_MALFUNCTION' | 'RESULT_SHEET_UNAVAILABLE' | 'BALLOT_DISRUPTION' | 'SECURITY_INCIDENT' | 'VOTER_INTIMIDATION';
  stateName: string;
  lgaName: string;
  wardName?: string;
  pollingUnitCode?: string;
  reportedAt: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED_FOR_PUBLICATION' | 'REJECTED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isPublished: boolean;
  evidenceCount: number;
  observerBadge: string;
}

export interface CandidateRanking {
  candidateId: string;
  candidateName: string;
  partyCode: string;
  partyName: string;
  color: string;
  votes: number;
  percentage: number;
}

export interface ElectionSummary {
  electionId: string;
  electionTitle: string;
  scope: string;
  statesCoveredCount: number;
  totalExpectedPus: number;
  samplePusCount: number;
  pusUploaded: number;
  pusNotUploaded: number;
  pusUnavailable: number;
  uploadCompletionPercentage: number;
  awaitingTranscription: number;
  awaitingVerification: number;
  verifiedCount: number;
  discrepancyCount: number;
  totalValidVotes: number;
  totalRejectedVotes: number;
  totalVotesCast: number;
  candidateRankings: CandidateRanking[];
  partyVotes: Record<string, number>;
  lastSourceDataRetrieval: string;
  lastDatabaseUpdate: string;
  dataSourceMode: 'DEVELOPMENT' | 'HISTORICAL' | 'MANUAL_IMPORT' | 'OFFICIAL_SOURCE';
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PROJECT_ADMIN'
  | 'ELECTION_ANALYST'
  | 'STATE_COORDINATOR'
  | 'LGA_COORDINATOR'
  | 'MONITORING_COORDINATOR'
  | 'RESULT_VERIFIER'
  | 'REGISTERED_OBSERVER'
  | 'PUBLIC_USER';

export interface CompletenessMetrics {
  expectedPollingUnits: number;
  resultsReceived: number;
  resultsMissing: number;
  resultsIncomplete: number;
  awaitingOcr: number;
  underVerification: number;
  discrepancyFlagged: number;
  verifiedResults: number;
  approvedPublished: number;
  completenessPercentage: number | null;
  verificationPercentage: number | null;
  hasReliableBaseline: boolean;
}

export interface GeographicCompletenessSummary {
  code: string;
  name: string;
  zone?: string;
  expectedPus: number;
  samplePusCount: number;
  receivedPus: number;
  verifiedPus: number;
  discrepantPus: number;
  completenessRate: number | null;
  verificationRate: number | null;
  leadingParty: string;
}

export interface AnalyticsOverview {
  electionId: string;
  electionTitle: string;
  electionYear: number;
  electionType: string;
  geographicScope: string;
  lastSyncTime: string;
  lastAnalyticsUpdate: string;
  dataSourceMode: string;
  isDemonstration: boolean;
  registeredVoters: number;
  accreditedVoters: number;
  totalVotesCast: number;
  validVotes: number;
  rejectedVotes: number;
  turnoutPercentage: number | null;
  rejectedVotePercentage: number | null;
  completeness: CompletenessMetrics;
  unresolvedDiscrepancies: number;
  activeAnomaliesCount: number;
  activeAlertsCount: number;
  geographicSummary: GeographicCompletenessSummary[];
}

export interface CandidateComparison {
  candidateId: string;
  candidateName: string;
  partyCode: string;
  partyName: string;
  partyColor: string;
  totalVotes: number;
  validVoteShare: number;
  voteMargin: number;
  statesWon: number;
  isLeading: boolean;
}

export interface CandidateComparisonData {
  electionId: string;
  electionTitle: string;
  level: string;
  filterValue?: string;
  totalValidVotes: number;
  totalVotesCast: number;
  leadingCandidate: CandidateComparison | null;
  leadingMargin: number;
  candidates: CandidateComparison[];
}

export interface StatisticalAnomaly {
  id: string;
  electionId: string;
  pollingUnitCode: string;
  pollingUnitName: string;
  stateCode: string;
  lgaCode: string;
  ruleName: 'TURNOUT_OUTLIER' | 'REJECTED_VOTE_RATE_OUTLIER' | 'HIGH_MARGIN_SKEW' | 'IDENTICAL_VOTE_SEQUENCE' | 'BENFORD_DIGIT_VARIANCE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  comparisonGroup: string;
  thresholdApplied: string;
  observedValue: string;
  expectedRange: string;
  explanation: string;
  investigationStatus: 'OPEN' | 'INVESTIGATING' | 'CONFIRMED_BENIGN' | 'REQUIRES_SECONDARY_AUDIT' | 'RESOLVED';
  detectedAt: string;
  reviewerNotes?: string;
  disclaimer: string;
}

export interface DataQualityAlert {
  id: string;
  alertType: 'MISSING_RESULTS' | 'VALIDATION_FAILURE' | 'OCR_DISCREPANCY' | 'SOURCE_DOCUMENT_CHANGE' | 'DUPLICATE_RECORD' | 'MAPPING_PROBLEM' | 'SYNCHRONIZATION_FAILURE' | 'STATISTICAL_ANOMALY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  electionId: string;
  pollingUnitCode?: string;
  stateCode?: string;
  lgaCode?: string;
  createdAt: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'REOPENED';
  assignedTo?: string;
  acknowledgedBy?: string;
  resolutionNotes?: string;
  updatedAt: string;
}

export interface SourceDocumentChange {
  id: string;
  pollingUnitCode: string;
  electionId: string;
  previousHash: string;
  currentHash: string;
  previousVersion: number;
  currentVersion: number;
  changeType: 'CONTENT_HASH_CHANGE' | 'METADATA_ONLY_CHANGE';
  sourceUrl: string;
  detectedAt: string;
  ocrRerunStatus: 'REQUIRED' | 'PENDING' | 'COMPLETED' | 'NOT_REQUIRED';
  affectsVerifiedResult: boolean;
  auditNotes: string;
}

export interface HistoricalComparisonRecord {
  resultSheetId: string;
  pollingUnitCode: string;
  currentVersion: number;
  rawOcrExtraction: {
    timestamp: string;
    validVotes: number;
    rejectedVotes: number;
    totalVotesCast: number;
    partyVotes: Record<string, number>;
    ocrConfidence: number;
  };
  currentTranscription: {
    timestamp: string;
    validVotes: number;
    rejectedVotes: number;
    totalVotesCast: number;
    partyVotes: Record<string, number>;
    verifiedBy: string;
    isVerified: boolean;
  };
  versionHistory: Array<{
    versionNumber: number;
    actor: string;
    actionType: string;
    timestamp: string;
    reason: string;
    previousPartyVotes?: Record<string, number>;
    newPartyVotes?: Record<string, number>;
  }>;
  auditTrail: Array<{
    id: string;
    actor: string;
    action: string;
    target: string;
    details: string;
    timestamp: string;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  assignedStateCode?: string;
  assignedLgaCode?: string;
  assignedWardCode?: string;
  assignedPus?: string[];
  badge?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommandCenterMetrics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  configuredElectionsCount: number;
  configuredStatesCount: number;
  configuredLgasCount: number;
  configuredPusCount: number;
  resultsExpected: number;
  resultsReceived: number;
  resultsVerified: number;
  resultsPendingVerification: number;
  resultsDisputed: number;
  unresolvedDiscrepancies: number;
  unresolvedIncidents: number;
  ocrQueueStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    averageLatencySeconds: number;
    activeWorkers: number;
  };
  ingestionStatus: {
    schedulerPaused: boolean;
    intervalMinutes: number;
    lastRun: string;
    nextRun: string;
    activeAdapter: string;
  };
  inecConnectivity: {
    status: string;
    portalUrl: string;
    latencyMs: number;
    rateLimitQuota: string;
    authConfigured: boolean;
  };
  systemHealth: {
    apiStatus: string;
    databaseStatus: string;
    connectionPool: { active: number; idle: number; max: number };
    cacheStatus: string;
    memoryUsageMb: number;
    storageCapacityGb: { used: number; available: number; total: number };
  };
}

export interface VerifierSupervisionItem {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedJurisdiction: string;
  totalReviewed: number;
  approvedCount: number;
  flaggedDiscrepanciesCount: number;
  averageTimePerSheetSeconds: number;
  lastActive: string;
  status: 'ONLINE' | 'IDLE' | 'OFFLINE';
}

export interface AuditLogExportPayload {
  exportedAt: string;
  recordCount: number;
  integritySha256: string;
  legalNotice: string;
  logs: Array<{
    id: string;
    timestamp: string;
    actor: string;
    role?: string;
    ipAddress?: string;
    action: string;
    target: string;
    details: string;
  }>;
}

