import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bot, RefreshCw, Send, Trash2 } from "lucide-react";
import { Markdown } from "../../components/workspace/Markdown";
import { NeedsAnalysis } from "../../components/workspace/NeedsAnalysis";
import { PageHeader } from "../../components/workspace/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { setState, useSession } from "../../lib/store";
import { usePageTitle } from "../../lib/usePageTitle";

function Typing() {
  return (
    <span className="flex gap-1.5 py-1.5" role="status" aria-label="The coach is writing">
      {[0, 1, 2].map((i) => <motion.span key={i} className="size-2 rounded-full bg-taupe" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />)}
    </span>
  );
}

function Bubble({ role, children }) {
  const user = role === "user";
  return (
    <div className={cn("flex", user ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[88%] rounded-3xl px-5 py-3.5 text-[15px] sm:max-w-[80%]", user ? "rounded-br-lg bg-espresso text-ivory shadow-primary" : "glass rounded-bl-lg text-espresso")}>{children}</div>
    </div>
  );
}

export default function Coach() {
  usePageTitle("Career copilot");
  const reduce = useReducedMotion();
  const resume = useSession((s) => s.resume);
  const jd = useSession((s) => s.jd);
  const analysis = useSession((s) => s.analysis);
  const chat = useSession((s) => s.chat);

  const [suggestions, setSuggestions] = useState([]);
  const [draft, setDraft] = useState("");
  const [inputError, setInputError] = useState(null);
  const [pendingQ, setPendingQ] = useState(null);
  const [pending, setPending] = useState("");
  const [error, setError] = useState(null);
  const [failedQ, setFailedQ] = useState(null);
  const end = useRef(null);
  const abort = useRef(null);

  useEffect(() => {
    if (analysis) api.suggestions(analysis).then((r) => setSuggestions(r.questions)).catch(() => {});
  }, [analysis]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (chat.length || pendingQ) end.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [chat.length, pending, pendingQ, reduce]);

  if (!analysis || !resume) return (<><PageHeader eyebrow="Resume analysis" title="Career copilot" /><NeedsAnalysis resume={!!resume} what="The copilot" /></>);

  const busy = pendingQ !== null;

  const ask = async (text) => {
    const question = text.trim();
    if (!question) { setInputError("Type a question first."); return; }
    if (busy) return;
    setInputError(null); setError(null); setFailedQ(null); setDraft("");
    setPendingQ(question); setPending("");
    abort.current = new AbortController();
    let reply = "";
    try {
      for await (const chunk of api.coach({ resume: resume.text, jd, analysis, history: chat, question }, abort.current.signal)) {
        reply += chunk;
        setPending(reply);
      }
      setState({ chat: [...chat, { role: "user", content: question }, { role: "assistant", content: reply.trim() }] });
    } catch (e) {
      if (e.name !== "AbortError") { setError(e.message); setFailedQ(question); }
    } finally {
      setPendingQ(null); setPending("");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(draft); }
  };

  return (
    <>
      <PageHeader eyebrow="Resume analysis" title="Career copilot">Ask anything about this job. Answers use your resume, the posting and your analysis.</PageHeader>
      <GlassCard padded="none" className="overflow-hidden">
        <div role="log" aria-live="polite" aria-label="Conversation with your career coach" className="min-h-[320px] space-y-4 p-5 sm:p-7">
          {chat.length === 0 && !busy && (
            <div className="py-4 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/80 text-gold shadow-inset"><Bot className="size-6" aria-hidden /></span>
              <h2 className="mt-4 text-xl font-semibold">Try one of these to get started</h2>
              <p className="mt-1 text-sm text-mocha">Or type your own question below.</p>
              <ul className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                {suggestions.map((q) => (
                  <li key={q}><button type="button" onClick={() => ask(q)} className="glass w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-espresso transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/85">{q}</button></li>
                ))}
              </ul>
            </div>
          )}
          {chat.map((m, i) => <Bubble key={i} role={m.role}>{m.role === "user" ? m.content : <Markdown text={m.content} />}</Bubble>)}
          {pendingQ && <Bubble role="user">{pendingQ}</Bubble>}
          {busy && <Bubble role="assistant">{pending ? <Markdown text={pending} /> : <Typing />}</Bubble>}
          {error && (
            <Alert tone="error" action={failedQ && <Button size="sm" variant="glass" icon={RefreshCw} onClick={() => ask(failedQ)}>Try again</Button>}>{error}</Alert>
          )}
          <div ref={end} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask(draft); }} noValidate className="border-t border-white/70 bg-white/30 p-4 sm:p-5">
          <label htmlFor="coach-input" className="sr-only">Ask the career coach</label>
          <div className={cn("field field-focus flex items-end gap-2 rounded-3xl p-2 pl-5", inputError && "ring-2 ring-clay/40")}>
            <textarea
              id="coach-input" rows={1} value={draft} onKeyDown={onKeyDown} aria-invalid={!!inputError || undefined} aria-describedby={inputError ? "coach-err" : undefined}
              onChange={(e) => { setDraft(e.target.value); setInputError(null); }} placeholder="Ask about interviews, skill gaps, your projects…"
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] text-espresso outline-none placeholder:text-mocha/70"
            />
            <Button type="submit" size="md" icon={Send} loading={busy} className="shrink-0" aria-label="Send question"><span className="max-sm:sr-only">Send</span></Button>
          </div>
          {inputError && <p id="coach-err" role="alert" className="mt-2 pl-2 text-sm text-clay">{inputError}</p>}
          <div className="mt-3 flex items-center justify-between gap-3 pl-2 text-xs text-mocha">
            <span>Enter to send · Shift + Enter for a new line</span>
            {chat.length > 0 && <button type="button" onClick={() => setState({ chat: [] })} className="flex items-center gap-1.5 font-medium transition-colors hover:text-espresso"><Trash2 className="size-3.5" aria-hidden />Clear conversation</button>}
          </div>
        </form>
      </GlassCard>
    </>
  );
}
