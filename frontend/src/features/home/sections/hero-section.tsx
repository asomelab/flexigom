import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  HeroSectionProps,
  HeroContent,
  HeroImage,
} from "@/features/home/types";

const defaultContent: HeroContent = {
  title: {
    main: "El Descanso que",
    highlight: "Te Mereces",
  },
  subtitle:
    "Descubrí nuestra amplia selección de colchones y sommiers de la más alta calidad. Más de 20 años brindando comodidad y descanso a familias argentinas.",
  primaryCta: {
    text: "Hablar con Nosotros",
    href: "/contacto",
  },
  secondaryCta: {
    text: "Explorar Productos",
    href: "/productos",
  },
};

const defaultImage: HeroImage = {
  src: "/woman-sleeping.webp",
  alt: "Dormitorio moderno con colchón Flexigom",
  badge: {
    primary: "20+ Años",
    secondary: "de Experiencia",
  },
};

export function HeroSection({
  content,
  image,
  className,
}: HeroSectionProps = {}) {
  const isPromoActive = true;
  const heroContent = { ...defaultContent, ...content };
  const heroImage = { ...defaultImage, ...image };

  return (
    <section
      className={cn(
        "flex justify-center items-center py-16 md:py-12 lg:h-[calc(100svh-90px)]",
        className,
      )}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="items-center gap-12 grid grid-cols-1 lg:grid-cols-2">
          {/* Content */}
          <div className={cn("space-y-8 h-full", isPromoActive && "order-last lg:order-none")}>
            <div className="space-y-6">
              <h1 className="font-bold text-black text-4xl md:text-5xl lg:text-6xl leading-tight">
                {heroContent.title.main}
                <span className="block text-red-600">
                  {heroContent.title.highlight}
                </span>
              </h1>
              <p className="max-w-2xl text-gray-700 text-xl md:text-2xl leading-relaxed">
                {heroContent.subtitle}
              </p>
            </div>

            <div className="flex sm:flex-row flex-col gap-4">
              <Button
                asChild
                size="lg"
                className="bg-red-600 hover:bg-red-700 px-8 py-4 h-auto text-lg"
              >
                <Link to={heroContent.primaryCta.href}>
                  {heroContent.primaryCta.text}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-transparent hover:bg-red-600 px-8 py-4 border-2 border-red-600 h-auto text-red-600 hover:text-white text-lg"
              >
                <Link to={heroContent.secondaryCta.href}>
                  {heroContent.secondaryCta.text}
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className={cn("relative", isPromoActive && "order-first lg:order-none w-full scale-105 lg:scale-100")}>
            {isPromoActive ? (
              <a href="/products" className="block relative">
                <div className="shadow-2xl rounded-2xl overflow-hidden">
                  <img
                    src="/promotion-banner.webp"
                    alt="Promoción temporal"
                    fetchPriority="high"
                    loading="eager"
                    decoding="sync"
                    className="w-full h-auto object-cover rounded-2xl"
                  />
                </div>
              </a>
            ) : (
              <>
                <div className="shadow-2xl rounded-2xl aspect-[16/9] md:aspect-[4/3] overflow-hidden">
                  <img
                    src={heroImage.src}
                    alt={heroImage.alt}
                    fetchPriority="high"
                    loading="eager"
                    decoding="sync"
                    className="w-full h-auto object-cover rounded-2xl"
                  />
                </div>

                {/* Floating badge */}
                <div className="-bottom-6 md:-bottom-6 sm:-left-4 lg:-left-6 absolute bg-red-600 shadow-lg p-6 rounded-2xl text-white">
                  <p className="font-bold text-2xl">{heroImage.badge.primary}</p>
                  <p className="text-base">{heroImage.badge.secondary}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
