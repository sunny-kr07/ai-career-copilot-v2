const BASE = import.meta.env.VITE_API_BASE ?? "";

const SERVER_DOWN =
  "Can't reach the Career Copilot server. In a terminal at the project root, run: " +
  "uvicorn api.server:app --port 8000 (or ./dev.sh to start everything), then try again.";

export class ApiError extends Error {
  constructor(message, technical) {
    super(message);
    this.name = "ApiError";
    this.technical = technical;
  }
}

async function request(path, options) {
  let res;
  try {
    res = await fetch(BASE + path, options);
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(SERVER_DOWN);
  }
  if (!res.ok) {
    let detail, json = false;
    try { detail = (await res.json()).detail; json = true; } catch { /* non-JSON error body */ }
    // The API always answers errors with JSON. An empty or HTML 5xx comes from the dev proxy or a gateway
    // that could not reach the API (it is not running, crashed on start, or is on another port).
    if (!json && [500, 502, 503, 504].includes(res.status)) throw new ApiError(SERVER_DOWN);
    const message =
      detail?.message || (typeof detail === "string" ? detail : null) ||
      (Array.isArray(detail) ? "Some required information is missing." : null) ||
      `Something went wrong (error ${res.status}). Please try again.`;
    throw new ApiError(message, detail?.technical);
  }
  return res;
}

const post = (path, body, signal) =>
  request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });

export const api = {
  health: () => request("/api/health").then((r) => r.json()),
  parse: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/parse", { method: "POST", body: form }).then((r) => r.json());
  },
  analyze: (resume, jd) => post("/api/analyze", { resume, jd }).then((r) => r.json()),
  letter: (payload) => post("/api/letter", payload).then((r) => r.json()),
  checkLetter: (text) => post("/api/letter/check", { text }).then((r) => r.json()),
  suggestions: (analysis) => post("/api/coach/suggestions", { analysis }).then((r) => r.json()),
  roles: (resume) => post("/api/roles", { resume }).then((r) => r.json()),
  jobs: (payload) => post("/api/jobs", payload).then((r) => r.json()),
  async report(payload) {
    const res = await post("/api/report", payload);
    return res.blob();
  },
  /** Async generator yielding text chunks as the coach writes its reply. */
  async *coach(payload, signal) {
    const res = await post("/api/coach", payload, signal);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  },
};

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
