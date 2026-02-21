import logging

# Set up logging
logging.basicConfig(filename='threat_log.txt', level=logging.WARNING)

class PromptInjectionDetector:
    def __init__(self):
        # Define a whitelist of allowed characters
        self.whitelist = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ")
        # Define a list of malicious patterns to detect
        self.malicious_patterns = [";", "--", "/*", "*/", "UNION", "SELECT", "INSERT", "DELETE", "DROP", "EXEC"]

    def sanitize_input(self, input_data, expected_type=str, default_value=None):
        """
        Sanitize the input data by filtering out disallowed characters and enforcing type checks.

        Args:
            input_data: The input data to sanitize.
            expected_type: The expected type of the input data (default is str).
            default_value: The default value to return if sanitization fails.

        Returns:
            The sanitized data or the default value if sanitization fails.
        """
        try:
            # Check if the input is of the expected type
            if not isinstance(input_data, expected_type):
                raise ValueError(f"Input must be of type {expected_type}")

            # Apply character filtering if the input is a string
            if expected_type == str:
                sanitized_data = ''.join(char for char in input_data if char in self.whitelist)
                return sanitized_data
            # Handle lists by sanitizing each element
            elif expected_type == list:
                sanitized_list = [self.sanitize_input(item, str) for item in input_data]
                return sanitized_list
            # Handle dictionaries by sanitizing each value
            elif expected_type == dict:
                sanitized_dict = {key: self.sanitize_input(value, str) for key, value in input_data.items()}
                return sanitized_dict
            else:
                return input_data
        except Exception as e:
            # Log any errors that occur during sanitization
            logging.warning(f"Error sanitizing input: {e}")
            return default_value

    def detect_threats(self, input_data):
        """
        Detect potential threats in the input data by checking for malicious patterns.

        Args:
            input_data: The input data to check for threats.

        Returns:
            True if a threat is detected, False otherwise.
        """
        if isinstance(input_data, str):
            for pattern in self.malicious_patterns:
                if pattern in input_data:
                    logging.warning(f"Potential threat detected: {pattern}")
                    return True
        elif isinstance(input_data, list):
            for item in input_data:
                if self.detect_threats(item):
                    return True
        elif isinstance(input_data, dict):
            for value in input_data.values():
                if self.detect_threats(value):
                    return True
        return False

# Example usage
if __name__ == "__main__":
    detector = PromptInjectionDetector()

    # Example with a string
    input_string = "Hello, World! 123"
    sanitized_string = detector.sanitize_input(input_string, str)
    print(f"Sanitized string: {sanitized_string}")
    print(f"Threat detected: {detector.detect_threats(input_string)}")

    # Example with a list
    input_list = ["Hello, World! 123", "Another string; DROP TABLE users"]
    sanitized_list = detector.sanitize_input(input_list, list)
    print(f"Sanitized list: {sanitized_list}")
    print(f"Threat detected: {detector.detect_threats(input_list)}")

    # Example with a dictionary (JSON-like data)
    input_json = {"key1": "value1", "key2": "value2; SELECT * FROM users"}
    sanitized_json = detector.sanitize_input(input_json, dict)
    print(f"Sanitized JSON: {sanitized_json}")
    print(f"Threat detected: {detector.detect_threats(input_json)}")
