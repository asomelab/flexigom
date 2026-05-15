import { lazy, Suspense } from "react";
import { HeroSection } from "@/features/home/sections/hero-section";
import { CategoriesSection } from "@/features/home/sections/categories-section";
import { FeaturedProductsSection } from "@/features/home/sections/featured-products-section";
import { WhyChooseFlexigomSection } from "@/features/home/sections/why-choose-flexigom-section";
const TestimonialsSection = lazy(() =>
  import("@/features/home/sections/testimonials-section").then((m) => ({
    default: m.TestimonialsSection,
  })),
);
const HelpSection = lazy(() =>
  import("@/features/home/sections/help-section").then((m) => ({
    default: m.HelpSection,
  })),
);
const FAQsSection = lazy(() =>
  import("@/features/home/sections/faqs-section").then((m) => ({
    default: m.FAQsSection,
  })),
);
const LocationSection = lazy(() =>
  import("@/features/home/sections/location-section").then((m) => ({
    default: m.LocationSection,
  })),
);
const FooterSection = lazy(() =>
  import("@/features/home/sections/footer-section").then((m) => ({
    default: m.FooterSection,
  })),
);
const PromotionBanner = lazy(() =>
  import("@/features/home/components/promotion-banner").then((m) => ({
    default: m.PromotionBanner,
  })),
);
import { SEOHead } from "@/components/seo";
import {
  createHomeSEO,
  createLocalBusinessSchema,
  createWebsiteSchema,
  createOrganizationSchema,
} from "@/lib/seo";

export function Component() {
  const seoConfig = createHomeSEO();
  const structuredData = [
    createLocalBusinessSchema(),
    createWebsiteSchema(),
    createOrganizationSchema(),
  ];

  return (
    <>
      <SEOHead
        config={{
          ...seoConfig,
          structuredData,
        }}
      />
      <PromotionBanner />
      <HeroSection />
      <CategoriesSection />
      <WhyChooseFlexigomSection />
      <FeaturedProductsSection />
      <Suspense fallback={<div className="h-20" />}>
        <TestimonialsSection />
        <HelpSection />
        <FAQsSection />
        <LocationSection />
        <FooterSection />
      </Suspense>
    </>
  );
}

Component.displayName = "HomePage";
