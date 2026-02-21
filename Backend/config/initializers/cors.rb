Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:8080", "http://127.0.0.1:8080"
    resource "*",
      headers: :any,
      methods: %i[get post put options]
  end
end
