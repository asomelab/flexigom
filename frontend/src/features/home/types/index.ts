import type { StrapiEntity, StrapiMedia, Product } from "@/types";

export interface TrustIndicator {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBgColor?: string;
  iconColor?: string;
}

export interface PaymentMethod {
  src: string;
  alt: string;
  className?: string;
}

export interface HeroContent {
  title: {
    main: string;
    highlight: string;
  };
  subtitle: string;
  primaryCta: {
    text: string;
    href: string;
  };
  secondaryCta: {
    text: string;
    href: string;
  };
}

export interface HeroImage {
  src: string;
  alt: string;
  badge: {
    primary: string;
    secondary: string;
  };
}
export interface PromotionBanner extends StrapiEntity {
  isActive: boolean;
  image?: StrapiMedia;
  ctaUrl: string;
  ctaText: string;
  title: string;
  description: string;
  discount: number;
}
export interface HeroSectionProps {
  content?: Partial<HeroContent>;
  image?: Partial<HeroImage>;
  trustIndicators?: TrustIndicator[];
  paymentMethods?: PaymentMethod[];
  showPaymentSection?: boolean;
  className?: string;
}

export interface WhyChooseItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface WhyChooseFlexigomContent {
  title: string;
  subtitle?: string;
  items: WhyChooseItem[];
}

export interface WhyChooseFlexigomSectionProps {
  content?: Partial<WhyChooseFlexigomContent>;
  className?: string;
}

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export interface HelpContactButton {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}

export interface HelpSectionContent {
  title: string;
  subtitle: string;
  buttons: HelpContactButton[];
  operatingHours?: string;
}

export interface HelpSectionProps {
  content?: Partial<HelpSectionContent>;
  className?: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterAddress {
  street: string;
  city: string;
  province: string;
  country: string;
}

export interface FooterOperatingHours {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export interface ContactPhone {
  name: string;
  number: string;
  clean: string;
}

export interface FooterContact {
  title: string;
  address: FooterAddress;
  phones: ContactPhone[];
  email: string;
  operatingHours: FooterOperatingHours;
}

export interface FooterSocial {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface FooterCompanyInfo {
  name: string;
  description: string;
}

export interface FooterCopyright {
  year: number;
  text: string;
}

export interface FooterNavigation {
  company: FooterLinkGroup;
  products: FooterLinkGroup;
  help: FooterLinkGroup;
  legal: FooterLinkGroup;
}

export interface FooterConfig {
  companyInfo: FooterCompanyInfo;
  navigation: FooterNavigation;
  contact: FooterContact;
  social: FooterSocial;
  copyright: FooterCopyright;
}

export interface FooterSectionProps {
  config?: Partial<FooterConfig>;
  className?: string;
}

export interface CategoryItem extends StrapiEntity {
  image?: StrapiMedia;
  name: string;
  description: string;
  slug: string;
}

export interface CategoriesContent {
  title: string;
  subtitle?: string;
  categories: CategoryItem[];
}

export interface CategoriesSectionProps {
  content?: Partial<CategoriesContent>;
  className?: string;
}

export type FeaturedProductSection = "homepage";

export interface FeaturedProduct extends StrapiEntity {
  section: FeaturedProductSection;
  products: Product[];
}

export interface FeaturedProductsContent {
  title: string;
  subtitle?: string;
  featuredProducts: FeaturedProduct[];
}

export interface FeaturedProductsSectionProps {
  section?: FeaturedProductSection;
  content?: Partial<FeaturedProductsContent>;
  className?: string;
}

export interface FAQ extends StrapiEntity {
  question: string;
  answer: string;
}

export interface FAQsContent {
  title: string;
  subtitle?: string;
  faqs: FAQ[];
}

export interface FAQsSectionProps {
  content?: Partial<FAQsContent>;
  className?: string;
}

export interface Review extends StrapiEntity {
  rating?: number | null;
  testimonial?: string | null;
  customerName?: string | null;
  customerLocation?: string | null;
  customerSince?: string | null;
}

export interface ReviewsContent {
  title: string;
  subtitle?: string;
  testimonials?: Review[];
}

export interface ReviewsSectionProps {
  content?: Partial<ReviewsContent>;
  className?: string;
}

export interface LocationAddress {
  street: string;
  city: string;
  province: string;
  country: string;
  fullAddress: string;
}

export interface LocationContact {
  phone: string;
  whatsapp: string;
}

export interface LocationOperatingHours {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export interface LocationSectionContent {
  title: string;
  subtitle?: string;
  address: LocationAddress;
  contact: LocationContact;
  operatingHours: LocationOperatingHours;
  mapEmbedUrl: string;
}

export interface LocationSectionProps {
  content?: Partial<LocationSectionContent>;
  className?: string;
}
