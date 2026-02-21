module Api
  class SanitizeController < ApplicationController
    def create
      text = params[:text].to_s.strip

      if text.empty?
        render json: { error: "text is required" }, status: :unprocessable_entity
        return
      end

      Rails.logger.info("[SanitizeController] Processing #{text.length} char(s)")

      parser     = ParserService.new(text)
      parsed     = parser.sanitize
      validation = parser.validation
      heuristics = parser.heuristics
      flagged_by_parser = parser.threats_detected?

      result     = SanitizeService.new(parsed).call
      injections = result[:injections]
      flagged    = flagged_by_parser || injections.any?
      risk_score = compute_risk_score(flagged_by_parser, injections, validation)
      risk_level = risk_level_for(risk_score)

      Rails.logger.info("[SanitizeController] Done — risk=#{risk_score} (#{risk_level}), injections=#{injections.length}")

      render json: {
        id:         "prompt-#{Time.now.to_i}-#{rand(1000)}",
        snippet:    text,
        sanitized:  result[:sanitized],
        injections: injections,
        timestamp:  Time.now.iso8601,
        riskLevel:  risk_level,
        riskScore:  risk_score,
        source:     "Web Client",
        flagged:    flagged,
        mlInsight:  result[:ml_insight],
        downstreamOutput: result[:downstream_output],
        safetyReview: result[:safety_review],
        validation: validation,
        heuristics: heuristics
      }
    end

    def injections
      file = Rails.root.join(AppConfig[:injections_file] || "../injections.json")
      data = file.exist? ? JSON.parse(file.read) : []
      render json: { injections: data }
    rescue JSON::ParserError
      render json: { injections: [] }
    end

    private

    def compute_risk_score(parser_flagged, injections, validation)
      risk = AppConfig[:risk] || {}
      score = 0
      score += (risk[:parser_flag_weight] || 40) if parser_flagged
      score += [injections.length * (risk[:injection_weight] || 20), risk[:max_injection_weight] || 40].min
      score += (risk[:length_fail_weight] || 10) if validation[:lengthCheck] == "fail"
      score += (risk[:encoding_fail_weight] || 10) if validation[:encodingCheck] == "fail"
      [score, 100].min
    end

    def risk_level_for(score)
      risk = AppConfig[:risk] || {}
      if score > (risk[:high_threshold] || 60) then "high"
      elsif score > (risk[:medium_threshold] || 30) then "medium"
      else "low"
      end
    end
  end
end
