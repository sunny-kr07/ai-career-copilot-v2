"""HTTP API for the React front end.  Run from the project root:

    uvicorn api.server:app --reload --port 8000

This file is a thin adapter. All analysis, job search, letter, coaching and PDF logic still
lives in `core/` and is called exactly as the Streamlit app calls it.
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, File, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse, Response, StreamingResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from app.ui_helpers import friendly_error, posted_label, safe_filename, verdict  # noqa: E402
from core import config  # noqa: E402
from core.analyzer import analyze  # noqa: E402
from core.coach import CoachError, coach_stream, suggested_questions  # noqa: E402
from core.experience import describe, infer_experience  # noqa: E402
from core.export import build_pdf  # noqa: E402
from core.generators import cover_letter, find_violations  # noqa: E402
from core.jobs import (  # noqa: E402
    JOBSPY_SITES, MAX_QUERIES, JobFetchError, dedupe, fetch_adzuna, fetch_jobspy, fetch_remote,
    filter_experience, filter_recent, split_queries,
)
from core.matcher import rank_jobs  # noqa: E402
from core.parsing import ParseError, extract_text  # noqa: E402
from core.roles import suggest_roles  # noqa: E402
from core.schemas import SCORE_WEIGHTS, Analysis  # noqa: E402

MIN_JD_CHARS = 100
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
EXP_MAX = 15

app = FastAPI(title="AI Career Copilot API", docs_url="/api/docs", openapi_url="/api/openapi.json")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


_SECRET_ENV = ("GOOGLE_API_KEY", "GEMINI_API_KEY", "ADZUNA_APP_KEY", "ADZUNA_APP_ID", "JOBSPY_PROXIES")
_SECRET_PATTERNS = (
    re.compile(r"AIza[0-9A-Za-z_\-]{20,}"),                    # Google API keys
    re.compile(r"(?i)([?&](?:key|api_key|app_key)=)[^&\s\"']+"),  # keys in URLs
    re.compile(r"://[^/@\s:]+:[^/@\s]+@"),                     # user:pass@ in URLs / proxies
)


def redact(text: str) -> str:
    """Strip API keys and proxy credentials from text before it is sent to the browser or logged."""
    text = str(text)
    for name in _SECRET_ENV:
        for value in filter(None, (v.strip() for v in os.getenv(name, "").split(","))):
            if len(value) >= 6:
                text = text.replace(value, "[redacted]")
    text = _SECRET_PATTERNS[0].sub("[redacted]", text)
    text = _SECRET_PATTERNS[1].sub(r"\1[redacted]", text)
    return _SECRET_PATTERNS[2].sub("://[redacted]@", text)


@app.exception_handler(Exception)
async def unexpected_error(request, exc: Exception):
    """Never leak a bare 'Internal Server Error': the UI relies on JSON to tell API errors from a missing server."""
    import logging
    logging.getLogger("uvicorn.error").exception("Unhandled error on %s", request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": {"message": friendly_error(exc), "technical": redact(exc)[:300]}})


def limit() -> int:
    return getattr(config, "MAX_INPUT_CHARS", 30_000)


def fail(error: Exception, status: int = 502) -> HTTPException:
    return HTTPException(status_code=status, detail={"message": friendly_error(error), "technical": redact(error)})


def analysis_payload(a: Analysis) -> dict:
    data = a.model_dump()
    data["overall_score"] = a.overall_score
    data["verdict"] = verdict(a.overall_score)
    data["weights"] = {k: round(w * 100) for k, w in SCORE_WEIGHTS.items()}
    return data


def to_analysis(raw: dict) -> Analysis:
    try:
        return Analysis.model_validate(raw)
    except Exception as e:
        raise HTTPException(status_code=422, detail={"message": "The saved analysis is invalid. Please run it again."}) from e


# ------------------------------------------------------------------ schemas

class AnalyzeIn(BaseModel):
    resume: str
    jd: str


class LetterIn(AnalyzeIn):
    analysis: dict
    tone: str = "confident"


class CoachIn(AnalyzeIn):
    analysis: dict
    history: list[dict] = Field(default_factory=list)
    question: str


class RolesIn(BaseModel):
    resume: str


class JobsIn(BaseModel):
    resume: str
    query: str
    mode: str = "jobsites"          # jobsites | remote | adzuna
    where: str = ""
    sites: list[str] = Field(default_factory=lambda: ["Naukri", "Indeed"])
    fetch_description: bool = True
    days: int = 7
    exp_lo: int = 0
    exp_hi: int = EXP_MAX
    exp_strict: bool = False
    use_ai: bool = True


class ReportIn(BaseModel):
    analysis: dict
    job_title: str = ""
    cover_letter: str = ""


# ------------------------------------------------------------------- routes

@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "api_key": bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")),
        "model": config.MODEL,
        "adzuna": bool(config.ADZUNA_APP_ID and config.ADZUNA_APP_KEY),
        "sites": list(JOBSPY_SITES),
        "min_jd_chars": MIN_JD_CHARS,
        "max_input_chars": limit(),
        "max_queries": MAX_QUERIES,
    }


@app.post("/api/parse")
async def parse_resume(file: UploadFile = File(...)) -> dict:
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, detail={"message": "That file is larger than 10 MB."})
    try:
        text = extract_text(data, file.filename or "")
    except ParseError as e:
        raise HTTPException(422, detail={"message": str(e)}) from e
    except Exception as e:
        raise HTTPException(422, detail={"message": "That file could not be read. Try another PDF or DOCX."}) from e
    return {"text": text, "name": file.filename, "words": len(text.split()), "truncated": len(text) > limit()}


@app.post("/api/analyze")
def run_analysis(body: AnalyzeIn) -> dict:
    jd = body.jd.strip()
    if len(jd) < MIN_JD_CHARS:
        raise HTTPException(422, detail={"message": f"Paste the full job description (at least {MIN_JD_CHARS} characters)."})
    try:
        result = analyze(body.resume[:limit()], jd[:limit()])
    except Exception as e:
        raise fail(e)
    return analysis_payload(result)


@app.post("/api/letter")
def run_letter(body: LetterIn) -> dict:
    a = to_analysis(body.analysis)
    try:
        text = cover_letter(body.resume[:limit()], body.jd.strip()[:limit()], a, tone=body.tone.lower())
    except Exception as e:
        raise fail(e)
    return {"text": text, "flagged": find_violations(text)}


@app.post("/api/letter/check")
def check_letter(body: dict) -> dict:
    return {"flagged": find_violations(str(body.get("text", "")))}


@app.post("/api/coach/suggestions")
def coach_suggestions(body: dict) -> dict:
    return {"questions": suggested_questions(to_analysis(body.get("analysis", {})))}


@app.post("/api/coach")
def coach(body: CoachIn):
    a = to_analysis(body.analysis)
    stream = coach_stream(body.resume[:limit()], body.jd.strip()[:limit()], a, body.history, body.question)
    try:
        first = next(stream)  # surface errors as a normal HTTP error before streaming starts
    except StopIteration:
        first = ""
    except CoachError as e:
        raise HTTPException(502, detail={"message": str(e)}) from e
    except Exception as e:
        raise fail(e)

    def chunks():
        yield first
        try:
            for piece in stream:
                yield piece
        except Exception:
            yield "\n\n[The reply was cut off. Please ask again.]"

    return StreamingResponse(chunks(), media_type="text/plain; charset=utf-8", headers={"Cache-Control": "no-store"})


@app.post("/api/roles")
def roles(body: RolesIn) -> dict:
    try:
        found = suggest_roles(body.resume[:limit()])
    except Exception as e:
        raise fail(e)
    if not found:
        raise HTTPException(502, detail={"message": "No roles could be suggested. Type a role yourself."})
    return {"roles": found}


def job_payload(job) -> dict:
    return {
        "title": job.title, "company": job.company, "location": job.location,
        "description": job.description, "url": job.url, "source": job.source,
        "posted": job.posted.isoformat() if job.posted else None,
        "posted_label": posted_label(job.posted),
        "experience": describe(infer_experience(job.title, job.description, job.exp_text)),
        "score": job.score, "ai_scored": job.ai_scored, "reason": job.reason,
    }


@app.post("/api/jobs")
def search_jobs(body: JobsIn) -> dict:
    """Same pipeline as run_job_search() in the Streamlit app."""
    queries = split_queries(body.query)
    if not queries:
        raise HTTPException(422, detail={"message": "Add at least one role or keyword."})
    if body.mode == "jobsites" and not body.sites:
        raise HTTPException(422, detail={"message": "Pick at least one job site."})

    many = len(queries) > 1
    per_query = 10 if many else 15
    found, notes = [], []
    for q in queries:
        try:
            if body.mode == "jobsites":
                jobs, n = fetch_jobspy(q, body.where.strip(), body.sites, results=per_query,
                                       fetch_description=body.fetch_description, max_days=body.days)
            elif body.mode == "remote":
                jobs, n = fetch_remote(q)
            elif body.mode == "adzuna":
                jobs, n = fetch_adzuna(q, body.where.strip(), max_days=body.days), []
            else:
                raise HTTPException(422, detail={"message": "Unknown job source."})
        except JobFetchError as e:
            jobs, n = [], [redact(e)]
        found += jobs
        notes += [(f'"{q}": ' if many else "") + x for x in n]

    found, too_old, undated = filter_recent(dedupe(found), body.days)
    if too_old:
        notes.append(f"Hid {too_old} posting(s) older than {body.days} days.")
    if undated:
        notes.append(f"{undated} posting(s) don't show a date, so they are included. "
                     "Check how old they are before applying.")

    lo, hi = body.exp_lo, body.exp_hi
    want_hi = None if hi >= EXP_MAX else hi
    if (lo, want_hi) != (0, None):
        found, off_target, unstated = filter_experience(found, lo, want_hi, strict=body.exp_strict)
        span = f"{lo}+" if want_hi is None else f"{lo} to {want_hi}"
        if off_target:
            notes.append(f"Hid {off_target} posting(s) that don't match {span} years of experience.")
        if unstated:
            notes.append(f"{unstated} posting(s) don't state the experience they want, so they are included.")

    notes = list(dict.fromkeys(notes))
    ranked = []
    if found:
        try:
            ranked, note = rank_jobs(body.resume[:limit()], found, use_ai=body.use_ai)
        except Exception as e:
            raise fail(e)
        if note:
            notes.append(note)
    return {"jobs": [job_payload(j) for j in ranked[:25]], "total": len(ranked), "notes": notes}


@app.post("/api/report")
def report(body: ReportIn) -> Response:
    a = to_analysis(body.analysis)
    try:
        pdf = build_pdf(a, job_title=body.job_title.strip(), cover_letter=body.cover_letter)
    except Exception as e:
        raise HTTPException(500, detail={"message": "The report could not be built. Please try again."}) from e
    name = safe_filename(body.job_title, "resume-audit")
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="resume-audit-{name}.pdf"'})
