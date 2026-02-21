#!/usr/bin/env python3
import json
import logging
import anthropic
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from parser import PromptInjectionDetector
from sanitize import sanitize

CONFIG_FILE = Path("config.json")


def load_config() -> dict:
    return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))


def setup_logging(log_file: str) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        handlers=[logging.FileHandler(log_file, encoding="utf-8")],
    )


def load_injections(path: Path) -> list[str]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save_injections(path: Path, known: list[str], new: list[str]) -> None:
    seen = set(known)
    combined = known + [i for i in new if i not in seen]
    path.write_text(json.dumps(combined, indent=2, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    config = load_config()
    files  = config["files"]

    setup_logging(files["log"])
    log = logging.getLogger(__name__)
    log.info("Pipeline started")

    input_path      = Path(files["input"])
    output_path     = Path(files["output"])
    injections_path = Path(files["injections"])
    prompt_file     = Path(files["prompt"])

    # ── Stage 1: read input ──────────────────────────────────────────────────
    text = input_path.read_text(encoding="utf-8")
    log.info("Read %d chars from %s", len(text), input_path)

    # ── Stage 2: rule-based parser ───────────────────────────────────────────
    detector = PromptInjectionDetector()

    if detector.detect_threats(text):
        log.warning("Rule-based parser flagged threats in input")

    parsed = detector.sanitize_input(text, str, default_value=text)
    log.info("Parser stage complete")

    # ── Stage 3: AI sanitizer ────────────────────────────────────────────────
    known = load_injections(injections_path)
    log.info("Loaded %d known injection pattern(s)", len(known))

    sanitized, found = sanitize(
        text=parsed,
        client=anthropic.Anthropic(),
        known=known,
        prompt_file=prompt_file,
        model=config["model"],
        max_tokens=config["max_tokens"],
        injections_example_limit=config["injections_example_limit"],
    )

    if found:
        for fragment in found:
            log.warning("Injection removed: %s", fragment)
        save_injections(injections_path, known, found)
        log.info("Injections log updated (%d new pattern(s))", len(found))
    else:
        log.info("No injections found")

    # ── Stage 4: write output ────────────────────────────────────────────────
    output_path.write_text(sanitized, encoding="utf-8")
    log.info("Output written to %s", output_path)
    log.info("Pipeline complete")


if __name__ == "__main__":
    main()
