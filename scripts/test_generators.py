import re
import sys
from pathlib import Path

from core.analyzer import analyze
from core.generators import cover_letter, find_violations
from core.parsing import extract_text
from core.schemas import Analysis
from scripts.test_analyzer import SAMPLE_RESUME, JD

CACHE = Path("data/cache/analysis.json")
RISKY = ["extensive", "proven", "seamless", "robust", "scalable", "high-traffic",
         "expert", "mastering", "passionate", "cutting-edge", "world-class", "track record"]


def norm(text: str) -> str:
    text = text.lower().replace(",", "")
    return re.sub(r"(\d+)k\b", lambda m: str(int(m.group(1)) * 1000), text)


def numbers(text: str) -> set[str]:
    return set(re.findall(r"\d+(?:\.\d+)?", norm(text)))


if len(sys.argv) > 1:  # python -m scripts.test_generators path/to/resume.pdf
    path = sys.argv[1]
    resume = extract_text(Path(path).read_bytes(), path)
    analysis = analyze(resume, JD)
    print("Analysis created (not cached)")
else:
    resume = SAMPLE_RESUME
    if CACHE.exists():
        analysis = Analysis.model_validate_json(CACHE.read_text())
        print("Loaded cached analysis")
    else:
        analysis = analyze(resume, JD)
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(analysis.model_dump_json(indent=2))
        print("Analysis created and cached")

letter = cover_letter(resume, JD, analysis)
print("\n" + letter)

words = len(letter.split())
new_numbers = sorted(numbers(letter) - numbers(resume + " " + JD))
risky = [w for w in RISKY if w in letter.lower()]

print("\n--- Checks")
print(f"Word count: {words}" + ("" if 150 <= words <= 350 else "  (outside 150-350)"))
print("Numbers not in resume/JD:", new_numbers or "none")
print("Risky overclaiming words:", risky or "none")
print("Gap-pointing wording:", find_violations(letter) or "none")