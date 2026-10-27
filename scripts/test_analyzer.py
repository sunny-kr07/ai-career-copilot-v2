import sys
import time

from core.analyzer import analyze
from core.parsing import extract_text

SAMPLE_RESUME = """Alex Sample. Backend developer, 3 years. Built REST APIs in Python and Flask
serving 50k users. Worked with PostgreSQL and Docker. Wrote unit tests with pytest."""

JD = """Backend Engineer. Required: Python, REST APIs, PostgreSQL, Kubernetes.
Preferred: AWS, CI/CD. 3+ years of experience."""


def main():
    if len(sys.argv) > 1:  # optional: python -m scripts.test_analyzer data/samples/resume.pdf
        path = sys.argv[1]
        with open(path, "rb") as f:
            resume = extract_text(f.read(), path)
    else:
        resume = SAMPLE_RESUME

    start = time.time()
    result = analyze(resume, JD)
    print(f"Done in {time.time() - start:.1f}s")
    print("Overall score:", result.overall_score)
    print("Breakdown:", result.score_breakdown.model_dump())
    print("\nMatched:")
    for s in result.matched_skills:
        found = s.evidence.lower() in resume.lower()
        print(f"  - {s.skill} | evidence in resume: {found}")
    print("\nMissing:")
    for s in result.missing_skills:
        print(f"  - {s.skill} ({s.importance})")
    print("\nBullet fixes:")
    for b in result.bullet_fixes:
        print(f"  - {b.original}\n    -> {b.improved}  [needs input: {b.needs_user_input}]")


if __name__ == "__main__":
    main()