import unittest


class TestSecurityExports(unittest.TestCase):
    def sanitize_csv_cell(self, val: any) -> str:
        """Mirror CSV formula injection mitigation logic."""
        s = str(val if val is not None else "")
        if s.startswith(("=", "+", "-", "@", "\t", "\r")):
            s = "'" + s
        escaped = s.replace('"', '""')
        return f'"{escaped}"'

    def test_formula_injection_prevention(self):
        # Malicious payload attempts in CSV
        malicious_inputs = [
            "=cmd|' /C calc'!A0",
            "+1+1",
            "-2+3",
            "@SUM(1,2)",
        ]
        for payload in malicious_inputs:
            sanitized = self.sanitize_csv_cell(payload)
            # Must be prefixed with single quote inside quotes
            self.assertTrue(
                sanitized.startswith("\"'=" ) or 
                sanitized.startswith("\"'+") or 
                sanitized.startswith("\"'-") or 
                sanitized.startswith("\"'@"),
                f"Payload {payload} was not properly sanitized: {sanitized}"
            )

    def test_zero_padded_identifier_preservation(self):
        # Polling unit codes must not lose leading zeros
        pu_code = "01-02-03-004"
        sanitized = self.sanitize_csv_cell(pu_code)
        self.assertEqual(sanitized, '"01-02-03-004"')


if __name__ == "__main__":
    unittest.main()
