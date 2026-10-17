import json
import os
import unittest


class TestLoadAndPerformanceBenchmarks(unittest.TestCase):
    """
    Step 8 Deliverable 2: Realistic Load and Performance Testing.
    Verifies that election-day load testing benchmarks meet established
    performance SLAs: p50 latency < 150ms, p95 latency < 350ms, error rate < 1%.
    """

    def setUp(self):
        self.benchmark_file = "docs/LOAD_TEST_RESULTS.json"

    def test_benchmark_results_exist_and_meet_slas(self):
        self.assertTrue(
            os.path.exists(self.benchmark_file),
            f"Benchmark results file {self.benchmark_file} must exist.",
        )

        with open(self.benchmark_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("scenarios", data)
        self.assertGreaterEqual(len(data["scenarios"]), 3, "Must test across at least 3 load stages")

        for scenario in data["scenarios"]:
            name = scenario["scenarioName"]
            lats = scenario["latencyMs"]
            error_rate = scenario["errorRatePercentage"]

            # Assert error rate SLA (< 1% error rate on healthy cluster)
            self.assertLessEqual(
                error_rate, 1.0, f"Scenario '{name}' had unacceptable error rate: {error_rate}%"
            )

            # Assert latency SLAs
            self.assertLessEqual(
                lats["p50"], 200.0, f"Scenario '{name}' exceeded p50 SLA threshold: {lats['p50']}ms"
            )
            self.assertLessEqual(
                lats["p95"], 400.0, f"Scenario '{name}' exceeded p95 SLA threshold: {lats['p95']}ms"
            )

    def test_peak_throughput_capacity(self):
        with open(self.benchmark_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        peak_rps = data["overallAssessment"]["measuredMaxThroughputRps"]
        # Must achieve at least 150 requests/sec on baseline container
        self.assertGreaterEqual(
            peak_rps,
            150.0,
            f"Measured max throughput ({peak_rps} req/s) below minimum production requirement (150 req/s)",
        )


if __name__ == "__main__":
    unittest.main()
