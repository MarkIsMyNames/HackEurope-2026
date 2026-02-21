import json
import logging
import re
import anthropic
from anthropic.types import MessageParam
from pathlib import Path

log = logging.getLogger(__name__)


def _build_system_prompt(prompt_file: Path, known: list[str], limit: int) -> str:
    base = prompt_file.read_text(encoding="utf-8")
    if not known:
        return base
    examples = "\n".join(f'  • "{i}"' for i in known[-limit:])
    return (
        base.rstrip()
        + f"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREVIOUSLY SEEN INJECTIONS  (real examples logged from past runs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Be especially alert for these patterns and close variants:

{examples}"""
    )


def sanitize(
    text: str,
    client: anthropic.Anthropic,
    known: list[str],
    prompt_file: Path,
    model: str,
    max_tokens: int,
    injections_example_limit: int,
) -> tuple[str, list[str]]:
    system = _build_system_prompt(prompt_file, known, injections_example_limit)
    messages: list[MessageParam] = [{"role": "user", "content": f"Analyse and sanitise:\n\n{text}"}]

    log.info("Sending request to Claude (%s)", model)
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )

    raw = response.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw).strip()
    try:
        result = json.loads(raw)
        injections = [str(i) for i in result.get("injections", []) if str(i).strip()]
        log.info("Claude returned %d injection(s)", len(injections))
        return result.get("sanitized", text), injections
    except json.JSONDecodeError:
        log.warning("Claude response was not valid JSON — using raw response as sanitized text")
        return raw, []
