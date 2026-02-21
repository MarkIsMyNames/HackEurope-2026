config_file = Rails.root.join("config.json")
AppConfig = JSON.parse(config_file.read, symbolize_names: true).freeze
Rails.logger.info("[AppConfig] Loaded from #{config_file}")
