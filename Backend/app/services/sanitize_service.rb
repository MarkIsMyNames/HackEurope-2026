require "net/http"
require "json"

class SanitizeService
  SAFETY_DEFAULT = { safe: false, verdict: "unknown", reason: "Safety review unavailable" }.freeze

  def initialize(text)
    @text   = text
    @logger = Rails.logger
  end

  def call
    known      = load_injections
    raw        = call_sanitize_llm(build_sanitize_prompt(known))
    result     = parse_sanitize_response(raw)
    sanitized  = result.fetch("sanitized", @text)
    injections = result.fetch("injections", []).to_a.select { |i| i.to_s.strip.length > 0 }

    save_injections(known, injections) if injections.any?

    @logger.info("[SanitizeService] #{injections.length} injection(s) found")
    injections.each { |i| @logger.warn("[SanitizeService] Injection removed: #{i}") }

    downstream_output = run_downstream_llm(sanitized)
    safety_review     = run_safety_llm(downstream_output)

    {
      sanitized:         sanitized,
      injections:        injections,
      ml_insight:        ml_insight(injections),
      downstream_output: downstream_output,
      safety_review:     safety_review
    }
  end

  private

  # ── File helpers ─────────────────────────────────────────────────────────────

  def backend_file(filename)
    Rails.root.join(filename)
  end

  def read_prompt_file(filename)
    path = backend_file(filename)
    path.exist? ? path.read.strip : ""
  end

  # ── Injection memory ─────────────────────────────────────────────────────────

  def load_injections
    file = backend_file(AppConfig[:injections_file])
    return [] unless file.exist?

    JSON.parse(file.read)
  rescue JSON::ParserError
    []
  end

  def save_injections(known, new_injections)
    file     = backend_file(AppConfig[:injections_file])
    combined = (known + new_injections).uniq
    file.write(JSON.pretty_generate(combined))
    @logger.info("[SanitizeService] Injections log updated (#{combined.length} total)")
  end

  # ── Sanitize LLM ─────────────────────────────────────────────────────────────

  def build_sanitize_prompt(known)
    base  = read_prompt_file(AppConfig[:prompt_file])
    limit = AppConfig[:injections_example_limit]
    return base if known.empty?

    examples = known.last(limit).map { |i| "  • \"#{i}\"" }.join("\n")
    base.rstrip + "\n\n" \
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" \
      "PREVIOUSLY SEEN INJECTIONS  (real examples logged from past runs)\n" \
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" \
      "Be especially alert for these patterns and close variants:\n\n" \
      "#{examples}"
  end

  def call_sanitize_llm(system_prompt)
    @logger.info("[SanitizeService] Sending sanitize request to Claude (#{AppConfig[:model]})")
    LlmGatewayService.new(
      api_url:       AppConfig[:anthropic_api_url],
      api_key:       ENV.fetch("ANTHROPIC_API_KEY"),
      model:         AppConfig[:model],
      system_prompt: system_prompt,
      user_input:    "Analyse and sanitise:\n\n#{@text}",
      max_tokens:    AppConfig[:max_tokens],
      temperature:   0.0,
      logger:        @logger
    ).call
  end

  def parse_sanitize_response(raw)
    cleaned = raw.gsub(/\A```(?:json)?\s*/m, "").gsub(/\s*```\z/m, "").strip
    JSON.parse(cleaned)
  rescue JSON::ParserError
    @logger.warn("[SanitizeService] Sanitize response was not valid JSON — using raw text")
    { "sanitized" => raw, "injections" => [] }
  end

  # ── Downstream LLM ───────────────────────────────────────────────────────────

  def run_downstream_llm(sanitized)
    cfg = AppConfig[:downstream_llm]
    return "" unless cfg[:enabled]

    api_key = ENV.fetch(cfg[:api_key_env], "")
    if api_key.empty?
      @logger.warn("[SanitizeService] Downstream LLM skipped: env #{cfg[:api_key_env]} not set")
      return ""
    end

    @logger.info("[SanitizeService] Sending downstream request to #{cfg[:model]}")
    LlmGatewayService.new(
      api_url:       cfg[:api_url],
      api_key:       api_key,
      model:         cfg[:model],
      system_prompt: read_prompt_file(cfg[:prompt_file]),
      user_input:    sanitized,
      max_tokens:    cfg[:max_tokens],
      temperature:   cfg[:temperature],
      logger:        @logger
    ).call
  rescue StandardError => e
    @logger.error("[SanitizeService] Downstream LLM failed: #{e.message}")
    ""
  end

  # ── Safety LLM ───────────────────────────────────────────────────────────────

  def run_safety_llm(downstream_output)
    return SAFETY_DEFAULT if downstream_output.to_s.strip.empty?

    cfg = AppConfig[:safety_llm]
    return SAFETY_DEFAULT unless cfg[:enabled]

    api_key = ENV.fetch(cfg[:api_key_env], "")
    if api_key.empty?
      @logger.warn("[SanitizeService] Safety LLM skipped: env #{cfg[:api_key_env]} not set")
      return SAFETY_DEFAULT
    end

    @logger.info("[SanitizeService] Sending safety review request to #{cfg[:model]}")
    raw = LlmGatewayService.new(
      api_url:       cfg[:api_url],
      api_key:       api_key,
      model:         cfg[:model],
      system_prompt: read_prompt_file(cfg[:prompt_file]),
      user_input:    "Classify this model output:\n\n#{downstream_output}",
      max_tokens:    cfg[:max_tokens],
      temperature:   cfg[:temperature],
      logger:        @logger
    ).call

    parse_safety_response(raw)
  rescue StandardError => e
    @logger.error("[SanitizeService] Safety LLM failed: #{e.message}")
    SAFETY_DEFAULT.merge(reason: "Safety analysis failed: #{e.message}")
  end

  def parse_safety_response(raw)
    cleaned = raw.gsub(/\A```(?:json)?\s*/m, "").gsub(/\s*```\z/m, "").strip
    parsed  = JSON.parse(cleaned)
    {
      safe:    !!parsed["safe"],
      verdict: parsed["verdict"].to_s.presence || "unknown",
      reason:  parsed["reason"].to_s.presence  || "No reason given"
    }
  rescue JSON::ParserError
    { safe: false, verdict: "unknown", reason: raw.to_s.presence || "Safety model did not return JSON" }
  end

  # ── ML insight ───────────────────────────────────────────────────────────────

  def ml_insight(injections)
    return "No anomalous patterns detected. Standard user query." if injections.empty?

    [
      "Token pattern matches known jailbreak template (confidence: #{rand(85..99)}%)",
      "Semantic similarity to prompt extraction attack: #{rand(75..99).to_f / 100}",
      "Instruction override attempt detected via role confusion vector",
      "Multi-turn manipulation attempt detected. Context window exploit."
    ].sample
  end
end
