import { useEffect, useState } from "react";
import { api } from "./api";

let cached = null;

/** Server capabilities (API key present, Adzuna enabled, ...). Fetched once per page load. */
export function useHealth() {
  const [health, setHealth] = useState(cached);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (cached) return;
    let live = true;
    api.health().then((h) => { cached = h; if (live) setHealth(h); }).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);
  return { health, error };
}
