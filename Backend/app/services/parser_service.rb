class ParserService
  def initialize(text)
    @text   = text
    @logger = Rails.logger

    cfg        = load_parser_config
    @whitelist = Regexp.new("[^#{cfg[:whitelist]}]")
    @patterns  = Array(cfg[:blacklist_patterns]).map(&:to_s).reject(&:empty?)
  end

  def sanitize
    result = @text.gsub(@whitelist, "")
    @logger.info("[ParserService] Sanitized #{@text.length - result.length} character(s)")
    result
  end

  def threats_detected?
    @patterns.any? do |pattern|
      if @text.include?(pattern)
        @logger.warn("[ParserService] Threat pattern detected: #{pattern.inspect}")
        true
      end
    end
  end

  def validation
    {
      characterFiltering: threats_detected? ? "fail" : "pass",
      encodingCheck:      encoded? ? "fail" : "pass"
    }
  end

  def heuristics
    words        = @text.split
    unique_ratio = words.empty? ? 0 : (words.uniq.length.to_f / words.length * 100).round
    char_variety = (@text.chars.uniq.length.to_f / [@text.length, 1].max * 100).round

    {
      length:          [(@text.length.to_f / 20).round, 100].min,
      complexity:      [[100 - unique_ratio, 0].max, 100].min,
      contextualShift: [@patterns.count { |p| @text.include?(p) } * 20, 100].min,
      entropy:         [char_variety, 100].min,
      repetition:      [[100 - unique_ratio, 0].max, 100].min
    }
  end

  private

  def load_parser_config
    path = Rails.root.join(AppConfig[:parser_config_file])
    JSON.parse(path.read, symbolize_names: true)
  end

  def encoded?
    base64_pattern = %r{[A-Za-z0-9+/]{20,}={0,2}}
    hex_pattern    = /\b[0-9a-fA-F]{10,}\b/
    @text.match?(base64_pattern) || @text.match?(hex_pattern)
  end
end
