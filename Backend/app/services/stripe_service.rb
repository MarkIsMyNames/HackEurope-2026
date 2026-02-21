class StripeService
  CACHE_FILE = Rails.root.join("stripe_cache.json")

  # Returns the Stripe Price ID to use for checkout.
  # Priority: STRIPE_PRICE_ID env var → cached file → auto-create.
  def self.price_id
    return ENV["STRIPE_PRICE_ID"] if ENV["STRIPE_PRICE_ID"].present?

    cached = load_cache
    return cached[:price_id] if cached[:price_id]

    create_price
  end

  class << self
    private

    def load_cache
      return {} unless CACHE_FILE.exist?

      JSON.parse(CACHE_FILE.read, symbolize_names: true)
    rescue JSON::ParserError
      {}
    end

    def create_price
      product = Stripe::Product.create(name: "PromptSecure")
      price   = Stripe::Price.create(
        product:     product.id,
        unit_amount: 30_000,
        currency:    "eur"
      )
      CACHE_FILE.write(JSON.pretty_generate({ price_id: price.id, product_id: product.id }))
      Rails.logger.info("[StripeService] Created product #{product.id} and price #{price.id}")
      price.id
    end
  end
end
