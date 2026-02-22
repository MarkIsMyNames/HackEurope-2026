Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post "sanitize",          to: "sanitize#create"
    get  "injections",        to: "sanitize#injections"
    get  "history",           to: "sanitize#history"
    get  "prompt",            to: "prompt#show"
    put  "prompt",            to: "prompt#update"
    get  "downstream_prompt", to: "prompt#show_downstream"
    put  "downstream_prompt", to: "prompt#update_downstream"
    get  "safety_prompt",     to: "prompt#show_safety"
    put  "safety_prompt",     to: "prompt#update_safety"
    get  "parser_config",     to: "parser_config#show"
    put  "parser_config",     to: "parser_config#update"
    post "stripe/checkout",   to: "stripe#checkout"
    post "stripe/webhook",    to: "stripe#webhook"
  end
end
