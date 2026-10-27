# Architecture

```
Browser (React, web/)  ──/api──▶  FastAPI (api/server.py)  ──▶  core/  ──▶  Gemini API
                                                              └─▶  job boards (jobspy, Adzuna, remote feeds)
```

## Layers
- **`web/`** React single-page app. Marketing site at `/`, workspace at `/app`. Session state (resume text,
  analysis, letter, chat, job results) lives in memory in `src/lib/store.js` and is lost on refresh by design.
- **`api/server.py`** Thin HTTP adapter: validates input, calls `core/`, turns errors into friendly JSON and
  redacts secrets. Interactive docs at `/api/docs` while running.
- **`core/`** All logic, with no web dependencies:
  `parsing` (PDF/DOCX to text) · `analyzer` + `schemas` (structured, weighted scoring) · `generators` (cover letter and
  claim check) · `coach` (streamed Q&A) · `jobs` + `matcher` + `roles` (search, filter, rank) · `export` (PDF report) ·
  `llm` (model client with retries) · `config` (environment).
- **`app/`** The original Streamlit UI, kept working against the same `core/`.

## API endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server status, whether a key is configured (never the key itself) |
| POST | `/api/parse` | Extract text from an uploaded PDF/DOCX |
| POST | `/api/analyze` | Resume vs. job description analysis |
| POST | `/api/letter`, `/api/letter/check` | Generate and verify a cover letter |
| POST | `/api/coach`, `/api/coach/suggestions` | Streamed coaching chat and starter questions |
| POST | `/api/roles` | Suggest roles from a resume |
| POST | `/api/jobs` | Search and rank jobs |
| POST | `/api/report` | Build the PDF report |

## Workspace routes
`/app` home · Resume analysis: `/app/analyze`, `/app/letter`, `/app/coach`, `/app/report` · Job finder: `/app/jobs`
