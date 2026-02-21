import logging

log = logging.getLogger(__name__)


class PromptInjectionDetector:
    def __init__(self):
        self.whitelist = set(
            "abcdefghijklmnopqrstuvwxyz"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "0123456789"
            " \n"                 # space only
            ".,!?:;'\"()[]{}@#%&+=~`^|<>"  # common punctuation
            "$£€¥₩₹¢₽₺₿"                  # currency symbols
        )
        self.malicious_patterns = [
            ";", "--", "/*", "*/",
            "UNION", "SELECT", "INSERT", "DELETE", "DROP", "EXEC",
        ]

    def sanitize_input(self, input_data, expected_type=str, default_value=None):
        """
        Sanitize input by filtering disallowed characters and enforcing type checks.
        Returns the sanitized data, or default_value if sanitization fails.
        """
        try:
            if not isinstance(input_data, expected_type):
                raise ValueError(f"Input must be of type {expected_type}")

            if isinstance(input_data, str):
                return "".join(char for char in input_data if char in self.whitelist)
            elif isinstance(input_data, list):
                return [self.sanitize_input(item, str) for item in input_data]
            elif isinstance(input_data, dict):
                return {key: self.sanitize_input(value, str) for key, value in input_data.items()}
            else:
                return input_data
        except Exception as e:
            log.warning("Error sanitizing input: %s", e)
            return default_value

    def detect_threats(self, input_data) -> bool:
        """
        Check input for known malicious patterns.
        Returns True if a threat is detected.
        """
        if isinstance(input_data, str):
            for pattern in self.malicious_patterns:
                if pattern in input_data:
                    log.warning("Threat pattern detected: %r", pattern)
                    return True
        elif isinstance(input_data, list):
            return any(self.detect_threats(item) for item in input_data)
        elif isinstance(input_data, dict):
            return any(self.detect_threats(v) for v in input_data.values())
        return False
