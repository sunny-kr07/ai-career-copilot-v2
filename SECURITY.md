# Security & privacy

## Reporting a vulnerability
Please **do not open a public issue** for security problems. Use GitHub's
[private vulnerability reporting](../../security/advisories/new) on this repository instead.

## Handling API keys
- Keys live only in a local `.env` file, which is git-ignored. Use `.env.example` as the template.
- Never paste a key into an issue, PR, screenshot or log. The API redacts keys and proxy
  credentials from error messages it returns to the browser.
- If a key is ever committed or shared: **revoke it immediately** in
  [Google AI Studio](https://aistudio.google.com/apikey) (and Adzuna if relevant), then create a new one.
  Deleting the commit is not enough, as the key remains in git history.
- The browser never receives your key. `/api/health` only reports whether one is configured.

## Handling resume data
- Uploaded resumes are processed in memory, sent to the Google Gemini API to generate results,
  and **not written to disk** by this app.
- Do not commit real resumes, generated PDFs or cached analyses. `data/samples`, `data/output`
  and `data/cache` are git-ignored for this reason; the in-app demo uses fictional data.
- Job search queries are sent to the job boards you select (and to Adzuna if configured).

## Deploying
- Set `CORS_ORIGINS` to your real front-end origin only.
- Serve over HTTPS and add authentication and rate limiting before exposing the API publicly.
  The app has no user accounts and each request spends your Gemini quota.

## Before you push (checklist)
```bash
git status                      # .env must NOT be listed
git ls-files | grep -iE "\.env$|\.pdf$|\.docx$"   # should print nothing (besides .env.example)
git diff --cached | grep -iE "AIza|api_key\s*=\s*\S"   # should print nothing
```
