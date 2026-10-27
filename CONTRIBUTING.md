# Contributing

Thanks for helping improve AI Career Copilot.

## Setup
```bash
git clone https://github.com/<you>/ai-career-copilot.git && cd ai-career-copilot
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # add your GOOGLE_API_KEY
cd web && npm install && cd ..
./dev.sh                        # API on :8000, web on :5173
```

## Before opening a pull request
```bash
ruff check .                    # lint
pytest                          # offline unit tests (no API key needed)
cd web && npm run build         # the front end must build
```

## Guidelines
- Keep `core/` free of web/UI code; `api/server.py` stays a thin adapter.
- Never commit `.env`, real resumes or generated reports (see [SECURITY.md](SECURITY.md)).
- Scripts in `scripts/` call the live model and need a key; tests in `tests/` must run offline.
- Keep UI accessible: labels, focus states, keyboard support, reduced-motion.
- Write clear commit messages; one logical change per PR.
