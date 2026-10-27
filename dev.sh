#!/usr/bin/env bash
# Start the API (port 8000) and the web app (port 5173) together. Ctrl+C stops both.
set -e
cd "$(dirname "$0")"

if [ -d .venv ]; then source .venv/bin/activate; fi
python3 -c "import fastapi, uvicorn, multipart, pdfplumber, docx" 2>/dev/null || {
  echo "Installing Python dependencies..."; python3 -m pip install -r requirements.txt; }
[ -d web/node_modules ] || (cd web && npm install)
[ -f .env ] || echo "Note: no .env found. Create one with GOOGLE_API_KEY=... for analysis to work."

python3 -m uvicorn api.server:app --reload --port 8000 &
API=$!
trap 'kill $API 2>/dev/null' EXIT INT TERM
sleep 2
kill -0 $API 2>/dev/null || { echo "The API failed to start. See the error above."; exit 1; }
echo "API ready on http://127.0.0.1:8000"
cd web && npm run dev
