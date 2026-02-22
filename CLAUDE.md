# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A prompt injection detection and sanitization tool with a Rails API backend and React frontend. User input passes through a three-stage pipeline: a fast rule-based parser, an AI-powered sanitization stage that detects and removes injection attempts, and then a downstream LLM call whose output is independently safety-reviewed. Detected injections are persisted and fed back into future requests to improve detection over time. Stripe Checkout handles payments.

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

1. **Rule-based — `ParserService`**: Reads `Backend/parser_config.json` per-request for the character whitelist regex and blacklist patterns. Strips disallowed characters and flags matching patterns. No API cost.

2. **Sanitize LLM — `SanitizeService`**: Sends parser output to Claude using `Backend/prompt.txt` as the system prompt. Claude returns `{ "sanitized": "...", "injections": [...] }`. Previously detected injections (capped at `injections_example_limit`) are appended as examples to improve detection over time.

3. **Downstream LLM + Safety review — `SanitizeService`**: The sanitized text is forwarded to a downstream LLM (`Backend/downstream_prompt.txt`). Its output is then independently classified by a safety LLM (`Backend/safety_prompt.txt`) which returns `{ safe, verdict, reason }`.

All three LLM calls go through **`LlmGatewayService`**, which supports both Anthropic and OpenAI-compatible endpoints.

### Persistent injection memory

Detected injections are deduplicated and appended to `Backend/injections.json` (gitignored). On each request they are fed back into the sanitize system prompt, making detection progressively smarter.

### Request history

Every sanitized entry is appended to `Backend/history.json` (gitignored, created at runtime). The Analytics page reads this via `GET /api/history` to power the charts.

### Risk scoring

`SanitizeController#compute_risk_score` combines parser flags, per-injection count, and encoding detection into a 0–100 score. All thresholds and weights live in `Backend/config.json` under `risk`.

## Configuration

### `Backend/config.json`

Loaded at boot by `Backend/config/initializers/app_config.rb` into the frozen `AppConfig` hash. Never hardcode values that belong here.

| Key | Purpose |
|-----|---------|
| `model` | Model for the sanitize stage |
| `max_tokens` | Max tokens for sanitize response |
| `anthropic_api_url` | Anthropic endpoint |
| `anthropic_api_version` | Anthropic version header (only stable version: `2023-06-01`) |
| `injections_example_limit` | Max past examples fed into sanitize prompt |
| `injections_file` | Runtime injection log filename (relative to `Backend/`) |
| `history_file` | Runtime request history filename (relative to `Backend/`) |
| `prompt_file` | Sanitize system prompt filename (relative to `Backend/`) |
| `parser_config_file` | Parser rules filename (relative to `Backend/`) |
| `http.open_timeout` / `http.read_timeout` | HTTP timeouts (seconds) |
| `risk.*` | Risk score weights and thresholds |
| `downstream_llm.*` | Model, tokens, temperature, prompt file for the downstream LLM |
| `safety_llm.*` | Model, tokens, temperature, prompt file for the safety classifier |

### `Backend/parser_config.json`

Read per-request by `ParserService`. Contains the full character whitelist and blacklist patterns — no defaults in code. Editable via the Rule Config UI.

```json
{
  "whitelist": "a-zA-Z0-9 \\n.,!?:;\"()[]{}@#%&+=~`^|<>$£€¥₩₹¢₽₺₿",
  "blacklist_patterns": [";", "--", "/*", "*/", "UNION", "SELECT", "INSERT", "DELETE", "DROP", "EXEC"]
}
```

## Editable files (via Rule Config UI)

All four configurable files are editable live through the Rule Config page (`/rule-config`). Changes take effect on the next request — no restart needed.

| File | Tab | Format | Purpose |
|------|-----|--------|---------|
| `Backend/prompt.txt` | Sanitize Prompt | Plain text | Instructs Claude to detect and strip injections, return `{ sanitized, injections[] }` |
| `Backend/downstream_prompt.txt` | Postprocessing Prompt | Plain text | System prompt for the downstream LLM |
| `Backend/safety_prompt.txt` | Safety Prompt | Plain text | Instructs safety classifier to return `{ safe, verdict, reason }` |
| `Backend/parser_config.json` | Parser Rules | JSON | Character whitelist + blacklist patterns |

## API endpoints

All under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sanitize` | Full pipeline — returns `PromptEntry` JSON |
| `GET` | `/injections` | All logged injection strings from `injections.json` |
| `GET` | `/history` | All historical `PromptEntry` records from `history.json` |
| `GET` | `/prompt` | Read `prompt.txt` |
| `PUT` | `/prompt` | Write `prompt.txt` |
| `GET` | `/downstream_prompt` | Read `downstream_prompt.txt` |
| `PUT` | `/downstream_prompt` | Write `downstream_prompt.txt` |
| `GET` | `/safety_prompt` | Read `safety_prompt.txt` |
| `PUT` | `/safety_prompt` | Write `safety_prompt.txt` |
| `GET` | `/parser_config` | Read `parser_config.json` |
| `PUT` | `/parser_config` | Write `parser_config.json` |
| `POST` | `/stripe/checkout` | Create Stripe Checkout session, returns `{ url }` |
| `POST` | `/stripe/webhook` | Receive and verify Stripe webhook events |

CORS allows any `localhost` or `127.0.0.1` origin on any port.

## Stripe integration

`StripeService` resolves the price ID in order: `STRIPE_PRICE_ID` env var → `Backend/stripe_cache.json` → auto-creates a PromptSecure product at €300 EUR. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `Backend/.env`. Set `FRONTEND_URL` if deploying (defaults to `http://localhost:5173`).

## Frontend structure

- `src/lib/api.ts` — all fetch calls (`sanitizeText`, `fetchHistory`, `fetchPrompt`, `savePrompt`, `fetchDownstreamPrompt`, `saveDownstreamPrompt`, `fetchSafetyPrompt`, `saveSafetyPrompt`, `fetchParserConfig`, `saveParserConfig`, `fetchInjections`, `createCheckoutSession`)
- `src/data/mockData.ts` — `PromptEntry` TypeScript interface (source of truth for API response shape)
- `src/pages/Index.tsx` — dashboard with input and live result feed
- `src/pages/Analytics.tsx` — charts powered by `GET /api/history`
- `src/pages/RuleConfig.tsx` — four tabs: Sanitize Prompt, Postprocessing Prompt, Safety Prompt, Parser Rules
- `src/pages/IncidentLogs.tsx` — list all logged injections
- `src/pages/Pricing.tsx` — Stripe checkout page
- `src/pages/PaymentSuccess.tsx` / `PaymentCancel.tsx` — post-payment pages
- `src/components/AnalysisPanel.tsx` — sanitized output, injections list, validation, radar chart, ML insight

## Technology constraints

The backend is **Ruby on Rails only**. Do not add Python scripts, shell scripts, or additional frameworks — all server-side logic belongs in Rails services, controllers, or initializers.

The frontend is **React with TypeScript** (Vite, Tailwind, shadcn/ui). All API calls go through `src/lib/api.ts`.

## Code standards

### No magic strings or values
All static config lives in `Backend/config.json` (accessed via `AppConfig`). Dynamic runtime config lives in separate JSON files (`parser_config.json`). File paths always use `Rails.root.join(AppConfig[:key])`. `LlmGatewayService` receives all config values explicitly.

### Logging
Use `Rails.logger` — never `puts`. Every service and controller prefixes messages with its class name, e.g. `[SanitizeService]`. Use `info` for normal steps, `warn` for handled anomalies, `error` for failures. Include relevant values (counts, text fragments) in log messages.

### Service design
- Services take their input in `initialize` and expose a `call` method (or named query methods).
- File writes stay in the service that owns the data — controllers do not write files directly, except for `persist_history` which is controller-local.
- Controllers are thin: parse params → call services → compute derived values → render JSON.

## Gitignored runtime files

`Backend/injections.json`, `Backend/history.json`, `Backend/stripe_cache.json`, `Backend/log/`, `Backend/.env` are gitignored. All config and prompt files (`config.json`, `parser_config.json`, `prompt.txt`, `downstream_prompt.txt`, `safety_prompt.txt`) are tracked.
