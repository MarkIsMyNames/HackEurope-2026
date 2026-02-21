require "net/http"
require "json"

class LlmGatewayService
  def initialize(api_url:, api_key:, model:, user_input:, system_prompt:, max_tokens:, temperature:, logger: Rails.logger)
    @api_url = api_url
    @api_key = api_key
    @model = model
    @user_input = user_input
    @system_prompt = system_prompt
    @max_tokens = max_tokens
    @temperature = temperature
    @logger = logger
  end

  def call
    uri = URI(@api_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = AppConfig.dig(:http, :open_timeout) || 10
    http.read_timeout = AppConfig.dig(:http, :read_timeout) || 60

    request = build_request(uri)

    @logger.info("[LlmGatewayService] Requesting model=#{@model} endpoint=#{uri.host}")
    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      @logger.error("[LlmGatewayService] LLM request failed status=#{response.code} body=#{response.body}")
      raise "LLM request failed with status #{response.code}"
    end

    payload = JSON.parse(response.body)
    content = extract_content(payload)

    if content.empty?
      @logger.warn("[LlmGatewayService] Empty model response for model=#{@model}")
    end

    content
  end

  private

  def anthropic_endpoint?
    URI(@api_url).host.to_s.include?("anthropic.com")
  end

  def build_request(uri)
    anthropic_endpoint? ? build_anthropic_request(uri) : build_openai_request(uri)
  end

  def build_openai_request(uri)
    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request["Authorization"] = "Bearer #{@api_key}"
    request.body = JSON.generate(
      {
        model: @model,
        messages: [
          { role: "system", content: @system_prompt },
          { role: "user", content: @user_input }
        ],
        max_tokens: @max_tokens,
        temperature: @temperature
      }
    )
    request
  end

  def build_anthropic_request(uri)
    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request["x-api-key"] = @api_key
    request["anthropic-version"] = AppConfig[:anthropic_api_version] || "2023-06-01"
    request.body = JSON.generate(
      {
        model: @model,
        max_tokens: @max_tokens,
        temperature: @temperature,
        system: @system_prompt,
        messages: [
          { role: "user", content: @user_input }
        ]
      }
    )
    request
  end

  def extract_content(payload)
    if anthropic_endpoint?
      blocks = payload["content"] || []
      blocks.filter_map { |block| block["text"] if block["type"] == "text" }.join("\n").strip
    else
      payload.dig("choices", 0, "message", "content").to_s.strip
    end
  end
end
