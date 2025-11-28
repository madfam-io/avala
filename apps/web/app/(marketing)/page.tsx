import {
  Hero,
  TrustBar,
  ProblemSolution,
  ProductModules,
  ECHighlight,
  AudienceSegments,
  Testimonials,
  PricingPreview,
  FAQ,
  FinalCTA,
} from "@/components/marketing";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ProblemSolution />
      <ProductModules />
      <ECHighlight />
      <AudienceSegments />
      <Testimonials />
      <PricingPreview />
      <FAQ />
      <FinalCTA />
    </>
  );
}
