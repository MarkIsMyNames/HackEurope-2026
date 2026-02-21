module Api
  class PromptController < ApplicationController
    PROMPT_FILE = Rails.root.join("..", "prompt.txt")

    def show
      content = PROMPT_FILE.exist? ? PROMPT_FILE.read : ""
      Rails.logger.info("[PromptController] Prompt read (#{content.length} chars)")
      render json: { content: content }
    end

    def update
      content = params[:content].to_s
      PROMPT_FILE.write(content)
      Rails.logger.info("[PromptController] Prompt updated (#{content.length} chars)")
      render json: { content: content }
    end
  end
end
