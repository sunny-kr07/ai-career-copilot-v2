/** Minimal, safe renderer for the coach's light formatting: paragraphs, bullets and **bold**. No raw HTML. */
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
  );
}

export function Markdown({ text }) {
  const blocks = [];
  let list = null;
  text.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      if (!list) blocks.push((list = { type: "ul", items: [], key: i }));
      list.items.push(bullet[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ type: "p", text: line, key: i });
    }
  });
  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((b) =>
        b.type === "ul" ? (
          <ul key={b.key} className="list-disc space-y-1.5 pl-5 marker:text-gold">
            {b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}
          </ul>
        ) : (
          <p key={b.key}><Inline text={b.text} /></p>
        ),
      )}
    </div>
  );
}
