# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A prompt injection detection and sanitization tool with a Rails API backend and React frontend. User input passes through a two-stage pipeline: a fast rule-based parser, then an AI stage using Claude to detect and remove injection attempts semantically. Detected injections are persisted and fed back into the AI prompt on future requests to improve detection over time.

## Running the project

**Backend** (Rails API on port 3000):
```bash
cd Backend
bundle install
rails server
```
Requires `ANTHROPIC_API_KEY` in `Backend/.env`.

**Frontend** (Vite dev server on port 5173):
```bash
cd Frontend
npm install
npm run dev
```

## Architecture

### Two-stage sanitization pipeline

1. **Rule-based stage — `ParserService`**: Strips characters outside a whitelist (alphanumeric, punctuation, currency symbols) and pattern-matches known SQL/command injection strings (`UNION`, `DROP`, `--`, etc.). Fast, no API cost.

2. **AI stage — `SanitizeService`**: Sends parser output to Claude with a system prompt loaded from `prompt.txt`. Claude returns structured JSON `{ "sanitized": "...", "injections": [...] }`. Previously detected injections (up to `injections_example_limit`) are appended to the system prompt as examples to improve detection over time.

### Persistent injection memory

Detected injection strings are deduplicated and written to `Backend/injections.json` (gitignored, created at runtime). On every request they are fed back into the Claude system prompt, making detection progressively more aware of previously seen attack patterns.

### Risk scoring

`SanitizeController#compute_risk_score` combines parser flags, per-injection count, and encoding detection into a 0–100 score. Thresholds and weights are all in `Backend/config.json` under the `risk` key.

## Configuration

All tunable values live in `Backend/config.json` — edit there rather than in code. The file is loaded at boot by `Backend/config/initializers/app_config.rb` into the `AppConfig` frozen hash.

| Key | Default | Purpose |
|-----|---------|---------|
| `model` | `claude-sonnet-4-6` | Claude model used for AI stage |
| `max_tokens` | `4096` | Max tokens in Claude response |
| `anthropic_api_url` | `https://api.anthropic.com/v1/messages` | Anthropic API endpoint |
| `anthropic_api_version` | `2023-06-01` | Anthropic API version header (only stable version) |
| `injections_example_limit` | `40` | Max past injection examples appended to system prompt |
| `injections_file` | `injections.json` | Runtime injection log (relative to `Backend/`) |
| `prompt_file` | `../prompt.txt` | Claude system prompt (relative to `Backend/`) |
| `http.open_timeout` | `10` | HTTP connection timeout (seconds) |
| `http.read_timeout` | `60` | HTTP read timeout (seconds) |
| `risk.high_threshold` | `60` | Score above which risk level is "high" |
| `risk.medium_threshold` | `30` | Score above which risk level is "medium" |
| `risk.parser_flag_weight` | `40` | Risk score added when parser detects threats |
| `risk.injection_weight` | `20` | Risk score added per injection Claude finds |
| `risk.encoding_fail_weight` | `10` | Risk score added when base64/hex encoding detected |

## API endpoints

All under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sanitize` | Sanitize text — runs full pipeline, returns `PromptEntry` JSON |
| `GET` | `/injections` | Returns all logged injection strings from `injections.json` |
| `GET` | `/prompt` | Returns current contents of `prompt.txt` |
| `PUT` | `/prompt` | Overwrites `prompt.txt` with `{ content: "..." }` body |

CORS is configured in `Backend/config/initializers/cors.rb` to allow `localhost:5173`.

## Frontend structure

- `src/lib/api.ts` — all fetch calls to the backend (`sanitizeText`, `fetchPrompt`, `savePrompt`, `fetchInjections`)
- `src/data/mockData.ts` — `PromptEntry` TypeScript interface (single source of truth for the API response shape)
- `src/pages/Index.tsx` — main dashboard with input textarea and live result feed
- `src/pages/RuleConfig.tsx` — loads and saves the Claude system prompt via the API
- `src/pages/IncidentLogs.tsx` — lists all logged injections from the API
- `src/components/AnalysisPanel.tsx` — displays sanitized output, injections removed, validation checks, radar chart, ML insight

## Technology constraints

The backend is **Ruby on Rails only**. Do not introduce Python scripts, shell scripts, or additional frameworks to handle backend logic — all server-side code belongs in the Rails app as services, controllers, or initializers. If a feature requires new backend logic, add it in `Backend/app/services/` or `Backend/app/controllers/`.

The frontend is **React with TypeScript** (Vite, Tailwind, shadcn/ui). All API communication goes through `src/lib/api.ts`.

## Code standards

### No magic strings or values
All configurable values belong in `Backend/config.json` and are accessed via `AppConfig`. Constant strings that appear in multiple places must be extracted to a named constant. File paths are never hardcoded in services or controllers.

### Logging
Use `Rails.logger` throughout — never `puts`. Every service prefixes log messages with its class name in brackets, e.g. `[SanitizeService]`. Log levels:

- `logger.info` — normal pipeline steps (request received, Claude called, file updated)
- `logger.warn` — detected threats, removed injections, unexpected-but-handled situations (e.g. invalid JSON from Claude)
- `logger.error` — failures that prevent the pipeline completing

Log messages must include relevant values (counts, fragment text, file paths) so logs are useful without reading source.

### Service design
- Services are initialised with their input and expose a single public `call` method (or named query methods like `sanitize`, `validation`, `heuristics`).
- Side effects (file writes) stay in the service that owns the data — controllers do not write files directly.
- Controllers are thin: parse params, call services, compute derived values (risk score), render JSON.

## Gitignored runtime files

`Backend/injections.json`, `Backend/log/`, `Backend/.env`, `app.log` are all gitignored. `Backend/config.json` and `prompt.txt` are tracked.
