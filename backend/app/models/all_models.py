import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


# 1. Election Types
class ElectionType(Base):
    __tablename__ = "election_types"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)  # PRESIDENTIAL, GOVERNORSHIP, SENATE, REPS, ASSEMBLY
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    elections = relationship("Election", back_populates="election_type")


# 2. Elections
class Election(Base):
    __tablename__ = "elections"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    election_type_id = Column(String(36), ForeignKey("election_types.id"), nullable=False)
    title = Column(String(255), nullable=False)
    election_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="ACTIVE_MONITORING", nullable=False)
    is_demonstration = Column(Boolean, default=True, nullable=False)
    source_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    election_type = relationship("ElectionType", back_populates="elections")
    contests = relationship("ElectionContest", back_populates="election")
    polling_units = relationship("PollingUnit", back_populates="election")


# 3. States
class State(Base):
    __tablename__ = "states"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)  # String identifier e.g. "LAGOS", "KANO"
    name = Column(String(100), nullable=False)
    zone = Column(String(50), nullable=False)  # Geopolitical zone
    total_lgas = Column(Integer, nullable=False, default=0)
    total_pus = Column(Integer, nullable=False, default=0)
    registered_voters = Column(Integer, nullable=False, default=0)
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)

    lgas = relationship("LGA", back_populates="state")


# 4. LGAs (Local Government Areas)
class LGA(Base):
    __tablename__ = "lgas"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    state_id = Column(String(36), ForeignKey("states.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True)  # String identifier
    name = Column(String(150), nullable=False)
    total_wards = Column(Integer, nullable=False, default=0)
    total_pus = Column(Integer, nullable=False, default=0)

    __table_args__ = (UniqueConstraint("state_id", "code", name="uq_lga_state_code"),)

    state = relationship("State", back_populates="lgas")
    wards = relationship("Ward", back_populates="lga")


# 5. Wards
class Ward(Base):
    __tablename__ = "wards"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    lga_id = Column(String(36), ForeignKey("lgas.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False, index=True)  # String identifier
    name = Column(String(150), nullable=False)
    total_pus = Column(Integer, nullable=False, default=0)

    __table_args__ = (UniqueConstraint("lga_id", "code", name="uq_ward_lga_code"),)

    lga = relationship("LGA", back_populates="wards")
    polling_units = relationship("PollingUnit", back_populates="ward")


# 6. Polling Units (Preserving official zero-padded strings)
class PollingUnit(Base):
    __tablename__ = "polling_units"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), nullable=False, index=True)  # Official zero-padded identifier e.g. "25-01-01-001"
    name = Column(String(255), nullable=False)
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=False, index=True)
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False, index=True)
    registered_voters = Column(Integer, default=0, nullable=False)
    accredited_voters = Column(Integer, default=0, nullable=False)
    upload_status = Column(String(50), default="NOT_YET_UPLOADED", nullable=False)  # UPLOADED, NOT_YET_UPLOADED, SOURCE_UNAVAILABLE
    transcription_status = Column(String(50), default="NOT_APPLICABLE", nullable=False)  # PENDING, IN_PROGRESS, COMPLETED, NOT_APPLICABLE
    verification_status = Column(String(50), default="NOT_APPLICABLE", nullable=False)  # PENDING_VERIFICATION, VERIFIED, DISCREPANCY_FLAGGED, NOT_APPLICABLE
    source_upload_timestamp = Column(DateTime(timezone=True), nullable=True)
    last_retrieved_timestamp = Column(DateTime(timezone=True), nullable=True)
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)

    __table_args__ = (
        UniqueConstraint("election_id", "code", name="uq_pu_election_code"),
        Index("idx_pu_status", "upload_status", "verification_status"),
    )

    ward = relationship("Ward", back_populates="polling_units")
    election = relationship("Election", back_populates="polling_units")
    result_sheets = relationship("ResultSheet", back_populates="polling_unit")


# 7. Political Parties
class PoliticalParty(Base):
    __tablename__ = "political_parties"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(20), unique=True, nullable=False, index=True)  # APC, PDP, LP, etc.
    name = Column(String(150), nullable=False)
    color = Column(String(10), default="#64748b", nullable=False)

    candidates = relationship("Candidate", back_populates="party")


# 8. Candidates
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    party_id = Column(String(36), ForeignKey("political_parties.id"), nullable=False)
    name = Column(String(200), nullable=False)
    running_mate = Column(String(200), nullable=True)
    photo_url = Column(String(500), nullable=True)

    party = relationship("PoliticalParty", back_populates="candidates")
    contest_candidates = relationship("ContestCandidate", back_populates="candidate")


# 9. Election Contests
class ElectionContest(Base):
    __tablename__ = "election_contests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False)
    title = Column(String(200), nullable=False)
    state_id = Column(String(36), ForeignKey("states.id"), nullable=True)

    election = relationship("Election", back_populates="contests")
    contest_candidates = relationship("ContestCandidate", back_populates="contest")


# 10. Contest Candidates
class ContestCandidate(Base):
    __tablename__ = "contest_candidates"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    contest_id = Column(String(36), ForeignKey("election_contests.id"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False)

    contest = relationship("ElectionContest", back_populates="contest_candidates")
    candidate = relationship("Candidate", back_populates="contest_candidates")


# 11. Result Sheets
class ResultSheet(Base):
    __tablename__ = "result_sheets"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    polling_unit_id = Column(String(36), ForeignKey("polling_units.id"), nullable=False, index=True)
    form_type = Column(String(50), default="EC8A", nullable=False)
    source_url = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256
    image_url = Column(String(500), nullable=True)
    current_version = Column(Integer, default=1, nullable=False)
    source_status = Column(String(50), default="ORIGINAL", nullable=False)
    upload_timestamp = Column(DateTime(timezone=True), nullable=True)
    retrieval_timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    polling_unit = relationship("PollingUnit", back_populates="result_sheets")
    versions = relationship("ResultSheetVersion", back_populates="result_sheet")
    results = relationship("PollingUnitResult", back_populates="result_sheet")
    ballot_statistics = relationship("BallotStatistics", back_populates="result_sheet")


# 12. Result Sheet Versions (Preserves history if collation changes form)
class ResultSheetVersion(Base):
    __tablename__ = "result_sheet_versions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    result_sheet_id = Column(String(36), ForeignKey("result_sheets.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False)
    source_url = Column(String(500), nullable=False)
    detected_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    change_summary = Column(Text, nullable=True)

    result_sheet = relationship("ResultSheet", back_populates="versions")


# 13. Polling Unit Results (Party Votes)
class PollingUnitResult(Base):
    __tablename__ = "polling_unit_results"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    result_sheet_id = Column(String(36), ForeignKey("result_sheets.id"), nullable=False, index=True)
    party_code = Column(String(20), nullable=False)
    source_reported_votes = Column(Integer, nullable=True)
    ocr_extracted_votes = Column(Integer, nullable=True)
    human_verified_votes = Column(Integer, nullable=True)
    official_declared_votes = Column(Integer, nullable=True)

    result_sheet = relationship("ResultSheet", back_populates="results")


# 14. Ballot Statistics
class BallotStatistics(Base):
    __tablename__ = "ballot_statistics"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    result_sheet_id = Column(String(36), ForeignKey("result_sheets.id"), nullable=False, index=True)
    registered_voters = Column(Integer, nullable=False, default=0)
    accredited_voters = Column(Integer, nullable=False, default=0)
    valid_votes = Column(Integer, nullable=False, default=0)
    rejected_votes = Column(Integer, nullable=False, default=0)
    total_votes_cast = Column(Integer, nullable=False, default=0)
    arithmetic_valid = Column(Boolean, nullable=False, default=True)

    result_sheet = relationship("ResultSheet", back_populates="ballot_statistics")


# 15. Result Snapshots
class ResultSnapshot(Base):
    __tablename__ = "result_snapshots"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False, index=True)
    snapshot_timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    total_pus_reported = Column(Integer, nullable=False)
    aggregate_figures = Column(Text, nullable=True)  # Serialized JSON snapshot


# 16. Verification Records
class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    result_sheet_id = Column(String(36), ForeignKey("result_sheets.id"), nullable=False, index=True)
    verifier_id = Column(String(36), nullable=False)
    verifier_name = Column(String(150), nullable=False)
    decision = Column(String(50), nullable=False)  # VERIFIED, DISCREPANCY_FLAGGED, RETURNED_FOR_REVIEW
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# 17. Discrepancies
class Discrepancy(Base):
    __tablename__ = "discrepancies"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False, index=True)
    polling_unit_code = Column(String(50), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # ARITHMETIC_MISMATCH, OCR_TRANSCRIPTION_VARIANCE, etc.
    severity = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    original_value = Column(Text, nullable=False)
    compared_value = Column(Text, nullable=False)
    status = Column(String(50), default="REQUIRES_REVIEW", nullable=False)
    review_notes = Column(Text, nullable=True)
    detected_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


# 18. Observers
class Observer(Base):
    __tablename__ = "observers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    badge = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    organization = Column(String(200), nullable=False)
    phone_masked = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    assignments = relationship("ObserverAssignment", back_populates="observer")
    reports = relationship("ObserverReport", back_populates="observer")


# 19. Observer Assignments
class ObserverAssignment(Base):
    __tablename__ = "observer_assignments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    observer_id = Column(String(36), ForeignKey("observers.id"), nullable=False, index=True)
    state_code = Column(String(50), nullable=False)
    lga_code = Column(String(50), nullable=True)
    assigned_pus = Column(Text, nullable=True)  # JSON-encoded array of PU codes
    status = Column(String(50), default="ACTIVE", nullable=False)
    assigned_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    observer = relationship("Observer", back_populates="assignments")


# 20. Observer Reports
class ObserverReport(Base):
    __tablename__ = "observer_reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    observer_id = Column(String(36), ForeignKey("observers.id"), nullable=False, index=True)
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False, index=True)
    polling_unit_code = Column(String(50), nullable=True, index=True)
    category = Column(String(100), nullable=False)
    status = Column(String(50), default="SUBMITTED", nullable=False)  # DRAFT, SUBMITTED, UNDER_REVIEW, VERIFIED, APPROVED_FOR_PUBLICATION
    content = Column(Text, nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    observer = relationship("Observer", back_populates="reports")
    reviews = relationship("ReportReview", back_populates="report")


# 21. Incidents
class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    election_id = Column(String(36), ForeignKey("elections.id"), nullable=False, index=True)
    polling_unit_code = Column(String(50), nullable=True, index=True)
    state_code = Column(String(50), nullable=False)
    lga_code = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False)
    description = Column(Text, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="SUBMITTED", nullable=False)
    reported_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    evidence_files = relationship("EvidenceFile", back_populates="incident")


# 22. Evidence Files
class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_hash = Column(String(64), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    incident = relationship("Incident", back_populates="evidence_files")


# 23. Report Reviews
class ReportReview(Base):
    __tablename__ = "report_reviews"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    report_id = Column(String(36), ForeignKey("observer_reports.id"), nullable=False, index=True)
    reviewer_id = Column(String(36), nullable=False)
    decision = Column(String(50), nullable=False)
    feedback = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    report = relationship("ObserverReport", back_populates="reviews")


# 24. Users
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user_roles = relationship("UserRole", back_populates="user")


# 25. Roles
class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(50), unique=True, nullable=False)  # SUPER_ADMIN, PROJECT_ADMIN, MONITORING_COORDINATOR, RESULT_VERIFIER, REGISTERED_OBSERVER, PUBLIC_USER
    description = Column(String(255), nullable=True)

    user_roles = relationship("UserRole", back_populates="role")


# 26. User Roles
class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False, index=True)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")


# 27. Audit Logs
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    actor = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    target = Column(String(150), nullable=True)
    details = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# 28. Ingestion Jobs
class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    adapter = Column(String(100), nullable=False)
    status = Column(String(50), default="RUNNING", nullable=False)
    records_retrieved = Column(Integer, default=0, nullable=False)
    records_processed = Column(Integer, default=0, nullable=False)
    records_rejected = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    errors = relationship("IngestionError", back_populates="job")


# 29. Ingestion Errors
class IngestionError(Base):
    __tablename__ = "ingestion_errors"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    job_id = Column(String(36), ForeignKey("ingestion_jobs.id"), nullable=False, index=True)
    error_type = Column(String(100), nullable=False)
    error_message = Column(Text, nullable=False)
    payload_sample = Column(Text, nullable=True)
    occurred_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    job = relationship("IngestionJob", back_populates="errors")


# 30. Data Sources
class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), unique=True, nullable=False)
    source_type = Column(String(50), nullable=False)  # OFFICIAL_INEC, DEVELOPMENT_FIXTURE, HISTORICAL_DATA, MANUAL_IMPORT
    base_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    last_connection_test = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
