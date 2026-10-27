import { Background } from "../components/layout/Background";
import { Button } from "../components/ui/Button";
import { usePageTitle } from "../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center px-6">
      <Background />
      <main className="glass-strong max-w-md rounded-[32px] p-10 text-center">
        <p className="font-serif text-6xl italic text-gradient-gold">404</p>
        <h1 className="mt-3 text-3xl font-semibold">This page wandered off.</h1>
        <p className="mt-2 text-mocha">The link may be broken or the page may have moved.</p>
        <div className="mt-6 flex justify-center gap-3"><Button to="/">Back home</Button><Button to="/app" variant="glass">Open workspace</Button></div>
      </main>
    </div>
  );
}
