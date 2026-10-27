import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { WorkspaceLayout } from "./components/layout/WorkspaceLayout";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Analyze from "./pages/workspace/Analyze";
import Home from "./pages/workspace/Home";

// Secondary workspace pages load on demand to keep the first paint light.
const Jobs = lazy(() => import("./pages/workspace/Jobs"));
const Letter = lazy(() => import("./pages/workspace/Letter"));
const Coach = lazy(() => import("./pages/workspace/Coach"));
const Report = lazy(() => import("./pages/workspace/Report"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

const Fallback = () => <div role="status" className="py-24 text-center text-mocha">Loading…</div>;

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollToTop />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<WorkspaceLayout />}>
            <Route index element={<Home />} />
            <Route path="analyze" element={<Analyze />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="letter" element={<Letter />} />
            <Route path="coach" element={<Coach />} />
            <Route path="report" element={<Report />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}
