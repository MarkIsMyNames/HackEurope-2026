module Api
  class PromptController < ApplicationController
    def show
      render_prompt(AppConfig[:prompt_file])
    end

    def update
      save_prompt(AppConfig[:prompt_file], params[:content].to_s)
    end

    def show_downstream
      render_prompt(AppConfig.dig(:downstream_llm, :prompt_file))
    end

    def update_downstream
      save_prompt(AppConfig.dig(:downstream_llm, :prompt_file), params[:content].to_s)
    end

    private

    def render_prompt(filename)
      file    = Rails.root.join(filename)
      content = file.exist? ? file.read : ""
      Rails.logger.info("[PromptController] #{filename} read (#{content.length} chars)")
      render json: { content: content }
    end

    def save_prompt(filename, content)
      Rails.root.join(filename).write(content)
      Rails.logger.info("[PromptController] #{filename} updated (#{content.length} chars)")
      render json: { content: content }
    end
  end
end
