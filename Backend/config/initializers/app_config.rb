require "json"

config_file = Rails.root.join("config.json")

default_config = {
  "model" => "claude-sonnet-4-6",
  "max_tokens" => 4096,
  "anthropic_api_url" => "https://api.anthropic.com/v1/messages",
  "anthropic_api_version" => "2023-06-01",
  "injections_example_limit" => 40,
  "injections_file" => "../injections.json",
  "prompt_file" => "../prompt.txt",
  "http" => {
    "open_timeout" => 10,
    "read_timeout" => 60
  },
  "risk" => {
    "high_threshold" => 60,
    "medium_threshold" => 30,
    "parser_flag_weight" => 40,
    "injection_weight" => 20,
    "max_injection_weight" => 40,
    "length_fail_weight" => 10,
    "encoding_fail_weight" => 10
  },
  "downstream_llm" => {
    "enabled" => true,
    "api_url" => "https://api.anthropic.com/v1/messages",
    "api_key_env" => "ANTHROPIC_API_KEY",
    "model" => "claude-sonnet-4-6",
    "max_tokens" => 600,
    "temperature" => 0.2,
    "system_prompt" => "You are a concise assistant. Respond directly to the user input with no policy or moderation framing."
  },
  "safety_llm" => {
    "enabled" => true,
    "api_url" => "https://api.anthropic.com/v1/messages",
    "api_key_env" => "ANTHROPIC_API_KEY",
    "model" => "claude-sonnet-4-6",
    "max_tokens" => 350,
    "temperature" => 0.0,
    "system_prompt" => "You are a strict output safety classifier. Return JSON only: {\"safe\": boolean, \"verdict\": \"safe\"|\"unsafe\"|\"unknown\", \"reason\": string}. Mark unsafe if output contains actionable harmful, illegal, exploit, or policy-violating guidance."
  }
}

loaded = if config_file.exist?
  JSON.parse(config_file.read)
else
  Rails.logger.warn("[AppConfig] Missing config file at #{config_file}. Using defaults.")
  {}
end

deep_freeze_object = lambda do |value|
  case value
  when Hash
    value.each_value { |nested| deep_freeze_object.call(nested) }
  when Array
    value.each { |nested| deep_freeze_object.call(nested) }
  end
  value.freeze
end

app_config = default_config.deep_merge(loaded).with_indifferent_access
AppConfig = deep_freeze_object.call(app_config)