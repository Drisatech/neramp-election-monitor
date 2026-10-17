# Data Dictionary - 30 Core PostgreSQL Tables

This data dictionary documents the normalized database schema designed for Nigeria Election Watch.

| Table Name | Primary Purpose | Key Fields |
| :--- | :--- | :--- |
| `election_types` | Defines category (Presidential, Governorship, etc.) | `id`, `code`, `name` |
| `elections` | Election contest events (e.g. 2027 General Elections) | `id`, `election_type_id`, `title`, `election_date`, `status`, `is_demonstration` |
| `states` | 36 Nigerian States + FCT | `id`, `code`, `name`, `zone`, `total_lgas`, `total_pus`, `registered_voters`, `lat`, `lng` |
| `lgas` | Local Government Areas | `id`, `state_id`, `code`, `name`, `total_wards`, `total_pus` |
| `wards` | Electoral Wards | `id`, `lga_id`, `code`, `name`, `total_pus` |
| `polling_units` | Polling Units preserving zero-padded codes | `id`, `code` (string), `name`, `ward_id`, `election_id`, `registered_voters`, `accredited_voters`, `upload_status`, `verification_status` |
| `political_parties` | Registered political parties | `id`, `code`, `name`, `color` |
| `candidates` | Political candidates & running mates | `id`, `party_id`, `name`, `running_mate`, `photo_url` |
| `election_contests` | Specific ballot contest definitions | `id`, `election_id`, `title`, `state_id` |
| `contest_candidates`| Contestants per election contest | `id`, `contest_id`, `candidate_id` |
| `result_sheets` | Scanned official Form EC8A records | `id`, `polling_unit_id`, `form_type`, `source_url`, `file_hash` (SHA-256), `image_url`, `upload_timestamp`, `retrieval_timestamp` |
| `result_sheet_versions`| Revision history of replaced documents | `id`, `result_sheet_id`, `version_number`, `file_hash`, `source_url`, `detected_at` |
| `polling_unit_results`| Multi-source candidate vote tallies | `id`, `result_sheet_id`, `party_code`, `source_reported_votes`, `ocr_extracted_votes`, `human_verified_votes`, `official_declared_votes` |
| `ballot_statistics` | Ballot accounting totals | `id`, `result_sheet_id`, `registered_voters`, `accredited_voters`, `valid_votes`, `rejected_votes`, `total_votes_cast`, `arithmetic_valid` |
| `result_snapshots` | Point-in-time aggregate records | `id`, `election_id`, `snapshot_timestamp`, `total_pus_reported`, `aggregate_figures` |
| `verification_records`| Verifier review sign-offs | `id`, `result_sheet_id`, `verifier_id`, `verifier_name`, `decision`, `notes`, `created_at` |
| `discrepancies` | Detected data inconsistencies | `id`, `election_id`, `polling_unit_code`, `category`, `severity`, `original_value`, `compared_value`, `status`, `review_notes` |
| `observers` | Accredited field monitors | `id`, `badge`, `full_name`, `organization`, `phone_masked`, `is_active` |
| `observer_assignments`| Geographic coverage allocations | `id`, `observer_id`, `state_code`, `lga_code`, `assigned_pus`, `status` |
| `observer_reports`| Qualitative field reports | `id`, `observer_id`, `election_id`, `polling_unit_code`, `category`, `status`, `content` |
| `incidents` | Polling unit disruptions or faults | `id`, `election_id`, `polling_unit_code`, `state_code`, `lga_code`, `category`, `severity`, `description`, `is_published`, `status` |
| `evidence_files` | Photos/videos supporting incidents | `id`, `incident_id`, `file_url`, `file_type`, `file_hash` |
| `report_reviews` | Coordinator feedback & verification | `id`, `report_id`, `reviewer_id`, `decision`, `feedback` |
| `users` | System accounts | `id`, `email`, `hashed_password`, `full_name`, `is_active` |
| `roles` | RBAC roles | `id`, `name`, `description` |
| `user_roles` | Role assignments | `id`, `user_id`, `role_id` |
| `audit_logs` | Immutable audit trail | `id`, `actor`, `action`, `target`, `details`, `ip_address`, `timestamp` |
| `ingestion_jobs` | Ingestion pipeline batches | `id`, `adapter`, `status`, `records_retrieved`, `records_processed`, `records_rejected`, `started_at`, `finished_at` |
| `ingestion_errors` | Pipeline failures and payloads | `id`, `job_id`, `error_type`, `error_message`, `payload_sample` |
| `data_sources` | Integration source metadata | `id`, `name`, `source_type`, `base_url`, `is_active`, `last_connection_test` |
