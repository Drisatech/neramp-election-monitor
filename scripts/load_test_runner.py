import concurrent.futures
import json
import math
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Tuple

BASE_URL = os.getenv("TARGET_URL", "http://localhost:3000")

ENDPOINTS = [
    "/api/v1/health",
    "/api/v1/elections",
    "/api/v1/elections/elec-2027-pres/summary",
    "/api/v1/elections/elec-2027-pres/upload-progress",
    "/api/v1/elections/elec-2027-pres/discrepancies",
    "/api/v1/geography/states",
    "/api/v1/admin/ingestion/status",
    "/api/v1/admin/command-center/metrics",
]


def make_request(path: str) -> Tuple[bool, float, int]:
    """Makes a single HTTP request and measures latency in milliseconds."""
    url = f"{BASE_URL}{path}"
    start = time.perf_counter()
    status_code = 0
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "NERAMP-LoadTestingEngine/1.0",
                "Accept": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            status_code = resp.status
            _ = resp.read()
            duration_ms = (time.perf_counter() - start) * 1000.0
            return (200 <= status_code < 400), duration_ms, status_code
    except urllib.error.HTTPError as e:
        duration_ms = (time.perf_counter() - start) * 1000.0
        return False, duration_ms, e.code
    except Exception:
        duration_ms = (time.perf_counter() - start) * 1000.0
        return False, duration_ms, 0


def calculate_percentiles(latencies: List[float]) -> Dict[str, float]:
    """Calculates min, mean, p50, p95, p99, and max from a list of latencies."""
    if not latencies:
        return {"min": 0, "mean": 0, "p50": 0, "p95": 0, "p99": 0, "max": 0}

    sorted_lats = sorted(latencies)
    n = len(sorted_lats)

    def p(k: float) -> float:
        idx = min(math.ceil(n * k) - 1, n - 1)
        return sorted_lats[max(0, idx)]

    return {
        "min": round(sorted_lats[0], 2),
        "mean": round(sum(sorted_lats) / n, 2),
        "p50": round(p(0.50), 2),
        "p95": round(p(0.95), 2),
        "p99": round(p(0.99), 2),
        "max": round(sorted_lats[-1], 2),
    }


def execute_load_scenario(
    name: str,
    concurrency: int,
    total_requests: int,
) -> Dict[str, Any]:
    """Executes a progressive load simulation stage with worker threads."""
    print(f"\n[LOAD RUNNER] Starting Scenario: '{name}' | Concurrency: {concurrency} | Total Reqs: {total_requests}")
    start_total = time.perf_counter()

    latencies: List[float] = []
    successes = 0
    failures = 0
    status_codes: Dict[int, int] = {}

    tasks = [ENDPOINTS[i % len(ENDPOINTS)] for i in range(total_requests)]

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        results = executor.map(make_request, tasks)
        for is_ok, lat, code in results:
            latencies.append(lat)
            status_codes[code] = status_codes.get(code, 0) + 1
            if is_ok:
                successes += 1
            else:
                failures += 1

    total_time_seconds = time.perf_counter() - start_total
    rps = round(total_requests / total_time_seconds, 2) if total_time_seconds > 0 else 0
    percentiles = calculate_percentiles(latencies)
    error_rate_pct = round((failures / total_requests) * 100.0, 2) if total_requests > 0 else 0

    scenario_result = {
        "scenarioName": name,
        "concurrency": concurrency,
        "totalRequests": total_requests,
        "totalTimeSeconds": round(total_time_seconds, 2),
        "requestsPerSecond": rps,
        "successCount": successes,
        "failureCount": failures,
        "errorRatePercentage": error_rate_pct,
        "latencyMs": percentiles,
        "statusCodes": status_codes,
    }

    print(
        f"[LOAD RUNNER] Complete: {total_requests} reqs in {total_time_seconds:.2f}s | "
        f"RPS: {rps} | p50: {percentiles['p50']}ms | p95: {percentiles['p95']}ms | "
        f"p99: {percentiles['p99']}ms | Errors: {error_rate_pct}%"
    )

    return scenario_result


def run_full_benchmark(output_json_path: str = "docs/LOAD_TEST_RESULTS.json"):
    """
    Executes Progressive Load Testing across 3 tiers:
    1. Normal Election-Day Monitoring (50 Concurrent Users)
    2. Elevated Results Reporting Surge (200 Concurrent Users)
    3. Peak Collation Climax Surge (500 Concurrent Reqs)
    """
    print("==================================================================")
    print("NERAMP - ELECTION-DAY LOAD & PERFORMANCE BENCHMARKING ENGINE")
    print(f"Target Gateway: {BASE_URL}")
    print("==================================================================")

    # Health check gateway first
    ok, lat, code = make_request("/api/v1/health")
    if not ok:
        print(f"ERROR: Target gateway unreachable at {BASE_URL}/api/v1/health (Code: {code}).")
        return None

    scenarios = [
        ("Normal Election Day Traffic", 20, 200),
        ("Elevated Collation Peak", 50, 500),
        ("Peak Surge Climax", 100, 1000),
    ]

    all_results = []
    for s_name, conc, reqs in scenarios:
        res = execute_load_scenario(s_name, conc, reqs)
        all_results.append(res)
        time.sleep(1.0)  # Cool down between stages

    benchmark_summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "targetUrl": BASE_URL,
        "scenarios": all_results,
        "overallAssessment": {
            "p50Acceptable": all_results[-1]["latencyMs"]["p50"] < 100.0,
            "p95Acceptable": all_results[-1]["latencyMs"]["p95"] < 350.0,
            "zeroCriticalErrors": all_results[-1]["errorRatePercentage"] == 0.0,
            "measuredMaxThroughputRps": max(s["requestsPerSecond"] for s in all_results),
        },
    }

    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_summary, f, indent=2)

    print(f"\n[OK] Benchmark results written to {output_json_path}")
    return benchmark_summary


if __name__ == "__main__":
    run_full_benchmark()
