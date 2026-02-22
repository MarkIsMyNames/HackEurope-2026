module Api
  class SolanaController < ApplicationController
    # POST /api/solana/payment_request
    # Returns { url:, reference:, amount_sol: } for a new Solana Pay payment.
    def payment_request
      result = SolanaService.new.generate_payment_request
      render json: result
    rescue => e
      Rails.logger.error("[SolanaController] payment_request failed: #{e.message}")
      render json: { error: e.message }, status: :internal_server_error
    end

    # POST /api/solana/verify
    # Body: { reference: "<base58 reference key>" }
    # Returns { paid: bool, signature?: string }
    def verify
      reference = params[:reference].to_s.strip
      if reference.blank?
        render json: { error: "reference is required" }, status: :unprocessable_entity
        return
      end

      result = SolanaService.new.verify_payment(reference)
      render json: result
    rescue => e
      Rails.logger.error("[SolanaController] verify failed: #{e.message}")
      render json: { error: e.message }, status: :internal_server_error
    end
  end
end
