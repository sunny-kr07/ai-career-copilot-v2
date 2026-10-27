import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · AI Career Copilot` : "AI Career Copilot";
  }, [title]);
}
