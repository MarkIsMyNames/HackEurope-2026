# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the tool

```bash
python main.py
```

Requires `ANTHROPIC_API_KEY` in `.env` (loaded automatically via `python-dotenv`).

## Dependencies

```bash
pip install anthropic python-dotenv
```

## Architecture

Two-stage prompt injection sanitization pipeline, orchestrated by `main.py`:

1. **Stage 1 — Rule-based (`parser.py`)**: `PromptInjectionDetector` filters characters against a whitelist and pattern-matches known SQL/command injection strings. Fast, no API call.
2. **Stage 2 — AI-based (`sanitize.py`)**: Sends the parser output to Claude with a strict system prompt loaded from `prompt.txt`. Returns structured JSON `{ "sanitized": "...", "injections": [...] }`. Previously detected injections are appended to the prompt as examples (capped at 40) to improve detection over time.

**Persistent injection memory**: Detected injection fragments are deduplicated and written to `injections.json`. On every subsequent run they are fed back into the Claude system prompt, making the AI stage progressively more aware of seen attack patterns.

## Configuration

All file paths, model, and limits are in `config.json`. Edit there rather than in code.

| Key | Default | Purpose |
|-----|---------|---------|
| `files.input` | `input.txt` | Text to sanitize |
| `files.output` | `output.txt` | Sanitized result |
| `files.injections` | `injections.json` | Cumulative injection log |
| `files.prompt` | `prompt.txt` | Claude system prompt |
| `files.log` | `app.log` | Run log |
| `model` | `claude-sonnet-4-6` | Anthropic model |
| `injections_example_limit` | `40` | Max examples appended to prompt |

## Gitignored runtime files

`input.txt`, `output.txt`, `injections.json`, `app.log`, `.env` are all gitignored — only `config.json`, `prompt.txt`, `parser.py`, `sanitize.py`, and `main.py` are tracked.

## Code standards

### No magic strings or values
All configurable values belong in `config.json`. Constant strings used in code (model names, field names, separators) must be assigned to a named constant at module level rather than inlined. For example:

```python
# bad
response = client.messages.create(model="claude-sonnet-4-6", ...)

# good
MODEL = "claude-sonnet-4-6"  # or read from config
response = client.messages.create(model=MODEL, ...)
```

### Logging
Every module gets its own logger via `logging.getLogger(__name__)` — never use `print`. Log at the appropriate level:

- `log.info` — normal pipeline steps (started, stage complete, chars read, patterns loaded)
- `log.warning` — detected threats, removed injections, unexpected-but-handled situations
- `log.error` — failures that prevent the pipeline from completing

Log messages must include relevant values (counts, file paths, fragment text) so `app.log` is useful without reading the source. The `logging.basicConfig` call lives only in `main.py`; all other modules just acquire a logger and use it.

### Code quality
- Use type annotations on all function signatures.
- Prefer `pathlib.Path` over string paths throughout.
- Keep functions small and single-purpose — orchestration logic belongs in `main.py`, not in `parser.py` or `sanitize.py`.
- `sanitize.py` must remain a pure function module with no side effects beyond returning values; file I/O and injection persistence are handled in `main.py`.
