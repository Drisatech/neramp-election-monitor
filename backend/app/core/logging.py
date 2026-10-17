import json
import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any, Dict

SENSITIVE_KEY_PATTERNS = re.compile(
    r"(password|secret|token|api_key|authorization|bearer|cookie|credential|phone|email)",
    re.IGNORECASE,
)


class RedactingJsonFormatter(logging.Formatter):
    """
    Structured JSON log formatter that automatically sanitizes sensitive fields
    and redacts secrets, credentials, and sensitive personal information.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": self._redact(record.getMessage()),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
        }

        if hasattr(record, "extra") and isinstance(record.extra, dict):
            for k, v in record.extra.items():
                log_entry[k] = self._sanitize_value(k, v)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)

    def _redact(self, message: str) -> str:
        # Mask authorization bearer tokens
        message = re.sub(
            r"Bearer\s+([A-Za-z0-9\-_.]+)",
            r"Bearer [REDACTED_TOKEN]",
            message,
            flags=re.IGNORECASE,
        )
        # Mask password query strings or json fields
        message = re.sub(
            r'("(?:password|secret|token|api_key)"\s*:\s*)"[^"]+"',
            r'\1"[REDACTED]"',
            message,
            flags=re.IGNORECASE,
        )
        return message

    def _sanitize_value(self, key: str, value: Any) -> Any:
        if SENSITIVE_KEY_PATTERNS.search(key):
            return "[REDACTED]"
        if isinstance(value, dict):
            return {k: self._sanitize_value(k, v) for k, v in value.items()}
        if isinstance(value, list):
            return [self._sanitize_value(key, v) for v in value]
        return value


def get_logger(name: str = "nigeria_election_watch") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(RedactingJsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = get_logger("election_watch")
