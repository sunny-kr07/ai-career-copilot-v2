# AI Career Copilot: React front end

React 19 + Vite + Tailwind CSS v4 + Motion + Lucide. The Python logic in `core/` is untouched;
`api/server.py` is a thin FastAPI adapter that calls it, and this app talks to that API.
The Streamlit app (`app/main.py`) still works exactly as before.

## Run (two terminals, from the project root)

```bash
# 1. API  (reads your existing .env)
pip install -r requirements.txt
uvicorn api.server:app --reload --port 8000

# 2. Web  (Node 18+)
cd web
npm install
npm run dev          # http://localhost:5173
```

`npm run build` outputs `web/dist`. In production serve it behind the same origin as the API
(or set `VITE_API_BASE=https://your-api` at build time and `CORS_ORIGINS` on the API).

## Structure

```
src/index.css              design tokens (warm palette, glass / field utilities, motion rules)
src/components/ui/         Button, Input/Textarea, Select, Tabs, Switch, Badge, GlassCard,
                           ScoreRing, Dropzone, RangeSlider, Accordion, Alert, Reveal
src/components/layout/     MarketingNav, Footer, WorkspaceLayout, ResumeBar, Background, Logo
src/components/analysis/   result views (score, skills, bullet rewrites)
src/pages/Landing.jsx      marketing site (sections in pages/landing/)
src/pages/workspace/       Home, Analyze, Jobs, Letter, Coach, Report
src/lib/                   api client, session store, hooks
```

Routes: `/` marketing site, `/app` workspace home, `/app/analyze`, `/app/letter`, `/app/coach`, `/app/report` (Resume analysis), `/app/jobs` (Job finder).
