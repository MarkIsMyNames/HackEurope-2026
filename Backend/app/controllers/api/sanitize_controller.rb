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

      entry = {
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
        validation: validation,
        heuristics: heuristics
      }

      persist_history(entry)

      render json: entry
    end

    def injections
      file = Rails.root.join("..", "injections.json")
      data = file.exist? ? JSON.parse(file.read) : []
      render json: { injections: data }
    rescue JSON::ParserError
      render json: { injections: [] }
    end

    def history
      file = Rails.root.join("..", "history.json")
      data = file.exist? ? JSON.parse(file.read) : []
      render json: { history: data }
    rescue JSON::ParserError
      render json: { history: [] }
    end

    private

    def compute_risk_score(parser_flagged, injections, validation)
      score = 0
      score += 40 if parser_flagged
      score += [injections.length * 20, 40].min
      score += 10 if validation[:lengthCheck] == "fail"
      score += 10 if validation[:encodingCheck] == "fail"
      [score, 100].min
    end

    def risk_level_for(score)
      if score > 60 then "high"
      elsif score > 30 then "medium"
      else "low"
      end
    end

    def persist_history(entry)
      file = Rails.root.join("..", "history.json")
      history = file.exist? ? JSON.parse(file.read) : []
      history << entry.transform_keys(&:to_s)
      file.write(JSON.generate(history))
    rescue => e
      Rails.logger.error("[SanitizeController] Failed to persist history: #{e.message}")
    end
  end
end
