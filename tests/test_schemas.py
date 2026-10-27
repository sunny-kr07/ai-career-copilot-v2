import pytest
from pydantic import ValidationError

from core.schemas import Analysis, ScoreBreakdown, SCORE_WEIGHTS


def test_weights_sum_to_one():
    assert abs(sum(SCORE_WEIGHTS.values()) - 1.0) < 1e-9


def test_overall_math():
    sb = ScoreBreakdown(required_skills=80, experience_level=60,
                        domain_relevance=50, keywords=40)
    # 80*.4 + 60*.25 + 50*.2 + 40*.15 = 32 + 15 + 10 + 6 = 63
    assert sb.overall() == 63


def test_rejects_out_of_range():
    with pytest.raises(ValidationError):
        ScoreBreakdown(required_skills=120, experience_level=0,
                       domain_relevance=0, keywords=0)


def test_analysis_builds_and_scores():
    a = Analysis(
        score_breakdown=dict(required_skills=100, experience_level=100,
                             domain_relevance=100, keywords=100),
        matched_skills=[dict(skill="Python", evidence="Built APIs in Python")],
        missing_skills=[dict(skill="Kubernetes", importance="required",
                             suggestion="Complete a small K8s deployment project")],
        missing_keywords=["CI/CD"],
        bullet_fixes=[dict(original="Worked on APIs", improved="Built [X] REST APIs",
                           reason="Adds scale", needs_user_input=True)],
        summary="Strong fit with one gap.",
    )
    assert a.overall_score == 100