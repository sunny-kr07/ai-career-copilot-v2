import json

import pytest

from core.coach import (
    CoachError,
    build_messages,
    coach_stream,
    format_analysis,
    suggested_questions,
    trim_history,
)
from core.schemas import Analysis


def make_analysis():
    return Analysis.model_validate({
        "score_breakdown": {"required_skills": 70, "experience_level": 80,
                            "domain_relevance": 60, "keywords": 50},
        "matched_skills": [{"skill": "Python", "evidence": "Built APIs"}],
        "missing_skills": [{"skill": "Kubernetes", "importance": "required", "suggestion": "x"},
                           {"skill": "AWS", "importance": "preferred", "suggestion": "y"}],
        "missing_keywords": ["CI/CD"],
        "bullet_fixes": [],
        "summary": "ok",
    })


def turns(n, size=10):
    out = []
    for _ in range(n):
        out += [{"role": "user", "content": "q" * size},
                {"role": "assistant", "content": "a" * size}]
    return out


class _Chunk:
    def __init__(self, text):
        self.content = text


def test_trim_keeps_recent_turns_and_starts_with_user():
    trimmed = trim_history(turns(20), max_turns=3)
    assert len(trimmed) == 6
    assert trimmed[0]["role"] == "user"


def test_trim_respects_character_budget():
    trimmed = trim_history(turns(10, size=1000), max_chars=5000)
    assert sum(len(m["content"]) for m in trimmed) <= 5000
    assert not trimmed or trimmed[0]["role"] == "user"


def test_messages_shape_and_context():
    msgs = build_messages("MY RESUME", "MY JD", make_analysis(), turns(2), "Question?")
    assert msgs[0][0] == "system"
    assert "MY RESUME" in msgs[0][1] and "MY JD" in msgs[0][1] and "Kubernetes" in msgs[0][1]
    assert msgs[-1] == ("human", "Question?")
    assert {role for role, _ in msgs[1:-1]} <= {"human", "ai"}


def test_analysis_is_valid_json_with_score():
    data = json.loads(format_analysis(make_analysis()))
    assert data["overall_score"] == make_analysis().overall_score
    assert data["missing_skills"][0]["skill"] == "Kubernetes"


def test_braces_in_resume_do_not_break_prompt():
    msgs = build_messages("code: {x} and {}", "JD {y}", make_analysis(), [], "Hi")
    assert "code: {x} and {}" in msgs[0][1]


def test_suggested_questions_use_required_gaps_only():
    qs = suggested_questions(make_analysis())
    assert any("Kubernetes" in q for q in qs)
    assert not any("AWS" in q for q in qs)
    assert len(qs) <= 4


def test_stream_retries_then_succeeds(monkeypatch):
    calls = {"n": 0}

    class FakeLLM:
        def stream(self, messages):
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("500 INTERNAL")
            yield _Chunk("Hello")
            yield _Chunk(" world")

    monkeypatch.setattr("core.coach.get_llm", lambda *a, **k: FakeLLM())
    monkeypatch.setattr("core.coach.time.sleep", lambda s: None)
    out = "".join(coach_stream("r", "j", make_analysis(), [], "q"))
    assert out == "Hello world"
    assert calls["n"] == 2


def test_stream_gives_up_with_coach_error(monkeypatch):
    class FakeLLM:
        def stream(self, messages):
            raise RuntimeError("500 INTERNAL")
            yield  # makes this a generator

    monkeypatch.setattr("core.coach.get_llm", lambda *a, **k: FakeLLM())
    monkeypatch.setattr("core.coach.time.sleep", lambda s: None)
    with pytest.raises(CoachError):
        list(coach_stream("r", "j", make_analysis(), [], "q"))