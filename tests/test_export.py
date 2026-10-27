from core.export import build_pdf
from core.schemas import Analysis


def make_analysis(**overrides):
    data = {
        "score_breakdown": {"required_skills": 70, "experience_level": 80,
                            "domain_relevance": 60, "keywords": 50},
        "matched_skills": [{"skill": "Python", "evidence": "Built APIs"}],
        "missing_skills": [],
        "missing_keywords": [],
        "bullet_fixes": [],
        "summary": "ok",
    }
    data.update(overrides)
    return Analysis.model_validate(data)


def test_pdf_is_valid():
    assert build_pdf(make_analysis()).startswith(b"%PDF")


def test_empty_sections_do_not_crash():
    assert build_pdf(make_analysis(matched_skills=[])).startswith(b"%PDF")


def test_markup_and_unicode_do_not_crash():
    a = make_analysis(summary="R&D <b>bold & unclosed \U0001F680 \u2192")
    assert build_pdf(a, job_title="<Engineer> & Co").startswith(b"%PDF")