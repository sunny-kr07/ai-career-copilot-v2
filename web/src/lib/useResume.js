import { useCallback, useState } from "react";
import { api } from "./api";
import { setState } from "./store";
import { SAMPLE_JD, SAMPLE_JOB_TITLE, SAMPLE_RESUME } from "../data/samples";
import { wordCount } from "./utils";

const MAX_BYTES = 10 * 1024 * 1024;

/** Parse an uploaded resume on the server and store the extracted text for this session. */
export function useResume() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file) => {
    setError(null);
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError("Please choose a PDF or DOCX file.");
      return false;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is larger than 10 MB.");
      return false;
    }
    setBusy(true);
    try {
      const { text, name, words } = await api.parse(file);
      setState({ resume: { text, name, words, source: "upload" } });
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const loadSample = useCallback(() => {
    setError(null);
    setState({
      resume: { text: SAMPLE_RESUME, name: "Sample resume (Alex Morgan)", words: wordCount(SAMPLE_RESUME), source: "sample" },
      jobTitle: SAMPLE_JOB_TITLE,
      jd: SAMPLE_JD,
    });
  }, []);

  return { upload, loadSample, busy, error, clearError: () => setError(null) };
}
