class StripeService
  CACHE_FILE = Rails.root.join("stripe_cache.json")

  # Pricing (monthly subscriptions):
  # Personal:   €19/month flat  — up to 1M tokens
  # Business:   €89/month flat  — up to 5M tokens
  # Enterprise: €17 per million tokens (metered, billed monthly)
  TIERS = {
    person: {
      name:        "PromptSecure Personal",
      description: "For individual developers — up to 1M tokens per month",
      amount:      1900
    },
    business: {
      name:        "PromptSecure Business",
      description: "For teams — up to 5M tokens per month",
      amount:      8900
    },
    enterprise: {
      name:               "PromptSecure Enterprise",
      description:        "For organisations — €17 per million tokens, billed monthly",
      amount:             1700,
      metered:            true,
      transform_quantity: { divide_by: 1_000_000, round: "up" }
    }
  }.freeze

  # Returns the recurring Stripe Price ID for the given tier.
  # Priority: STRIPE_PRICE_ID_<TIER> env var → cache file → auto-create.
  def self.price_id(tier)
    tier = tier.to_sym
    raise ArgumentError, "Unknown tier: #{tier}" unless TIERS.key?(tier)

    env_key = "STRIPE_PRICE_ID_#{tier.upcase}"
    return ENV[env_key] if ENV[env_key].present?

    cached = load_cache
    return cached[:"#{tier}_price_id"] if cached[:"#{tier}_price_id"]

    create_price(tier)
  end

  def self.metered?(tier)
    TIERS.dig(tier.to_sym, :metered) == true
  end

  class << self
    private

    def load_cache
      return {} unless CACHE_FILE.exist?

      JSON.parse(CACHE_FILE.read, symbolize_names: true)
    rescue JSON::ParserError
      {}
    end

    def save_cache(data)
      CACHE_FILE.write(JSON.pretty_generate(data))
    end

    def create_price(tier)
      cfg = TIERS[tier]

      product = Stripe::Product.create(
        name:        cfg[:name],
        description: cfg[:description]
      )

      price_params = {
        product:     product.id,
        unit_amount: cfg[:amount],
        currency:    "eur",
        recurring:   {
          interval:   "month",
          usage_type: cfg[:metered] ? "metered" : "licensed"
        }
      }

      if cfg[:metered]
        # Stripe >= 2025-03-31.basil requires metered prices to be backed by a Billing Meter.
        meter = Stripe::Billing::Meter.create(
          display_name:        cfg[:name],
          event_name:          "#{tier}_token_usage",
          default_aggregation: { formula: "sum" }
        )
        price_params[:recurring][:meter] = meter.id
        Rails.logger.info("[StripeService] Created meter #{meter.id} for #{tier}")
      else
        price_params[:transform_quantity] = cfg[:transform_quantity] if cfg[:transform_quantity]
      end

      price = Stripe::Price.create(price_params)

      cached = load_cache
      cached[:"#{tier}_price_id"]   = price.id
      cached[:"#{tier}_product_id"] = product.id
      save_cache(cached)

      Rails.logger.info("[StripeService] Created #{tier} — product #{product.id}, price #{price.id}")
      price.id
    end
  end
end
