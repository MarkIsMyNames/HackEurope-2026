module Api
  class StripeController < ApplicationController
    FRONTEND_URL = ENV.fetch("FRONTEND_URL", "http://localhost:5173")

    # POST /api/stripe/checkout
    # Creates a Stripe Checkout session and returns the hosted payment URL.
    def checkout
      session = Stripe::Checkout::Session.create(
        line_items:  [{ price: StripeService.price_id, quantity: 1 }],
        mode:        "payment",
        success_url: "#{FRONTEND_URL}/payment/success",
        cancel_url:  "#{FRONTEND_URL}/payment/cancel",
      )
      Rails.logger.info("[StripeController] Checkout session created: #{session.id}")
      render json: { url: session.url }
    rescue Stripe::StripeError => e
      Rails.logger.error("[StripeController] Checkout session failed: #{e.message}")
      render json: { error: e.message }, status: :unprocessable_entity
    end

    # POST /api/stripe/webhook
    # Receives and verifies signed Stripe webhook events.
    def webhook
      payload    = request.body.read
      sig_header = request.headers["Stripe-Signature"]

      event = Stripe::Webhook.construct_event(
        payload, sig_header, ENV.fetch("STRIPE_WEBHOOK_SECRET")
      )

      case event["type"]
      when "checkout.session.completed"
        session = event.dig("data", "object")
        Rails.logger.info("[StripeController] Payment completed — session: #{session['id']}, customer: #{session['customer_email']}")
      end

      render json: { received: true }
    rescue JSON::ParserError
      Rails.logger.warn("[StripeController] Webhook received invalid payload")
      render json: { error: "Invalid payload" }, status: :bad_request
    rescue Stripe::SignatureVerificationError
      Rails.logger.warn("[StripeController] Webhook signature verification failed")
      render json: { error: "Invalid signature" }, status: :bad_request
    end
  end
end
