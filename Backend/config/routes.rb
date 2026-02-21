Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post "sanitize",        to: "sanitize#create"
    get  "injections",      to: "sanitize#injections"
    get  "prompt",          to: "prompt#show"
    put  "prompt",          to: "prompt#update"
    post "stripe/checkout", to: "stripe#checkout"
    post "stripe/webhook",  to: "stripe#webhook"
  end
end
