module Api
  class ParserConfigController < ApplicationController
    def show
      file = Rails.root.join(AppConfig[:parser_config_file])
      render json: JSON.parse(file.read)
    rescue => e
      Rails.logger.error("[ParserConfigController] Failed to read config: #{e.message}")
      render json: { error: "Could not read parser config" }, status: :internal_server_error
    end

    def update
      data = {
        "whitelist"          => params[:whitelist].to_s,
        "blacklist_patterns" => Array(params[:blacklist_patterns]).map(&:to_s).reject(&:empty?)
      }
      file = Rails.root.join(AppConfig[:parser_config_file])
      file.write(JSON.pretty_generate(data))
      Rails.logger.info("[ParserConfigController] Parser config updated")
      render json: data
    end
  end
end
