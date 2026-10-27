/** Fixed atmospheric lighting: soft champagne glow, taupe haze and a whisper of film grain. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ivory">
      <div className="absolute -top-56 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(238_214_172/0.8),transparent)]" />
      <div className="absolute -left-48 top-[28%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(220_203_180/0.6),transparent)]" />
      <div className="absolute -right-48 bottom-[-10%] h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgb(217_185_140/0.4),transparent)]" />
      <div className="grain absolute inset-0 opacity-[0.05] mix-blend-multiply" />
    </div>
  );
}
