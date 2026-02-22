class SolanaService
  BASE58_ALPHABET  = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".freeze
  LAMPORTS_PER_SOL = 1_000_000_000

  def initialize
    cfg              = AppConfig[:solana]
    @rpc_url         = cfg[:rpc_url]
    @recipient       = cfg[:recipient_address].presence || ENV.fetch("SOLANA_RECIPIENT_ADDRESS", "")
    @amount_sol      = cfg[:amount_sol].to_f
    @amount_lamports = (@amount_sol * LAMPORTS_PER_SOL).to_i
    @label           = cfg[:label]
    @message         = cfg[:message]
    @token_grant     = cfg[:token_grant].to_s
    @payments_file   = Rails.root.join(cfg[:payments_file])
  end

  # Creates a new payment request. Returns { url:, reference:, amount_sol: }.
  def generate_payment_request
    raise "SOLANA_RECIPIENT_ADDRESS is not configured" if @recipient.blank?

    reference = generate_reference
    url       = build_solana_pay_url(reference)
    save_payment_request(reference)

    Rails.logger.info("[SolanaService] Payment request created — reference=#{reference} amount=#{@amount_sol} SOL")
    { url: url, reference: reference, amount_sol: @amount_sol, token_grant: @token_grant }
  end

  # Checks whether `reference` has been paid on-chain.
  # Returns { paid: bool, signature?: string }.
  def verify_payment(reference)
    payments = load_payments

    if payments.dig(reference, "paid")
      Rails.logger.info("[SolanaService] Reference #{reference} already marked paid")
      return { paid: true, signature: payments[reference]["signature"] }
    end

    signatures = get_signatures_for_address(reference)
    if signatures.empty?
      Rails.logger.info("[SolanaService] No signatures found for reference #{reference}")
      return { paid: false }
    end

    signatures.each do |sig_info|
      next if sig_info["err"]
      next unless %w[confirmed finalized].include?(sig_info["confirmationStatus"])

      sig = sig_info["signature"]
      if transaction_valid?(sig)
        mark_paid(reference, sig, payments)
        Rails.logger.info("[SolanaService] Payment confirmed — reference=#{reference} sig=#{sig}")
        return { paid: true, signature: sig }
      end
    end

    { paid: false }
  end

  private

  # Produces a random 32-byte value encoded as base58 (valid Solana address format).
  def generate_reference
    base58_encode(SecureRandom.bytes(32))
  end

  def build_solana_pay_url(reference)
    # Solana Pay requires percent-encoding (%20), not HTML form encoding (+).
    params = URI.encode_www_form([
      ["amount",    format("%.9g", @amount_sol)],
      ["label",     @label],
      ["message",   @message],
      ["reference", reference]
    ]).gsub("+", "%20")
    "solana:#{@recipient}?#{params}"
  end

  # Calls getSignaturesForAddress to find transactions that included `address`
  # as an account (i.e. where the wallet included it as the Solana Pay reference).
  def get_signatures_for_address(address)
    resp = rpc_call("getSignaturesForAddress", [address, { "commitment" => "confirmed" }])
    resp["result"] || []
  rescue => e
    Rails.logger.error("[SolanaService] getSignaturesForAddress failed: #{e.message}")
    []
  end

  # Fetches the transaction and verifies it transferred >= amount_lamports to recipient.
  def transaction_valid?(signature)
    resp = rpc_call("getTransaction", [
      signature,
      { "commitment" => "confirmed", "encoding" => "jsonParsed", "maxSupportedTransactionVersion" => 0 }
    ])
    tx = resp["result"]
    return false unless tx

    instructions = tx.dig("transaction", "message", "instructions") || []
    instructions.any? do |ix|
      ix["program"] == "system" &&
        ix.dig("parsed", "type") == "transfer" &&
        ix.dig("parsed", "info", "destination") == @recipient &&
        ix.dig("parsed", "info", "lamports").to_i >= @amount_lamports
    end
  rescue => e
    Rails.logger.error("[SolanaService] getTransaction failed for #{signature}: #{e.message}")
    false
  end

  def rpc_call(method, params)
    uri  = URI.parse(@rpc_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = uri.scheme == "https"
    http.open_timeout = 10
    http.read_timeout = 15

    path    = uri.path.empty? ? "/" : uri.path
    request = Net::HTTP::Post.new(path, "Content-Type" => "application/json")
    request.body = JSON.generate({ "jsonrpc" => "2.0", "id" => 1, "method" => method, "params" => params })

    response = http.request(request)
    JSON.parse(response.body)
  end

  def load_payments
    return {} unless @payments_file.exist?
    JSON.parse(@payments_file.read)
  rescue JSON::ParserError
    {}
  end

  def save_payment_request(reference)
    payments               = load_payments
    payments[reference]    = {
      "created_at" => Time.now.iso8601,
      "amount_sol" => @amount_sol,
      "recipient"  => @recipient,
      "paid"       => false
    }
    @payments_file.write(JSON.pretty_generate(payments))
  rescue => e
    Rails.logger.error("[SolanaService] Failed to persist payment request: #{e.message}")
  end

  def mark_paid(reference, signature, payments)
    payments[reference] = payments.fetch(reference, {}).merge(
      "paid"      => true,
      "signature" => signature,
      "paid_at"   => Time.now.iso8601
    )
    @payments_file.write(JSON.pretty_generate(payments))
  rescue => e
    Rails.logger.error("[SolanaService] Failed to mark payment paid: #{e.message}")
  end

  # Encodes raw bytes as a Bitcoin/Solana base58 string.
  def base58_encode(bytes)
    num    = bytes.unpack1("H*").to_i(16)
    result = +""
    while num > 0
      result.prepend(BASE58_ALPHABET[num % 58])
      num /= 58
    end
    # Preserve leading zero bytes as "1" characters.
    bytes.each_byte do |b|
      break unless b.zero?
      result.prepend("1")
    end
    result
  end
end
