"""Work out how many years of experience a job posting asks for.

Pure functions, no network. Postings rarely have a structured field for this (Naukri is the
exception), so we read phrases such as "3+ years", "2-5 yrs", "minimum 4 years of experience",
then fall back to "fresher" wording and finally to seniority words in the title.
"""
import re
from typing import NamedTuple


class Experience(NamedTuple):
    lo: int                    # minimum years asked for
    hi: int | None             # maximum years, or None if open-ended ("5+")
    guessed: bool = False      # True when inferred from the job title only


_RANGE = re.compile(r"\b(\d{1,2})\s*(?:-|\u2013|\u2014|to)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b", re.I)
_PLUS = re.compile(r"\b(\d{1,2})\s*\+\s*(?:years?|yrs?)\b", re.I)
_PLAIN = re.compile(r"\b(\d{1,2})\s*(?:years?|yrs?)\b", re.I)
_CONTEXT = re.compile(r"experience|\bexp\b|expertise|background|working", re.I)
_FRESHER = re.compile(r"\b(?:freshers?|entry[- ]level|no (?:prior )?experience (?:is )?(?:required|needed))\b", re.I)
_TITLE_HINTS = (
    (re.compile(r"\b(?:intern|internship|trainee)\b", re.I), Experience(0, 1, True)),
    (re.compile(r"\b(?:junior|jr)\b", re.I), Experience(0, 2, True)),
    (re.compile(r"\b(?:lead|principal|staff|architect|head)\b", re.I), Experience(8, None, True)),
    (re.compile(r"\b(?:senior|sr)\b", re.I), Experience(5, None, True)),
)


def _scan(text: str, need_context: bool = True) -> Experience | None:
    """First plausible 'N years' phrase. In free text it must sit near the word 'experience'."""
    best = None  # (position, Experience)
    for pattern, kind in ((_RANGE, "range"), (_PLUS, "plus"), (_PLAIN, "plain")):
        for m in pattern.finditer(text):
            if need_context and not _CONTEXT.search(text[max(0, m.start() - 50): m.end() + 50]):
                continue
            lo = int(m.group(1))
            hi = int(m.group(2)) if kind == "range" else None
            if (hi is not None and hi < lo) or lo > 40 or (hi is not None and hi > 40):
                continue
            if best is None or m.start() < best[0]:
                best = (m.start(), Experience(lo, hi))
            break
    return best[1] if best else None


def infer_experience(title: str, description: str, exp_text: str = "") -> Experience | None:
    """exp_text is a dedicated field when the site has one (Naukri: '2-5 Yrs')."""
    if exp_text:
        found = _scan(exp_text, need_context=False)
        if found:
            return found
    found = _scan(description or "")
    if found:
        return found
    if _FRESHER.search(f"{title} {description or ''}"):
        return Experience(0, 1)
    for pattern, exp in _TITLE_HINTS:
        if pattern.search(title or ""):
            return exp
    return None


def matches(exp: Experience, want_lo: int, want_hi: int | None) -> bool:
    """Does the job's range overlap the range the user wants? want_hi None means no upper limit."""
    job_hi = float("inf") if exp.hi is None else exp.hi
    sel_hi = float("inf") if want_hi is None else want_hi
    return exp.lo <= sel_hi and job_hi >= want_lo


def describe(exp: Experience | None) -> str:
    if exp is None:
        return "Experience not stated"
    if exp.hi is None:
        span = f"{exp.lo}+ yrs"
    elif exp.hi == exp.lo:
        span = f"{exp.lo} yrs"
    else:
        span = f"{exp.lo}-{exp.hi} yrs"
    return f"Asks for {span}" + (" (guessed from title)" if exp.guessed else "")
