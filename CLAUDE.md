# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

PromptSecure — a prompt injection detection and sanitization tool. User input passes through a three-stage pipeline: rule-based parsing, AI-powered injection detection, and then a downstream LLM call whose output is independently safety-reviewed. Stripe Checkout handles payments.

## Running the project

**Backend** (Rails API on port 3000):
```bash
cd Backend
bundle install
rails server
```
Requires `ANTHROPIC_API_KEY` and `STRIPE_SECRET_KEY` in `Backend/.env`.

**Frontend** (Vite dev server on port 5173):
```bash
cd Frontend
npm install
npm run dev
```

## Architecture

### Three-stage pipeline

1. **Rule-based — `ParserService`**: Strips disallowed characters (whitelist regex) and flags known SQL/command injection patterns (`UNION`, `DROP`, `--`, etc.). Fast, no API cost.

2. **Sanitize LLM — `SanitizeService`**: Sends parser output to Claude using `Backend/prompt.txt` as the system prompt. Claude returns `{ "sanitized": "...", "injections": [...] }`. Previously detected injections (capped at `injections_example_limit`) are appended as examples to improve detection over time.

3. **Downstream LLM + Safety review — `SanitizeService`**: The sanitized text is forwarded to a downstream LLM (`Backend/downstream_prompt.txt`). Its output is then independently classified by a safety LLM (`Backend/safety_prompt.txt`) which returns `{ safe, verdict, reason }`.

All three LLM calls go through **`LlmGatewayService`**, which supports both Anthropic and OpenAI-compatible endpoints.

### Persistent injection memory

Detected injections are deduplicated and appended to `Backend/injections.json` (gitignored). On each request they are fed back into the sanitize system prompt, making detection progressively smarter.

### Risk scoring

`SanitizeController#compute_risk_score` combines parser flags, per-injection count, and encoding detection into a 0–100 score. All thresholds and weights live in `Backend/config.json` under `risk`.

## Configuration

All tunable values live in `Backend/config.json`, loaded at boot by `Backend/config/initializers/app_config.rb` into the frozen `AppConfig` hash. Never hardcode values that belong here.

| Key | Default | Purpose |
|-----|---------|---------|
| `model` | `claude-sonnet-4-6` | Model for the sanitize stage |
| `max_tokens` | `4096` | Max tokens for sanitize response |
| `anthropic_api_url` | `https://api.anthropic.com/v1/messages` | Anthropic endpoint |
| `anthropic_api_version` | `2023-06-01` | Anthropic version header (only stable version) |
| `injections_example_limit` | `40` | Max past examples fed into sanitize prompt |
| `injections_file` | `injections.json` | Runtime injection log (in `Backend/`) |
| `prompt_file` | `prompt.txt` | Sanitize system prompt (in `Backend/`) |
| `http.open_timeout` | `10` | HTTP connect timeout (seconds) |
| `http.read_timeout` | `60` | HTTP read timeout (seconds) |
| `risk.high_threshold` | `60` | Score above which label is "high" |
| `risk.medium_threshold` | `30` | Score above which label is "medium" |
| `risk.parser_flag_weight` | `40` | Score added when parser detects threats |
| `risk.injection_weight` | `20` | Score added per injection Claude finds |
| `risk.encoding_fail_weight` | `10` | Score added when base64/hex encoding detected |
| `downstream_llm.enabled` | `true` | Toggle downstream LLM call |
| `downstream_llm.model` | `claude-sonnet-4-6` | Model for downstream response |
| `downstream_llm.max_tokens` | `600` | Max tokens for downstream response |
| `downstream_llm.temperature` | `0.2` | Temperature for downstream response |
| `downstream_llm.prompt_file` | `downstream_prompt.txt` | Downstream system prompt (in `Backend/`) |
| `safety_llm.enabled` | `true` | Toggle safety review |
| `safety_llm.model` | `claude-sonnet-4-6` | Model for safety classification |
| `safety_llm.max_tokens` | `350` | Max tokens for safety response |
| `safety_llm.temperature` | `0.0` | Temperature for safety classification |
| `safety_llm.prompt_file` | `safety_prompt.txt` | Safety classifier prompt (in `Backend/`) |

## Prompt files

All system prompts live in `Backend/` as plain text files — edit them without touching code:

| File | Purpose |
|------|---------|
| `Backend/prompt.txt` | Instructs Claude to detect and strip injection attempts, return strict JSON |
| `Backend/downstream_prompt.txt` | System prompt for the downstream LLM that processes sanitized user input |
| `Backend/safety_prompt.txt` | Instructs the safety classifier to return `{ safe, verdict, reason }` JSON |

## API endpoints

All under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sanitize` | Full pipeline — returns `PromptEntry` JSON |
| `GET` | `/injections` | All logged injection strings from `injections.json` |
| `GET` | `/prompt` | Current contents of `prompt.txt` |
| `PUT` | `/prompt` | Overwrite `prompt.txt` with `{ content: "..." }` |
| `POST` | `/stripe/checkout` | Create Stripe Checkout session, returns `{ url }` |
| `POST` | `/stripe/webhook` | Receive and verify Stripe webhook events |

CORS is configured in `Backend/config/initializers/cors.rb` to allow any `localhost` or `127.0.0.1` origin on any port.

## Stripe integration

`StripeService` resolves the price ID in order: `STRIPE_PRICE_ID` env var → `Backend/stripe_cache.json` → auto-creates a PromptSecure product at €300 EUR. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `Backend/.env`. Set `FRONTEND_URL` if deploying (defaults to `http://localhost:5173`).

## Frontend structure

- `src/lib/api.ts` — all fetch calls (`sanitizeText`, `fetchPrompt`, `savePrompt`, `fetchInjections`, `createCheckoutSession`)
- `src/data/mockData.ts` — `PromptEntry` TypeScript interface (source of truth for API response shape)
- `src/pages/Index.tsx` — dashboard with input and live result feed
- `src/pages/Analytics.tsx` — charts powered by session history
- `src/pages/RuleConfig.tsx` — edit and save `prompt.txt` via the API
- `src/pages/IncidentLogs.tsx` — list all logged injections
- `src/pages/Pricing.tsx` — Stripe checkout page
- `src/pages/PaymentSuccess.tsx` / `PaymentCancel.tsx` — post-payment pages
- `src/components/AnalysisPanel.tsx` — sanitized output, injections list, validation, radar chart, ML insight

## Technology constraints

The backend is **Ruby on Rails only**. Do not add Python scripts, shell scripts, or additional frameworks — all server-side logic belongs in Rails services, controllers, or initializers.

The frontend is **React with TypeScript** (Vite, Tailwind, shadcn/ui). All API calls go through `src/lib/api.ts`.

## Code standards

### No magic strings or values
All configurable values belong in `Backend/config.json` and are accessed via `AppConfig`. File paths always use `Rails.root.join(AppConfig[:key])`. `LlmGatewayService` receives all config values explicitly — it never reads `AppConfig` for model/token settings.

### Logging
Use `Rails.logger` — never `puts`. Every service and controller prefixes messages with its class name, e.g. `[SanitizeService]`. Use `info` for normal steps, `warn` for handled anomalies, `error` for failures.

### Service design
- Services take their input in `initialize` and expose a `call` method (or named query methods).
- File writes stay in the service that owns the data.
- Controllers are thin: parse params → call services → render JSON.

## Gitignored runtime files

`Backend/injections.json`, `Backend/history.json`, `Backend/stripe_cache.json`, `Backend/log/`, `Backend/.env` are gitignored. `Backend/config.json`, `Backend/prompt.txt`, `Backend/downstream_prompt.txt`, and `Backend/safety_prompt.txt` are all tracked.
