import os
import re
from dotenv import load_dotenv
load_dotenv()

MODEL = os.getenv("LLM_MODEL", "gemma-4-26b-a4b-it")
PROVIDER = os.getenv("LLM_PROVIDER", "google_genai")
MAX_INPUT_CHARS = 30_000
THINKING_LEVEL = os.getenv("LLM_THINKING_LEVEL", "minimal")
# Job search (free key from https://developer.adzuna.com). Country: in, gb, us, au, ca, ...
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
ADZUNA_COUNTRY = os.getenv("ADZUNA_COUNTRY", "in")

# Job-site scraping via python-jobspy. Optional proxies: comma-separated "user:pass@host:port".
JOBSPY_COUNTRY = os.getenv("JOBSPY_COUNTRY", "India")  # used by Indeed/Glassdoor
_PROXY_RE = re.compile(r"^(?:[^@\s:]+:[^@\s]+@)?[^:@\s]+:\d{1,5}$")  # [user:pass@]host:port, port numeric
_proxies = [p.strip() for p in os.getenv("JOBSPY_PROXIES", "").split(",") if p.strip()]
JOBSPY_PROXIES = [p for p in _proxies if p == "localhost" or _PROXY_RE.match(p)]
JOBSPY_PROXIES_IGNORED = [p for p in _proxies if p not in JOBSPY_PROXIES]  # e.g. an unedited placeholder
