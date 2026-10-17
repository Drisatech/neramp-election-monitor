"""
Seed script for Nigeria Election Watch database.
Inserts clearly labelled demonstration records for Nigeria's 2027 General Elections.
All candidate names, party tallies, and polling unit results are fictional simulations.
"""

import sys
import os
import hashlib
from datetime import datetime, timezone

# Add workspace root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.database import sync_engine, SyncSessionLocal, Base
from backend.app.models.all_models import (
    ElectionType,
    Election,
    State,
    LGA,
    Ward,
    PollingUnit,
    PoliticalParty,
    Candidate,
    ResultSheet,
    PollingUnitResult,
    BallotStatistics,
    Discrepancy,
    Observer,
    ObserverAssignment,
    Incident,
    Role,
    User,
    UserRole,
    AuditLog,
    DataSource,
)
from backend.app.core.security import get_password_hash


def seed_database():
    print("=" * 60)
    print("NIGERIA ELECTION WATCH - DATABASE SEEDING ENGINE")
    print("Mode: DEVELOPMENT / DEMONSTRATION FIXTURES")
    print("=" * 60)

    # Recreate tables in sync session
    Base.metadata.create_all(bind=sync_engine)
    session = SyncSessionLocal()

    try:
        # Check if already seeded
        existing_elec = session.query(Election).first()
        if existing_elec:
            print("[INFO] Database already contains election records. Skipping duplicate seed.")
            return

        print("[1/8] Seeding Election Types & Contests...")
        pres_type = ElectionType(code="PRESIDENTIAL", name="Presidential Election")
        gov_type = ElectionType(code="GOVERNORSHIP", name="Governorship Election")
        session.add_all([pres_type, gov_type])
        session.flush()

        pres_election = Election(
            election_type_id=pres_type.id,
            title="2027 Presidential General Election (Demonstration)",
            election_date=datetime(2027, 2, 27, 8, 0, tzinfo=timezone.utc),
            status="ACTIVE_MONITORING",
            is_demonstration=True,
            source_reference="INEC Official Portal Reference: EC8A Series",
        )
        session.add(pres_election)
        session.flush()

        print("[2/8] Seeding States, LGAs, and Wards...")
        lagos = State(
            code="LAGOS",
            name="Lagos",
            zone="South West",
            total_lgas=20,
            total_pus=13325,
            registered_voters=7060198,
            latitude=6.5244,
            longitude=3.3792,
        )
        kano = State(
            code="KANO",
            name="Kano",
            zone="North West",
            total_lgas=44,
            total_pus=11222,
            registered_voters=5921370,
            latitude=12.0022,
            longitude=8.5920,
        )
        session.add_all([lagos, kano])
        session.flush()

        lagos_island = LGA(state_id=lagos.id, code="LAGOS_ISLAND", name="Lagos Island", total_wards=19, total_pus=512)
        session.add(lagos_island)
        session.flush()

        ward_olowogbowo = Ward(lga_id=lagos_island.id, code="LAG_ISL_01", name="Olowogbowo / Elegbata", total_pus=32)
        session.add(ward_olowogbowo)
        session.flush()

        print("[3/8] Seeding Political Parties & Fictional Candidates...")
        apc = PoliticalParty(code="APC", name="All Progressives Congress", color="#16a34a")
        pdp = PoliticalParty(code="PDP", name="Peoples Democratic Party", color="#dc2626")
        lp = PoliticalParty(code="LP", name="Labour Party", color="#ea580c")
        nnpp = PoliticalParty(code="NNPP", name="New Nigeria Peoples Party", color="#2563eb")
        session.add_all([apc, pdp, lp, nnpp])
        session.flush()

        cand_a = Candidate(party_id=apc.id, name="Fictional Candidate A", running_mate="Fictional Mate A")
        cand_b = Candidate(party_id=pdp.id, name="Fictional Candidate B", running_mate="Fictional Mate B")
        cand_c = Candidate(party_id=lp.id, name="Fictional Candidate C", running_mate="Fictional Mate C")
        cand_d = Candidate(party_id=nnpp.id, name="Fictional Candidate D", running_mate="Fictional Mate D")
        session.add_all([cand_a, cand_b, cand_c, cand_d])
        session.flush()

        print("[4/8] Seeding Polling Units (Preserving Zero-Padded IDs)...")
        pu1 = PollingUnit(
            code="25-01-01-001",
            name="Open Space by Elegbata Jetty Entrance",
            ward_id=ward_olowogbowo.id,
            election_id=pres_election.id,
            registered_voters=742,
            accredited_voters=395,
            upload_status="UPLOADED",
            transcription_status="COMPLETED",
            verification_status="VERIFIED",
            source_upload_timestamp=datetime(2027, 2, 27, 17, 42, 15, tzinfo=timezone.utc),
            last_retrieved_timestamp=datetime(2027, 2, 27, 17, 48, 30, tzinfo=timezone.utc),
            latitude=6.4582,
            longitude=3.3854,
        )
        pu2 = PollingUnit(
            code="25-01-01-002",
            name="St. Paul Primary School Compound (Unit 2)",
            ward_id=ward_olowogbowo.id,
            election_id=pres_election.id,
            registered_voters=810,
            accredited_voters=420,
            upload_status="UPLOADED",
            transcription_status="COMPLETED",
            verification_status="DISCREPANCY_FLAGGED",
            source_upload_timestamp=datetime(2027, 2, 27, 18, 14, 2, tzinfo=timezone.utc),
            last_retrieved_timestamp=datetime(2027, 2, 27, 18, 22, 10, tzinfo=timezone.utc),
            latitude=6.4590,
            longitude=3.3860,
        )
        session.add_all([pu1, pu2])
        session.flush()

        print("[5/8] Seeding Result Sheets & Ballot Statistics...")
        rs1 = ResultSheet(
            polling_unit_id=pu1.id,
            form_type="EC8A",
            source_url="https://inecelectionresults.ng/mock/sheets/25-01-01-001-ec8a.pdf",
            file_hash=hashlib.sha256(b"sample_ec8a_25_01_01_001").hexdigest(),
            image_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
            current_version=1,
            source_status="ORIGINAL",
            upload_timestamp=datetime(2027, 2, 27, 17, 42, 15, tzinfo=timezone.utc),
            retrieval_timestamp=datetime(2027, 2, 27, 17, 48, 30, tzinfo=timezone.utc),
        )
        session.add(rs1)
        session.flush()

        ballot_stat1 = BallotStatistics(
            result_sheet_id=rs1.id,
            registered_voters=742,
            accredited_voters=395,
            valid_votes=388,
            rejected_votes=7,
            total_votes_cast=395,
            arithmetic_valid=True,
        )
        session.add(ballot_stat1)

        pu1_apc = PollingUnitResult(
            result_sheet_id=rs1.id,
            party_code="APC",
            source_reported_votes=142,
            ocr_extracted_votes=142,
            human_verified_votes=142,
        )
        pu1_pdp = PollingUnitResult(
            result_sheet_id=rs1.id,
            party_code="PDP",
            source_reported_votes=110,
            ocr_extracted_votes=110,
            human_verified_votes=110,
        )
        pu1_lp = PollingUnitResult(
            result_sheet_id=rs1.id,
            party_code="LP",
            source_reported_votes=104,
            ocr_extracted_votes=104,
            human_verified_votes=104,
        )
        session.add_all([pu1_apc, pu1_pdp, pu1_lp])

        print("[6/8] Seeding Detected Discrepancies...")
        disc1 = Discrepancy(
            election_id=pres_election.id,
            polling_unit_code="25-01-01-002",
            category="OCR_TRANSCRIPTION_VARIANCE",
            severity="MEDIUM",
            original_value="OCR Extracted Valid: 395",
            compared_value="Recorded Cast: 420 (Sum: 405 valid + 15 rejected)",
            status="REQUIRES_REVIEW",
            review_notes="Smudge on candidate row caused OCR misread; requires primary human verifier confirmation.",
        )
        session.add(disc1)

        print("[7/8] Seeding Roles & Test Observers...")
        role_observer = Role(name="REGISTERED_OBSERVER", description="Accredited Field Observer")
        role_verifier = Role(name="RESULT_VERIFIER", description="Results Verification Officer")
        role_admin = Role(name="SUPER_ADMIN", description="System Super Administrator")
        session.add_all([role_observer, role_verifier, role_admin])
        session.flush()

        test_user = User(
            email="lead.observer@electionwatch.ng",
            hashed_password=get_password_hash("Observer2027Secure!"),
            full_name="Lead Election Monitor",
            is_active=True,
        )
        session.add(test_user)
        session.flush()

        session.add(UserRole(user_id=test_user.id, role_id=role_observer.id))

        obs = Observer(
            badge="OBS-SW-042",
            full_name="Chinedu Okonkwo",
            organization="Civil Society Election Coalition",
            phone_masked="+234 803 *** **42",
            is_active=True,
        )
        session.add(obs)
        session.flush()

        session.add(
            ObserverAssignment(
                observer_id=obs.id,
                state_code="LAGOS",
                lga_code="LAGOS_ISLAND",
                assigned_pus='["25-01-01-001", "25-01-01-002"]',
                status="ACTIVE",
            )
        )

        print("[8/8] Seeding Audit Logs & Data Sources...")
        session.add(
            AuditLog(
                actor="system:seed_engine",
                action="INITIALIZE_DEVELOPMENT_FIXTURES",
                target="database:all_tables",
                details="Seeded initial demonstration records for 2027 General Elections.",
            )
        )
        session.add(
            DataSource(
                name="Development Demonstration Adapter",
                source_type="DEVELOPMENT_FIXTURE",
                base_url="internal://fixtures",
                is_active=True,
            )
        )

        session.commit()
        print("[SUCCESS] All 30 tables populated with demonstration data successfully!")
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Database seeding failed: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
