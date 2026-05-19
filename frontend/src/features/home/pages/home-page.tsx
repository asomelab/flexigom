import { lazy, Suspense } from "react";
import { HeroSection } from "@/features/home/sections/hero-section";
import { PromotionBanner } from "@/features/home/components/promotion-banner";

const CategoriesSection = lazy(() =>
  import("@/features/home/sections/categories-section").then((m) => ({
    default: m.CategoriesSection,
  })),
);
const FeaturedProductsSection = lazy(() =>
  import("@/features/home/sections/featured-products-section").then((m) => ({
    default: m.FeaturedProductsSection,
  })),
);
const WhyChooseFlexigomSection = lazy(() =>
  import("@/features/home/sections/why-choose-flexigom-section").then((m) => ({
    default: m.WhyChooseFlexigomSection,
  })),
);
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
      <Suspense fallback={<div className="h-40" />}>
        <CategoriesSection />
        <WhyChooseFlexigomSection />
        <FeaturedProductsSection />
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
