#!/usr/bin/env python3
"""
Manual Ingestion CLI Tool for Authorized Administrators.
Allows authorized operators to trigger targeted ingestion runs, inspect rate limits,
test connectivity, and syndicate polling unit result sheets into Nigeria Election Watch.
"""

import argparse
import asyncio
import sys
import os
import json
from datetime import datetime, timezone

# Add workspace root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.integrations.adapters import (
    InecApprovedSourceAdapter,
    DevelopmentFixtureAdapter,
    HistoricalDataAdapter,
    ManualImportAdapter,
)
from backend.app.ingestion.scheduler import IngestionPipelineService


def parse_args():
    parser = argparse.ArgumentParser(
        description="Nigeria Election Watch - Manual Ingestion Command for Authorized Administrators",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--adapter",
        choices=["inec_approved", "dev_fixture", "historical", "manual_import"],
        default="inec_approved",
        help="Select election results data adapter",
    )
    parser.add_argument(
        "--election-id",
        type=str,
        default=InecApprovedSourceAdapter.ELECTION_ID_OSUN_2026,
        help="Election Identifier (e.g. elec-2026-gov-osun)",
    )
    parser.add_argument(
        "--state",
        type=str,
        default="OSUN",
        help="Target State code filter (e.g. OSUN, LAGOS)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximum polling unit records to retrieve per cycle",
    )
    parser.add_argument(
        "--actor",
        type=str,
        default="admin:cli_operator",
        help="Authenticated administrator identity for immutable audit log",
    )
    parser.add_argument(
        "--synthetic",
        action="store_true",
        help="Use documented synthetic responses for evaluation without live portal credentials",
    )
    parser.add_argument(
        "--test-health-only",
        action="store_true",
        help="Perform adapter connection test without writing records",
    )
    return parser.parse_args()


async def main():
    args = parse_args()

    print("=" * 65)
    print("NIGERIA ELECTION WATCH | ADMINISTRATIVE INGESTION ENGINE")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()} UTC")
    print(f"Authorized Operator: {args.actor}")
    print("=" * 65)

    # Initialize requested adapter
    if args.adapter == "inec_approved":
        adapter = InecApprovedSourceAdapter(synthetic_mode=args.synthetic)
    elif args.adapter == "dev_fixture":
        adapter = DevelopmentFixtureAdapter()
    elif args.adapter == "historical":
        adapter = HistoricalDataAdapter()
    else:
        adapter = ManualImportAdapter()

    print(f"Selected Adapter: {adapter.get_adapter_name()}")
    print(f"Official Live Connection: {adapter.is_live_official_source()}")

    # 1. Connection Health Check
    print("\n[Step 1/2] Verifying Source Connection Health...")
    health = await adapter.test_connection()
    print(f"Health Status: {health.get('status')}")
    print(f"Diagnostic Message: {health.get('message')}")
    if "rate_limit" in health:
        print(f"Access Rate Limit: {health['rate_limit']}")

    if args.test_health_only:
        print("\nHealth check completed. Exiting as requested by --test-health-only.")
        sys.exit(0 if health.get("status") in ("CONNECTED", "connected") else 1)

    # 2. Pipeline Execution
    print(f"\n[Step 2/2] Initiating Ingestion Pipeline for '{args.election_id}'...")
    service = IngestionPipelineService(adapter=adapter)

    try:
        outcome = await service.execute_ingestion(
            election_id=args.election_id,
            state_code=args.state,
            limit=args.limit,
            actor=args.actor,
        )

        print("\n--- INGESTION OUTCOME SUMMARY ---")
        print(f"Job ID:                   {outcome['id']}")
        print(f"Status:                   {outcome['status']}")
        print(f"Source Attribution:       {outcome['source_attribution']}")
        print(f"Records Retrieved:        {outcome['records_retrieved']}")
        print(f"Records Processed:        {outcome['records_processed']}")
        print(f"Duplicates Skipped:       {outcome['records_skipped_duplicate']} (Idempotent)")
        print(f"Revised Records Detected: {outcome['records_revised']}")
        print(f"Discrepancies Flagged:    {outcome['discrepancies_detected']}")
        print(f"Completion Timestamp:     {outcome['finished_at']}")
        print("---------------------------------")
        print("All records successfully indexed with cryptographic provenance.")
    except Exception as exc:
        print(f"\n[ERROR] Ingestion job aborted: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
