import { useSyncExternalStore } from "react";

/**
 * Tiny session store. State lives in memory and is mirrored to sessionStorage so a refresh
 * keeps your work, while closing the tab clears it (matches the privacy promise in the UI).
 * Selectors must return stable references (a slice of state, never a freshly built object).
 */
const KEY = "career-copilot:session:v2";
export const EXP_MAX = 15;

const initial = () => ({
  resume: null, // { text, name, source: "upload" | "sample", words }
  jobTitle: "",
  jd: "",
  analysis: null,
  analysisKey: null,
  analysisSecs: null,
  letter: { text: "", tone: "Confident", flagged: [] },
  chat: [],
  flash: null,
  jobs: {
    mode: "jobsites", query: "", where: "", sites: ["Naukri", "Indeed"], fetchDescription: true,
    days: 7, exp: [0, EXP_MAX], expStrict: false, useAi: true, roles: [], results: null, notes: [],
  },
});

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = initial();
      return { ...base, ...saved, jobs: { ...base.jobs, ...saved.jobs }, letter: { ...base.letter, ...saved.letter } };
    }
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return initial();
}

let state = load();
const listeners = new Set();
const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((fn) => fn());

function persist() {
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore quota / private mode */ }
}

export const getState = () => state;

export function setState(patch) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  persist();
  emit();
}

export function setJobs(patch) {
  setState((s) => ({ jobs: { ...s.jobs, ...patch } }));
}

export function resetSession() {
  state = initial();
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  emit();
}

export const useSession = (selector = (s) => s) => useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
