Stripe.api_key = ENV.fetch("STRIPE_SECRET_KEY")
Rails.logger.info("[Stripe] Initialised with key ending ...#{Stripe.api_key.last(4)}")
