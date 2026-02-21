Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(%r{\Ahttps?://localhost(:\d+)?\z}, %r{\Ahttps?://127\.0\.0\.1(:\d+)?\z})
    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head]
  end
end
