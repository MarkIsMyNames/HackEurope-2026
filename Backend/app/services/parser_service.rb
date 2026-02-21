class ParserService
  WHITELIST = /[^a-zA-Z0-9 \n.,!?:;'"()\[\]{}@#%&+=~`^|<>$£€¥₩₹¢₽₺₿]/

  MALICIOUS_PATTERNS = %w[; -- /* */ UNION SELECT INSERT DELETE DROP EXEC].freeze

  def initialize(text)
    @text = text
    @logger = Rails.logger
  end

  def sanitize
    result = @text.gsub(WHITELIST, "")
    @logger.info("[ParserService] Sanitized #{@text.length - result.length} character(s)")
    result
  end

  def threats_detected?
    MALICIOUS_PATTERNS.any? do |pattern|
      if @text.include?(pattern)
        @logger.warn("[ParserService] Threat pattern detected: #{pattern.inspect}")
        true
      end
    end
  end

  def validation
    has_threats   = threats_detected?
    has_encoding  = encoded?
    over_length   = @text.length > 2000

    {
      characterFiltering: has_threats ? "fail" : "pass",
      regexCheck:         has_threats ? "fail" : "pass",
      lengthCheck:        over_length ? "fail" : "pass",
      encodingCheck:      has_encoding ? "fail" : "pass"
    }
  end

  def heuristics
    words        = @text.split
    unique_ratio = words.empty? ? 0 : (words.uniq.length.to_f / words.length * 100).round
    char_variety = (@text.chars.uniq.length.to_f / [(@text.length), 1].max * 100).round

    {
      length:          [(@text.length.to_f / 20).round, 100].min,
      complexity:      [[100 - unique_ratio, 0].max, 100].min,
      contextualShift: [MALICIOUS_PATTERNS.count { |p| @text.include?(p) } * 20, 100].min,
      entropy:         [char_variety, 100].min,
      repetition:      [[100 - unique_ratio, 0].max, 100].min
    }
  end

  private

  def encoded?
    base64_pattern = %r{[A-Za-z0-9+/]{20,}={0,2}}
    hex_pattern    = /\b[0-9a-fA-F]{10,}\b/
    @text.match?(base64_pattern) || @text.match?(hex_pattern)
  end
end
