import { Background } from "../components/layout/Background";
import { Footer } from "../components/layout/Footer";
import { MarketingNav } from "../components/layout/MarketingNav";
import { usePageTitle } from "../lib/usePageTitle";
import { Faq } from "./landing/Faq";
import { Features } from "./landing/Features";
import { FinalCta } from "./landing/FinalCta";
import { Hero } from "./landing/Hero";
import { HowItWorks } from "./landing/HowItWorks";
import { Privacy } from "./landing/Privacy";
import { Showcase } from "./landing/Showcase";

export default function Landing() {
  usePageTitle("");
  return (
    <div className="relative isolate">
      <Background />
      <a href="#main" className="sr-only z-[60] rounded-full bg-espresso px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <MarketingNav />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <Showcase />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
