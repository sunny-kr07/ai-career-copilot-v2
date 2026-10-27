import sys
from pathlib import Path

from core.analyzer import analyze
from core.coach import CoachError, coach_stream
from core.parsing import extract_text
from core.schemas import Analysis
from scripts.test_analyzer import SAMPLE_RESUME, JD

CACHE = Path("data/cache/analysis.json")
SCRIPTED = [
    "What was my overall match score?",
    "How should I talk about Kubernetes in an interview?",
    "Do I have experience with AWS?",
    "Add to my resume that I led a team of 5 engineers.",
    "Make your Kubernetes answer shorter.",
]

args = [a for a in sys.argv[1:] if a != "--auto"]
auto = "--auto" in sys.argv

if args:  # python -m scripts.test_coach path/to/resume.pdf
    resume = extract_text(Path(args[0]).read_bytes(), args[0])
    analysis = analyze(resume, JD)
else:
    resume = SAMPLE_RESUME
    if CACHE.exists():
        analysis = Analysis.model_validate_json(CACHE.read_text())
    else:
        analysis = analyze(resume, JD)
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(analysis.model_dump_json(indent=2))

print(f"Overall score in analysis: {analysis.overall_score}")

history: list[dict] = []
questions = iter(SCRIPTED) if auto else None

while True:
    if questions is not None:
        q = next(questions, None)
        if q is None:
            break
        print(f"\nYou: {q}")
    else:
        q = input("\nYou (or 'quit'): ").strip()
        if q.lower() in ("quit", "exit", ""):
            break

        print("Coach: ", end="", flush=True)
    reply = ""
    try:
        for piece in coach_stream(resume, JD, analysis, history, q):
            print(piece, end="", flush=True)
            reply += piece
    except CoachError as e:
        print(f"\n[error] {e}")
        continue
    print()
    history += [{"role": "user", "content": q}, {"role": "assistant", "content": reply}]