module Api
  class PromptController < ApplicationController
    def show
      file    = Rails.root.join(AppConfig[:prompt_file])
      content = file.exist? ? file.read : ""
      Rails.logger.info("[PromptController] Prompt read (#{content.length} chars)")
      render json: { content: content }
    end

    def update
      content = params[:content].to_s
      Rails.root.join(AppConfig[:prompt_file]).write(content)
      Rails.logger.info("[PromptController] Prompt updated (#{content.length} chars)")
      render json: { content: content }
    end
  end
end
