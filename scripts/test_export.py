from pathlib import Path

from core.export import build_pdf
from core.schemas import Analysis

CACHE = Path("data/cache/analysis.json")
OUT = Path("data/output")
OUT.mkdir(parents=True, exist_ok=True)

SAMPLE_LETTER = """Dear Hiring Manager,

This is a sample paragraph used to check how the cover letter page looks in the report.

Sincerely,
Alex Sample"""

# 1. Normal report from the cached analysis
if CACHE.exists():
    analysis = Analysis.model_validate_json(CACHE.read_text())
    pdf = build_pdf(analysis, job_title="Backend Engineer", cover_letter=SAMPLE_LETTER)
    (OUT / "report.pdf").write_bytes(pdf)
    print(f"report.pdf written ({len(pdf) // 1024} KB)")
else:
    print("No cached analysis. Run: python -m scripts.test_generators")

# 2. Stress test: hostile text and very long content
nasty = Analysis.model_validate({
    "score_breakdown": {"required_skills": 20, "experience_level": 40,
                        "domain_relevance": 60, "keywords": 90},
    "matched_skills": [{"skill": "C++ & CI/CD <b>", "evidence": "Built \u201cfast\u201d systems \u2192 50% faster \U0001F680"}],
    "missing_skills": [{"skill": "Kubernetes", "importance": "required", "suggestion": "x " * 400}],
    "missing_keywords": ["R&D", "<script>", "naive\u00e9"],
    "bullet_fixes": [{"original": "y " * 300, "improved": "Cut latency by [add metric: ms] & more",
                      "reason": "Adds scale", "needs_user_input": True}] * 8,
    "summary": "Summary with <tags> & ampersands. " * 10,
})
pdf = build_pdf(nasty, job_title="R&D <Engineer>")
(OUT / "report_stress.pdf").write_bytes(pdf)
print(f"report_stress.pdf written ({len(pdf) // 1024} KB)")