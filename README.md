<div align="center">

<img src="web/public/logo-96.png" alt="AI Career Copilot logo" width="72" height="72" />

# AI Career Copilot

**Read your resume like a recruiter.** An honest match score against any job description, skill gaps,
truthful bullet rewrites, a tailored cover letter, interview coaching, a shareable PDF report, and job discovery.

[Features](#features) · [Quick start](#quick-start) · [Configuration](#configuration) · [Architecture](docs/ARCHITECTURE.md) · [Privacy](#privacy--security)

</div>

## Features

The workspace has two independent sections.

### Resume analysis
Upload a resume (PDF or DOCX), paste a job description, then:

| Feature | What you get |
|---|---|
| **Analyze a job** | Weighted match score (skills, experience, domain, keywords), matched and missing skills with evidence, and bullet rewrites that stay truthful |
| **Cover letter** | Tailored draft grounded in your real experience, with a check for invented claims |
| **Career copilot** | Chat about the role: interview questions, gap strategy, answers based on your resume and the posting |
| **PDF report** | A clean, shareable audit of the analysis |

### Job finder
Find roles that fit your resume, without a posting in hand:

- Add roles or keywords as tags (or let the AI suggest roles from your resume)
- Search job boards (Naukri, Indeed, LinkedIn), remote boards, or Adzuna
- Filter by location, recency and experience range
- Every result gets a fit score; send any job straight to analysis

## Quick start

**Requirements:** Python 3.11+, Node 18+, and a free [Google AI Studio API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/sunny-kr07/ai-career-copilot-v2.git
cd ai-career-copilot

python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # then open .env and set GOOGLE_API_KEY
cd web && npm install && cd ..

./dev.sh                      # API on :8000 and web app on :5173
```

Open <http://localhost:5173>. No resume handy? Use **Try sample data** (fictional).

Prefer two terminals?

```bash
uvicorn api.server:app --reload --port 8000     # terminal 1, from the project root
cd web && npm run dev                           # terminal 2
```

## Configuration

All settings are environment variables in `.env` (see [`.env.example`](.env.example)).

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini API key for analysis, letters, coaching |
| `LLM_MODEL` | No | Model name (default `gemma-4-26b-a4b-it`) |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `ADZUNA_COUNTRY` | No | Enables the Adzuna job source |
| `JOBSPY_COUNTRY`, `JOBSPY_PROXIES` | No | Country and optional proxies for job-board scraping |
| `CORS_ORIGINS` | No | Allowed browser origins for the API in production |

## Project structure

```
ai-career-copilot/
├── api/            FastAPI adapter (thin HTTP layer over core/)
├── core/           Parsing, analysis, matching, jobs, letters, coach, PDF export
├── web/            React 19 + Vite + Tailwind v4 front end
├── app/            Original Streamlit interface (still works: streamlit run app/main.py)
├── tests/          Offline unit tests (pytest)
├── scripts/        Live-model smoke tests (need an API key)
├── data/           Local scratch folders, git-ignored (real resumes never go here in git)
├── docs/           Architecture notes
└── dev.sh          Starts API and web together
```

## Development

```bash
pip install -r requirements-dev.txt
pytest                         # offline tests, no key needed
ruff check .
cd web && npm run build        # production build to web/dist
```

CI runs the tests and the front-end build on every push and pull request.

## Privacy & security

- Your resume is processed in memory and sent to Google's Gemini API to generate results.
  **It is not saved to disk** by this app.
- API keys stay in your local `.env` (git-ignored) and are never sent to the browser. Error messages are redacted.
- Real resumes, generated reports and cached analyses are git-ignored.
- See [SECURITY.md](SECURITY.md) for key handling, deployment advice and a pre-push checklist.

## Tech stack

Python · FastAPI · LangChain + Google Gemini · pdfplumber · python-docx · ReportLab · python-jobspy ·
React 19 · Vite · Tailwind CSS v4 · Motion

## Contributing

Issues and PRs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
