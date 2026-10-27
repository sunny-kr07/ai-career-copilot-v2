"""AI Career Copilot - Streamlit UI.  Run from the project root:  streamlit run app/main.py"""
import hashlib
import os
import sys
import time
from pathlib import Path

# Make `core` and `app` importable no matter where Streamlit is started from.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import streamlit as st  # noqa: E402

from app import ui_helpers as ui  # noqa: E402
from app.styles import CSS  # noqa: E402
from core import config  # noqa: E402
from core.analyzer import analyze  # noqa: E402
from core.coach import CoachError, coach_stream, suggested_questions  # noqa: E402
from core.export import build_pdf  # noqa: E402
from core.generators import cover_letter, find_violations  # noqa: E402
from core.jobs import (  # noqa: E402
    JOBSPY_SITES, MAX_QUERIES, JobFetchError, dedupe, fetch_adzuna, fetch_jobspy, fetch_remote,
    filter_experience, filter_recent, split_queries,
)
from core.matcher import rank_jobs  # noqa: E402
from core.roles import suggest_roles  # noqa: E402
from core.parsing import ParseError, extract_text  # noqa: E402
from core.schemas import SCORE_WEIGHTS  # noqa: E402

st.set_page_config(page_title="AI Career Copilot", page_icon="🧭", layout="wide",
                   initial_sidebar_state="expanded")

S = st.session_state
MIN_JD_CHARS = 100
SCORE_LABELS = {
    "required_skills": "Required skills",
    "experience_level": "Experience level",
    "domain_relevance": "Domain relevance",
    "keywords": "Keywords",
}
TONES = ["Confident", "Warm", "Formal"]
JOBSITES_MODE = "Naukri / Indeed / LinkedIn"
REMOTE_MODE = "Remote job boards (free)"
ADZUNA_MODE = "Adzuna (any location)"
EXP_MAX = 15  # top of the experience slider; 15 means 15 or more years


# ----------------------------------------------------------------------- state

def init_state() -> None:
    defaults = {
        "resume_text": None, "resume_name": None, "resume_source": None, "resume_sig": None,
        "parse_error": None, "job_title": "", "jd": "",
        "analysis": None, "analysis_key": None, "analysis_secs": None, "analysis_error": None,
        "letter_text": "", "letter_error": None, "letter_tone": TONES[0], "include_letter": False,
        "chat": [], "pending_q": None, "last_failed_q": None, "upload_nonce": 0,
        "jobs": [], "jobs_notes": [], "jobs_flash": None, "jobs_query": "", "jobs_where": "",
        "jobs_mode": JOBSITES_MODE, "jobs_ai": True,
        "jobs_exp": (0, EXP_MAX), "jobs_exp_strict": False,
        "role_suggestions": [], "roles_error": None, "jobs_sites": ["Naukri", "Indeed"], "jobs_desc": True,
        "jobs_days": 7,
    }
    for key, value in defaults.items():
        S.setdefault(key, list(value) if isinstance(value, list) else value)


def reset_all() -> None:
    nonce = S.get("upload_nonce", 0) + 1
    for key in list(S.keys()):
        del S[key]
    init_state()
    S.upload_nonce = nonce  # new key makes the file uploader forget its file


def ask(question: str) -> None:
    S.pending_q = question


def clear_chat() -> None:
    S.chat = []
    S.last_failed_q = None


def api_key_present() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))


def inputs_key() -> str:
    raw = f"{S.resume_text or ''}\x00{(S.jd or '').strip()}"
    return hashlib.sha1(raw.encode("utf-8", "ignore")).hexdigest()


def jd_ready() -> bool:
    return len((S.jd or "").strip()) >= MIN_JD_CHARS


def input_limit() -> int:
    return getattr(config, "MAX_INPUT_CHARS", 30_000)


# --------------------------------------------------------------------- sidebar

def render_sidebar() -> None:
    with st.sidebar:
        st.markdown('<div class="brand"><span class="brand-mark"></span>AI Career Copilot</div>'
                    '<div class="brand-sub">Analyze &rarr; Improve &rarr; Apply &rarr; Prepare</div>',
                    unsafe_allow_html=True)
        st.markdown(ui.steps([
            ("Resume added", bool(S.resume_text)),
            ("Job description added", jd_ready()),
            ("Job search", bool(S.jobs)),
            ("Fit analysis", S.analysis is not None),
            ("Cover letter", bool(S.letter_text)),
            ("Coaching chat", bool(S.chat)),
        ]), unsafe_allow_html=True)
        st.write("")
        st.button("Clear session", on_click=reset_all, key="btn_clear",
                  help="Removes your resume, job description and all results from this session.")
        st.divider()
        if api_key_present():
            st.caption(f"Model: `{config.MODEL}`")
        else:
            st.error("No API key found. Add GOOGLE_API_KEY to your .env file, then restart the app.")
        st.caption("Privacy: your resume text is sent to Google's Gemini API to generate results. "
                   "Nothing is saved to disk, and it is cleared when you press Clear session or close the tab.")


# ---------------------------------------------------------------------- inputs

def handle_upload(upload) -> None:
    if upload is not None:
        sig = (upload.name, upload.size)
        if S.resume_sig == sig:
            return
        S.resume_sig = sig
        try:
            S.resume_text = extract_text(upload.getvalue(), upload.name)
            S.resume_name, S.resume_source, S.parse_error = upload.name, "upload", None
        except ParseError as e:
            S.resume_text = S.resume_name = S.resume_source = None
            S.parse_error = str(e)
        except Exception:
            S.resume_text = S.resume_name = S.resume_source = None
            S.parse_error = "That file could not be read. Try another PDF or DOCX."
    elif S.resume_source == "upload":  # the user removed the file
        S.resume_text = S.resume_name = S.resume_source = S.resume_sig = None


def run_analysis() -> None:
    limit = input_limit()
    resume, jd = S.resume_text[:limit], S.jd.strip()[:limit]
    started = time.time()
    S.analysis_error = None
    with st.status("Analyzing your resume against the job...", expanded=True) as status:
        st.write("Reading your resume and the job description")
        st.write("Scoring skills, experience and keywords (usually 10 to 30 seconds)")
        try:
            result = analyze(resume, jd)
        except Exception as e:  # any failure becomes a friendly message
            status.update(label="Analysis failed", state="error", expanded=False)
            S.analysis_error = (ui.friendly_error(e), str(e))
            return
        status.update(label="Analysis complete", state="complete", expanded=False)
    S.analysis, S.analysis_key = result, inputs_key()
    S.analysis_secs = round(time.time() - started)
    S.letter_text, S.letter_error, S.include_letter = "", None, False
    S.chat, S.last_failed_q = [], None
    st.rerun()


def render_inputs() -> bool:
    with st.expander("Resume and job description", expanded=S.analysis is None):
        left, right = st.columns(2, gap="large")

        with left:
            st.markdown(ui.section_title("1", "Your resume", "PDF or DOCX, text-based (not a scan)"),
                        unsafe_allow_html=True)
            upload = st.file_uploader("Upload your resume", type=["pdf", "docx"],
                                      key=f"resume_up_{S.upload_nonce}", label_visibility="collapsed")
            handle_upload(upload)
            if S.resume_text:
                st.markdown(ui.status_card(
                    "ok", f"Ready: {S.resume_name}",
                    f"{ui.word_count(S.resume_text):,} words read from the file"), unsafe_allow_html=True)
                if len(S.resume_text) > input_limit():
                    st.warning(f"Your resume is very long. Only the first {input_limit():,} characters will be used.")
                if st.checkbox("Show the text we extracted", key="show_preview"):
                    st.text(S.resume_text[:4000] + ("\n..." if len(S.resume_text) > 4000 else ""))
            elif S.parse_error:
                st.error(S.parse_error)

        with right:
            st.markdown(ui.section_title("2", "Target job", "Paste the complete job posting"),
                        unsafe_allow_html=True)
            st.text_input("Job title (optional)", key="job_title", placeholder="e.g. Backend Engineer")
            st.text_area("Job description", key="jd", height=230, label_visibility="collapsed",
                         placeholder="Paste the full job description here, including requirements...")
            words = ui.word_count(S.jd)
            if words and not jd_ready():
                st.caption(f"{words} words. Paste the full posting for better results (at least {MIN_JD_CHARS} characters).")
            elif words:
                st.caption(f"{words:,} words")

        needs = []
        if not api_key_present():
            needs.append("add your API key to .env")
        if not S.resume_text:
            needs.append("upload your resume")
        if not jd_ready():
            needs.append("paste the job description")
        label = "Analyze my fit" if S.analysis is None else "Re-analyze"
        _, middle, _ = st.columns([1, 2, 1])
        with middle:
            clicked = st.button(label, type="primary", key="btn_analyze", disabled=bool(needs))
            if needs:
                st.caption("To continue: " + ", ".join(needs) + ".")
    return clicked


def render_analysis_error() -> None:
    if S.analysis_error:
        friendly, technical = S.analysis_error
        st.error(friendly)
        if st.checkbox("Show technical details", key="show_tech"):
            st.code(technical)


def render_empty_state() -> None:
    st.write("")
    cards = [
        ("Match score", "See how well your resume fits the job, with an honest breakdown."),
        ("Skill gaps", "Find the required skills and keywords your resume is missing."),
        ("Better bullets", "Get stronger rewrites of your weakest resume bullets, with no invented facts."),
        ("Interview coach", "Practice tough questions and learn how to address your gaps."),
    ]
    st.markdown(ui.feature_grid(cards), unsafe_allow_html=True)
    st.write("")
    st.caption("New here? Upload your resume and paste a job description above, or use the Job finder "
               "to search for jobs that match your resume.")


# --------------------------------------------------------------------- results

def render_overview(a) -> None:
    score = a.overall_score
    rows = [(SCORE_LABELS[k], getattr(a.score_breakdown, k), int(w * 100)) for k, w in SCORE_WEIGHTS.items()]
    required_gaps = [s for s in a.missing_skills if s.importance == "required"]
    total_skills = len(a.matched_skills) + len(a.missing_skills)

    left, right = st.columns([1, 2], gap="large")
    with left:
        st.markdown(ui.ring(score), unsafe_allow_html=True)
    with right:
        st.markdown(ui.summary_card(a.summary, rows), unsafe_allow_html=True)
    if S.analysis_secs is not None:
        st.caption(f"Analyzed in {S.analysis_secs}s. Scores are AI estimates: use them as guidance, not a verdict.")

    st.write("")
    stats = st.columns(4, gap="medium")
    tiles = [
        ("Match score", f"{score}%", ui.verdict(score)),
        ("Skills matched", f"{len(a.matched_skills)} / {total_skills}" if total_skills else "0", "found in your resume"),
        ("Required gaps", str(len(required_gaps)), "must-have skills missing"),
        ("Keywords missing", str(len(a.missing_keywords)), "worth adding if true"),
    ]
    for col, (label, value, hint) in zip(stats, tiles):
        with col:
            st.markdown(ui.stat_card(label, value, hint), unsafe_allow_html=True)

    st.write("")
    good, bad = st.columns(2, gap="large")
    with good:
        st.markdown(ui.heading("What you already show", "Skills backed by evidence in your resume"),
                    unsafe_allow_html=True)
        if a.matched_skills:
            for s in a.matched_skills:
                st.markdown(ui.skill_ok(s.skill, s.evidence), unsafe_allow_html=True)
        else:
            st.info("No matching skills were found. Check that the right resume and job were used.")
    with bad:
        st.markdown(ui.heading("Gaps to address", "Required skills are listed first"), unsafe_allow_html=True)
        ordered = sorted(a.missing_skills, key=lambda s: s.importance != "required")
        if ordered:
            for s in ordered:
                st.markdown(ui.skill_missing(s.skill, s.importance, s.suggestion), unsafe_allow_html=True)
        else:
            st.success("No gaps found for this job.")

    st.write("")
    st.markdown(ui.heading("Keywords to consider adding", "Only add terms that honestly describe your experience"),
                unsafe_allow_html=True)
    st.markdown(ui.chips(a.missing_keywords, "miss"), unsafe_allow_html=True)

    st.write("")
    st.markdown(ui.heading("Stronger bullet points", "Rewrites use only facts already in your resume"),
                unsafe_allow_html=True)
    if a.bullet_fixes:
        for b in a.bullet_fixes:
            st.markdown(ui.bullet_card(b.original, b.improved, b.reason, b.needs_user_input),
                        unsafe_allow_html=True)
        export = "\n\n".join(f"ORIGINAL: {b.original}\nIMPROVED: {b.improved}\nWHY: {b.reason}" for b in a.bullet_fixes)
        st.download_button("Download rewrites (.txt)", export, file_name="bullet-rewrites.txt",
                           mime="text/plain", key="dl_rewrites")
    else:
        st.info("No bullet rewrites were generated this time. Press Re-analyze above to try again.")


def render_letter(a) -> None:
    st.markdown(ui.heading("Cover letter", "Built from your real experience. Gaps are handled positively, never invented away."),
                unsafe_allow_html=True)
    opts, action = st.columns([2, 1], gap="large")
    with opts:
        tone = st.selectbox("Tone", TONES, key="letter_tone")
    with action:
        st.write("")
        generate = st.button("Regenerate letter" if S.letter_text else "Generate cover letter",
                             type="primary", key="btn_letter")
    if generate:
        S.letter_error = None
        with st.spinner("Writing your letter... (about 10 to 20 seconds)"):
            try:
                limit = input_limit()
                S.letter_text = cover_letter(S.resume_text[:limit], S.jd.strip()[:limit], a, tone=tone.lower())
                S.include_letter = True
            except Exception as e:
                S.letter_error = ui.friendly_error(e)
    if S.letter_error:
        st.error(S.letter_error)
    if not S.letter_text:
        st.info("Press Generate to write a first draft. You can edit it freely afterwards.")
        return

    st.text_area("Your letter (edit freely)", key="letter_text", height=400)
    words = ui.word_count(S.letter_text)
    st.caption(f"{words} words")
    flagged = find_violations(S.letter_text)
    if flagged:
        st.warning("The draft contains wording that points at a gap (" + ", ".join(flagged) +
                   "). Consider rewording it positively.")
    if "[Company]" in S.letter_text or "[Your Name]" in S.letter_text:
        st.info("Replace the bracketed placeholders, such as [Company], before sending.")
    st.caption("Always read the letter and make sure every claim is true for you.")
    st.download_button("Download .txt", S.letter_text, file_name="cover-letter.txt", mime="text/plain",
                       key="dl_letter")


def render_coach(a) -> None:
    st.markdown(ui.heading("Career coach", "Ask anything about this job. Answers use your resume, the posting and your analysis."),
                unsafe_allow_html=True)
    if not S.chat:
        st.markdown(ui.status_card("ok", "Try one of these to get started", "Or type your own question below."),
                    unsafe_allow_html=True)
        cols = st.columns(2, gap="medium")
        for i, question in enumerate(suggested_questions(a)):
            with cols[i % 2]:
                st.button(question, key=f"sq_{i}", on_click=ask, args=(question,))

    for message in S.chat:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    typed = st.chat_input("Ask about interviews, skill gaps, your projects...")
    question = typed or S.pending_q
    S.pending_q = None
    if question:
        S.last_failed_q = None
        with st.chat_message("user"):
            st.markdown(question)
        reply = None
        with st.chat_message("assistant"):
            try:
                limit = input_limit()
                reply = st.write_stream(coach_stream(S.resume_text[:limit], S.jd.strip()[:limit], a, S.chat, question))
            except CoachError as e:
                st.error(str(e))
                S.last_failed_q = question
        if reply:
            S.chat += [{"role": "user", "content": question}, {"role": "assistant", "content": reply}]
            st.rerun()

    if S.last_failed_q:
        st.button("Try that question again", key="btn_retry", on_click=ask, args=(S.last_failed_q,))
    if S.chat:
        st.button("Clear conversation", key="btn_clear_chat", on_click=clear_chat)


def render_report(a) -> None:
    st.markdown(ui.heading("PDF report", "A clean, shareable audit of this analysis."), unsafe_allow_html=True)
    st.checkbox("Include my cover letter draft (adds a page)", key="include_letter", disabled=not S.letter_text)
    try:
        pdf = build_pdf(a, job_title=(S.job_title or "").strip(),
                        cover_letter=S.letter_text if (S.include_letter and S.letter_text) else "")
    except Exception:
        st.error("The report could not be built. Please try Re-analyze and download again.")
        return
    name = ui.safe_filename(S.job_title, "resume-audit")
    st.download_button("Download PDF report", pdf, file_name=f"resume-audit-{name}.pdf", mime="application/pdf",
                       type="primary", key="dl_pdf")
    st.markdown("**Inside the report:** overall score and breakdown, matched skills with evidence, "
                "missing skills and keywords, and your bullet rewrites.")
    st.caption("The report is generated on your device's session and is not stored anywhere.")


# ------------------------------------------------------------------ job finder

def use_job(i: int) -> None:
    """Load a found job into the analysis inputs so Analyze, letter and coach all work on it."""
    job = S.jobs[i]
    S.jd, S.job_title = job.description, job.title
    msg = f"Loaded \"{job.title}\" into the job description box above. Open it and press Analyze."
    if len(job.description) < 600:
        msg += (" This is only a short snippet. Open the posting with Apply, copy the full "
                "description, and paste it for a better analysis.")
    S.jobs_flash = msg


def add_role(role: str) -> None:
    """Add a suggested role to the search box (no duplicates, at most MAX_QUERIES)."""
    current = split_queries(S.jobs_query, limit=100)
    if role.lower() not in (c.lower() for c in current):
        current.append(role)
    S.jobs_query = ", ".join(current[:MAX_QUERIES])


def run_role_suggestions() -> None:
    """Runs before the search box is drawn, so it may fill the box directly."""
    S.roles_error = None
    with st.spinner("Reading your resume... (about 10 seconds)"):
        try:
            roles = suggest_roles(S.resume_text[:input_limit()])
        except Exception as e:
            S.roles_error = ui.friendly_error(e)
            return
    S.role_suggestions = roles
    if roles:
        S.jobs_query = ", ".join(roles[:3])
    else:
        S.roles_error = "No roles could be suggested. Type a role yourself."


def run_job_search(mode: str, use_ai: bool) -> None:
    S.jobs, S.jobs_notes, S.jobs_flash = [], [], None
    queries = split_queries(S.jobs_query)
    many = len(queries) > 1
    per_query = 10 if many else 15
    found, notes = [], []

    bar = st.progress(0.0, text="Starting...")
    for i, q in enumerate(queries):
        bar.progress(i / len(queries), text=f'Searching "{q}" ({i + 1} of {len(queries)}). '
                                            "Job sites can take 30 to 90 seconds per search.")
        try:
            if mode == JOBSITES_MODE:
                jobs, n = fetch_jobspy(q, S.jobs_where.strip(), S.jobs_sites, results=per_query,
                                       fetch_description=S.jobs_desc, max_days=S.jobs_days)
            elif mode == REMOTE_MODE:
                jobs, n = fetch_remote(q)
            else:
                jobs, n = fetch_adzuna(q, S.jobs_where.strip(), max_days=S.jobs_days), []
        except JobFetchError as e:
            jobs, n = [], [str(e)]
        found += jobs
        notes += [(f'"{q}": ' if many else "") + x for x in n]
    bar.empty()

    found, too_old, undated = filter_recent(dedupe(found), S.jobs_days)
    if too_old:
        notes.append(f"Hid {too_old} posting(s) older than {S.jobs_days} days.")
    if undated:
        notes.append(f"{undated} posting(s) don't show a date, so they are included. "
                     "Check how old they are before applying.")

    lo, hi = S.jobs_exp
    want_hi = None if hi >= EXP_MAX else hi
    if (lo, want_hi) != (0, None):
        found, off_target, unstated = filter_experience(found, lo, want_hi, strict=S.jobs_exp_strict)
        span = f"{lo}+" if want_hi is None else f"{lo} to {want_hi}"
        if off_target:
            notes.append(f"Hid {off_target} posting(s) that don't match {span} years of experience.")
        if unstated:
            notes.append(f"{unstated} posting(s) don't state the experience they want, so they are included.")

    S.jobs_notes = list(dict.fromkeys(notes))
    if found:
        with st.spinner("Ranking jobs against your resume..."):
            S.jobs, note = rank_jobs(S.resume_text[:input_limit()], found, use_ai=use_ai)
        if note:
            S.jobs_notes.append(note)


def render_jobs() -> None:
    st.markdown(ui.heading("Find matching jobs",
                           "Jobs are ranked against your resume. Apply opens the original posting."),
                unsafe_allow_html=True)
    if not S.resume_text:
        st.info("Upload your resume above first. Jobs are matched against it.")
        return
    if S.jobs_flash:
        st.success(S.jobs_flash)

    modes = [JOBSITES_MODE, REMOTE_MODE] + ([ADZUNA_MODE] if (config.ADZUNA_APP_ID and config.ADZUNA_APP_KEY) else [])
    mode = st.radio("Where to look", modes, horizontal=True, key="jobs_mode")

    if st.button("Suggest roles from my resume", key="btn_roles",
                 help="Reads your resume and proposes job titles worth searching for."):
        run_role_suggestions()
    if S.roles_error:
        st.error(S.roles_error)
    if S.role_suggestions:
        st.caption("Suggested for your resume. Click one to add it to your search:")
        cols = st.columns(len(S.role_suggestions))
        for i, (col, role) in enumerate(zip(cols, S.role_suggestions)):
            col.button(role, key=f"role_{i}", on_click=add_role, args=(role,))

    st.text_input(f"Roles or keywords (separate with commas, up to {MAX_QUERIES})", key="jobs_query",
                  placeholder="e.g. Python developer, Backend engineer, Data engineer")
    if mode in (ADZUNA_MODE, JOBSITES_MODE):
        st.text_input("Location", key="jobs_where", placeholder="e.g. Pune")
    if mode == JOBSITES_MODE:
        st.multiselect("Sites", list(JOBSPY_SITES), key="jobs_sites")
        st.checkbox("Fetch full descriptions (slower, but ranking and experience filter work much better)",
                    key="jobs_desc")
        st.caption("These sites do not offer a public API, so this reads their public search pages. "
                   "Indeed and Naukri work best. LinkedIn often rate-limits after a few searches. "
                   "Each role is a separate search, so more roles take longer.")
    elif mode == REMOTE_MODE:
        st.caption("Remote jobs from Jobicy and Himalayas, no account needed. Each posting says where "
                   "you may work from, so check that before applying.")

    f1, f2 = st.columns(2, gap="large")
    with f1:
        st.selectbox("Posted within", [1, 3, 7, 14, 30, 0], key="jobs_days",
                     format_func=lambda d: {1: "Last 24 hours", 3: "Last 3 days", 7: "Last 7 days",
                                            14: "Last 14 days", 30: "Last 30 days", 0: "Any time"}[d])
    with f2:
        st.slider("Years of experience the job asks for", 0, EXP_MAX, key="jobs_exp",
                  help=f"Drag both ends. {EXP_MAX} means {EXP_MAX} or more. Leave at 0 to {EXP_MAX} for no filter.")
    st.checkbox("Hide postings that don't state the experience they want", key="jobs_exp_strict")
    st.caption("The experience filter reads phrases like \"3+ years\" or \"2-5 yrs\", Naukri's own field, "
               "and words like Senior or Junior in the title. It is a best guess, so check each posting.")
    st.checkbox("Score the top 10 with AI (one extra model call)", key="jobs_ai")

    ready = bool(split_queries(S.jobs_query)) and (mode != JOBSITES_MODE or bool(S.jobs_sites))
    if st.button("Find jobs", type="primary", key="btn_jobs", disabled=not ready):
        run_job_search(mode, S.jobs_ai)

    for note in S.jobs_notes:
        st.warning(note)
    if not S.jobs:
        return
    st.caption(f"{len(S.jobs)} jobs found. Scores are estimates: check each posting yourself.")
    for i, job in enumerate(S.jobs[:25]):
        st.markdown(ui.job_card(job), unsafe_allow_html=True)
        apply_col, fit_col, _ = st.columns([1, 2, 4])
        try:
            apply_col.link_button("Apply", job.url, key=f"apply_{i}")
        except TypeError:  # older Streamlit: link_button has no `key` argument
            apply_col.link_button("Apply", job.url)
        fit_col.button("Analyze fit for this job", key=f"use_{i}", on_click=use_job, args=(i,))


# ------------------------------------------------------------------------ main

init_state()
st.markdown(CSS, unsafe_allow_html=True)
render_sidebar()
st.markdown(ui.HERO, unsafe_allow_html=True)
if render_inputs():
    run_analysis()  # runs outside the expander: st.status can't live inside one
render_analysis_error()

analysis = S.analysis
if analysis is None:
    render_empty_state()
    st.divider()
    render_jobs()
else:
    if S.analysis_key != inputs_key():
        st.warning("Your resume or job description changed after this analysis. "
                   "Open the inputs above and press Re-analyze to refresh the results.")
    tab_overview, tab_jobs, tab_letter, tab_coach, tab_report = st.tabs(
        ["Overview", "Job finder", "Cover letter", "Career coach", "PDF report"])
    with tab_overview:
        render_overview(analysis)
    with tab_jobs:
        render_jobs()
    with tab_letter:
        render_letter(analysis)
    with tab_coach:
        render_coach(analysis)
    with tab_report:
        render_report(analysis)
