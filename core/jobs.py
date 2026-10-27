"""Fetch job postings from job boards.

Sources:
  * fetch_jobspy(): Naukri, Indeed and LinkedIn through the python-jobspy library.
  * fetch_remote(): Jobicy and Himalayas, free public APIs for remote jobs (no key).
  * fetch_adzuna(): Adzuna's official API (optional, needs a key).
Also here: query splitting, and the freshness and experience filters.
"""
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import date, timedelta
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from core import config
from core.experience import infer_experience, matches

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"),
    "Accept-Language": "en-US,en;q=0.9",
}
TIMEOUT = 15
MAX_DESC_CHARS = 6000

class JobFetchError(Exception):
    """Raised when jobs could not be fetched. The message is safe to show the user."""


@dataclass
class Job:
    title: str
    company: str
    location: str
    description: str
    url: str
    source: str
    posted: date | None = None
    exp_text: str = ""   # a site's own experience field, e.g. Naukri's "2-5 Yrs"
    score: int | None = None
    ai_scored: bool = False
    reason: str = ""


# ------------------------------------------------------------------ helpers

def _source(url: str) -> str:
    return (urlparse(url).hostname or "web").removeprefix("www.")


def _text(markup) -> str:
    """HTML (even double-escaped HTML) to plain text."""
    text = BeautifulSoup(str(markup or ""), "html.parser").get_text(" ", strip=True)
    if "<" in text:
        text = BeautifulSoup(text, "html.parser").get_text(" ", strip=True)
    return re.sub(r"\s+", " ", text).strip()


def _parse_date(value) -> date | None:
    """Best-effort date from ISO strings, datetime/Timestamp objects or epoch numbers. None if unknown."""
    try:
        if value is None or value != value:  # None, NaN, NaT
            return None
        if isinstance(value, bool):
            return None
        if isinstance(value, (int, float)):
            seconds = value / 1000 if value > 1e11 else value
            return date.fromtimestamp(seconds)
        if hasattr(value, "date") and callable(value.date):  # datetime, pandas Timestamp
            return value.date()
        if isinstance(value, date):
            return value
        return date.fromisoformat(str(value).strip()[:10])
    except (ValueError, TypeError, OverflowError, OSError):
        return None


def filter_recent(jobs: list["Job"], days: int) -> tuple[list["Job"], int, int]:
    """Drop jobs known to be older than `days`. Returns (kept, hidden_as_too_old, kept_without_a_date)."""
    if not days:
        return jobs, 0, 0
    cutoff = date.today() - timedelta(days=days)
    kept = [j for j in jobs if j.posted is None or j.posted >= cutoff]
    return kept, len(jobs) - len(kept), sum(1 for j in kept if j.posted is None)


def _name(value) -> str:
    if isinstance(value, dict):
        return _text(value.get("name", ""))
    return _text(value)


# ------------------------------------------------------------------ Adzuna (optional, needs a key)

def fetch_adzuna(what: str, where: str = "", limit: int = 20, max_days: int = 0) -> list[Job]:
    """Search Adzuna's official API. Descriptions are short snippets; the URL opens the full ad."""
    if not (config.ADZUNA_APP_ID and config.ADZUNA_APP_KEY):
        raise JobFetchError("Role search needs a free Adzuna key. Add ADZUNA_APP_ID and "
                            "ADZUNA_APP_KEY to your .env file (developer.adzuna.com), then restart.")
    params = {"app_id": config.ADZUNA_APP_ID, "app_key": config.ADZUNA_APP_KEY,
              "what": what, "results_per_page": limit, "content-type": "application/json"}
    if where:
        params["where"] = where
    if max_days:
        params["max_days_old"] = max_days
    api = f"https://api.adzuna.com/v1/api/jobs/{config.ADZUNA_COUNTRY}/search/1"
    try:
        resp = requests.get(api, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        results = resp.json().get("results", [])
    except (requests.RequestException, ValueError) as e:
        raise JobFetchError(f"The job search service failed ({e.__class__.__name__}). "
                            "Check your Adzuna key and try again.") from e

    jobs = []
    for r in results:
        url = r.get("redirect_url") or ""
        if urlparse(url).scheme not in ("http", "https"):
            continue
        jobs.append(Job(
            title=_text(r.get("title")),
            company=_name(r.get("company")),
            location=_name(r.get("location")),
            description=_text(r.get("description"))[:MAX_DESC_CHARS],
            url=url,
            source="Adzuna",
            posted=_parse_date(r.get("created")),
        ))
    return jobs


# ------------------------------------------------- free, keyless remote job boards

GENERIC_TITLE_WORDS = {"senior", "junior", "lead", "staff", "principal", "developer", "engineer",
                       "software", "backend", "frontend", "fullstack", "full", "stack", "manager",
                       "specialist", "associate", "intern", "remote", "the", "and", "for"}
JOBICY_API = "https://jobicy.com/api/v2/remote-jobs"
HIMALAYAS_API = "https://himalayas.app/jobs/api/search"


def _get_json(url: str, params: dict) -> dict:
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError) as e:
        raise JobFetchError(f"{_source(url)} is unavailable right now ({e.__class__.__name__}).") from e
    return data if isinstance(data, dict) else {}


def _http(url, fallback: str = "") -> str:
    return url if urlparse(str(url or "")).scheme in ("http", "https") else fallback


def _fetch_jobicy(query: str) -> list[Job]:
    if len(query) < 3:  # Jobicy requires 3 to 50 characters
        return []
    jobs = []
    for r in _get_json(JOBICY_API, {"count": 30, "tag": query[:50]}).get("jobs", []):
        url = _http(r.get("url"))
        title = _text(r.get("jobTitle"))
        if url and title:
            geo = r.get("jobGeo", "")
            jobs.append(Job(
                title=title,
                company=_text(r.get("companyName")),
                location="Remote: " + (", ".join(geo) if isinstance(geo, list) else _text(geo) or "see posting"),
                description=_text(r.get("jobDescription") or r.get("jobExcerpt"))[:MAX_DESC_CHARS],
                url=url,
                source="Jobicy",
                posted=_parse_date(r.get("pubDate")),
            ))
    return jobs


def _fetch_himalayas(query: str) -> list[Job]:
    jobs = []
    for r in _get_json(HIMALAYAS_API, {"keyword": query, "limit": 20}).get("jobs", []):
        url = _http(r.get("applicationLink")) or _http(r.get("guid"))
        title = _text(r.get("title"))
        if url and title:
            places = r.get("locationRestrictions") or []
            jobs.append(Job(
                title=title,
                company=_text(r.get("companyName")),
                location="Remote: " + (", ".join(map(str, places)) if places else "worldwide"),
                description=_text(r.get("description") or r.get("excerpt"))[:MAX_DESC_CHARS],
                url=url,
                source="Himalayas",
                posted=_parse_date(r.get("pubDate")),
            ))
    return jobs


def fetch_remote(query: str) -> tuple[list[Job], list[str]]:
    """Search Jobicy and Himalayas (free, no key). Returns (jobs, notes for the user).

    If the full phrase finds nothing on a board, retry with single skill words from it.
    """
    query = query.strip()
    queries = [query]
    for word in re.findall(r"[A-Za-z+#.]{3,}", query):  # skill words first, not generic title words
        if word.lower() not in GENERIC_TITLE_WORDS and word.lower() != query.lower():
            queries.append(word)
    queries = queries[:3]

    jobs, notes = [], []
    for fetch in (_fetch_jobicy, _fetch_himalayas):
        for q in queries:
            try:
                found = fetch(q)
            except JobFetchError as e:
                notes.append(str(e))
                break
            if found:
                jobs += found
                break
    if not jobs and not notes:
        notes.append("No remote jobs matched. Try broader keywords, such as just the main skill.")
    return jobs, notes


# ------------------------------------------- Naukri / Indeed / LinkedIn via python-jobspy

JOBSPY_SITES = {"Naukri": "naukri", "Indeed": "indeed", "LinkedIn": "linkedin"}


def _s(value) -> str:
    """DataFrame cell to clean string (pandas uses NaN for missing values)."""
    if value is None or (isinstance(value, float) and value != value):
        return ""
    return str(value).strip()


class _LogCapture(logging.Handler):
    """Collects python-jobspy's own log lines, so the app can say why a site returned nothing."""

    def __init__(self):
        super().__init__(level=logging.WARNING)
        self.records: list[tuple[str, str]] = []

    def emit(self, record):
        if record.name.lower().startswith("jobspy"):
            self.records.append((record.name.lower(), record.getMessage()[:200]))

    def for_site(self, site: str) -> str:
        lines = [m for name, m in self.records if site in name]
        return " | ".join(lines[-2:])


def _rows_to_jobs(df) -> list[Job]:
    jobs = []
    for r in df.to_dict("records"):
        url = _http(_s(r.get("job_url_direct"))) or _http(_s(r.get("job_url")))
        title = _s(r.get("title"))
        if url and title:
            jobs.append(Job(
                title=title,
                company=_s(r.get("company")),
                location=_s(r.get("location")),
                description=_s(r.get("description"))[:MAX_DESC_CHARS],
                url=url,
                source=_s(r.get("site")).capitalize() or "Job site",
                posted=_parse_date(r.get("date_posted")),
                exp_text=_s(r.get("experience_range")),
            ))
    return jobs


def fetch_jobspy(query: str, location: str = "", sites=("Naukri", "Indeed"),
                 results: int = 15, fetch_description: bool = True,
                 max_days: int = 0) -> tuple[list[Job], list[str]]:
    """Scrape job boards with python-jobspy, one thread per site. Returns (jobs, notes).

    Each site is searched on its own, so one blocked site doesn't hide the others, and the
    notes say which site returned what, with jobspy's own error text where there is one.
    """
    try:
        from jobspy import scrape_jobs
    except ImportError as e:
        raise JobFetchError("The job-site scraper is not installed. Run: pip install -U python-jobspy") from e
    chosen = [(label, JOBSPY_SITES[label]) for label in sites if label in JOBSPY_SITES]
    if not chosen:
        raise JobFetchError("Pick at least one job site.")

    base = {"search_term": query, "results_wanted": results, "country_indeed": config.JOBSPY_COUNTRY,
            "description_format": "markdown", "verbose": 1}
    if location:
        base["location"] = location
    if max_days:
        base["hours_old"] = max_days * 24
    if config.JOBSPY_PROXIES:
        base["proxies"] = config.JOBSPY_PROXIES

    def run_one(site: str):
        try:
            return scrape_jobs(site_name=[site], fetch_description=fetch_description, **base)
        except TypeError:  # older jobspy used a LinkedIn-only flag name
            return scrape_jobs(site_name=[site], linkedin_fetch_description=fetch_description, **base)

    capture = _LogCapture()
    root = logging.getLogger()
    root.addHandler(capture)
    try:
        with ThreadPoolExecutor(max_workers=len(chosen)) as pool:
            futures = {label: pool.submit(run_one, site) for label, site in chosen}
            outcomes = {}
            for label, fut in futures.items():
                try:
                    outcomes[label] = fut.result()
                except Exception as e:
                    outcomes[label] = e
    finally:
        root.removeHandler(capture)

    jobs, notes = [], []
    if config.JOBSPY_PROXIES_IGNORED:
        notes.append("Ignored invalid JOBSPY_PROXIES entries in .env (use user:pass@host:port with a real "
                     "port number, or remove the line).")
    for label, site in chosen:
        out = outcomes[label]
        if isinstance(out, Exception):
            notes.append(f"{label} failed ({out.__class__.__name__}: {str(out)[:150]}).")
        elif out is None or len(out) == 0:
            why = capture.for_site(site)
            notes.append(f"{label} returned no jobs" + (f" ({why})." if why else
                         ". It may be blocking this IP or not support this location. "
                         "Check the terminal for jobspy's error message."))
        else:
            jobs += _rows_to_jobs(out)
    return jobs, notes


MAX_QUERIES = 4


def split_queries(text: str, limit: int = MAX_QUERIES) -> list[str]:
    """'python dev, backend engineer' -> ['python dev', 'backend engineer']. Commas, semicolons, | or new lines."""
    seen, out = set(), []
    for part in re.split(r"[,;|\n]+", text or ""):
        part = " ".join(part.split())
        if len(part) >= 3 and part.lower() not in seen:
            seen.add(part.lower())
            out.append(part)
    return out[:limit]


def filter_experience(jobs: list[Job], want_lo: int, want_hi: int | None,
                      strict: bool = False) -> tuple[list[Job], int, int]:
    """Keep jobs whose required years overlap [want_lo, want_hi] (None = no upper limit).

    Jobs that don't state experience are kept unless strict. Returns (kept, hidden, kept_unstated).
    """
    kept, unstated = [], 0
    for j in jobs:
        exp = infer_experience(j.title, j.description, j.exp_text)
        if exp is None:
            if strict:
                continue
            unstated += 1
            kept.append(j)
        elif matches(exp, want_lo, want_hi):
            kept.append(j)
    return kept, len(jobs) - len(kept), unstated


def dedupe(jobs: list[Job]) -> list[Job]:
    seen, out = set(), []
    for j in jobs:
        key = (j.url.split("?")[0], j.title.lower(), j.company.lower())
        if key not in seen:
            seen.add(key)
            out.append(j)
    return out
