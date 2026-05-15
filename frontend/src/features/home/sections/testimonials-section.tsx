import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { SectionTitle } from "../components/section-title";
import { testimonialsConfig } from "../config/testimonials-config";
import type { Review, ReviewsSectionProps } from "../types";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useReviews } from "../hooks/use-reviews";
import { getCustomerSinceYear } from "@/lib/utils";
import { TestimonialsSkeleton } from "@/features/products/skeletons/testimonials-skeleton";
interface ReviewCardProps {
  testimonial: Review;
}

interface DotIndicatorsProps {
  totalSlides: number;
  currentSlide: number;
  onDotClick: (index: number) => void;
}

function DotIndicators({
  totalSlides,
  currentSlide,
  onDotClick,
}: DotIndicatorsProps) {
  return (
    <div className="flex justify-center gap-2 mt-8">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          className={cn(
            "rounded-full w-2 h-2 transition-all duration-300 cursor-pointer",
            currentSlide === index
              ? "bg-red-600 w-8"
              : "bg-gray-300 hover:bg-gray-400",
          )}
          onClick={() => onDotClick(index)}
          aria-label={`Go to testimonial ${index + 1}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ testimonial }: ReviewCardProps) {
  const rating = testimonial.rating ?? 5;
  const testimonialText = testimonial.testimonial ?? "";
  const customerName = testimonial.customerName ?? "Anónimo";
  const customerLocation =
    testimonial.customerLocation ?? "San Miguel de Tucumán";

  return (
    <div className="flex flex-col bg-white shadow-lg hover:shadow-xl p-6 border border-gray-100 rounded-xl w-full min-w-0 h-full transition-shadow duration-300">
      {/* Star Rating */}
      <div className="flex mb-4">
        {Array.from({ length: Math.max(1, Math.min(5, rating)) }).map(
          (_, index) => (
            <Star key={index} className="fill-current w-5 h-5 text-red-600" />
          ),
        )}
      </div>

      {/* Testimonial Text - Grows to fill available space */}
      <blockquote className="flex flex-grow items-start mb-6 min-h-[4rem] text-gray-700 text-base break-all italic leading-relaxed">
        "{testimonialText}"
      </blockquote>

      <Separator className="my-4" />

      {/* Customer Info - Always at bottom */}
      <div className="space-y-2 mt-auto leading-relaxed">
        <p className="font-bold text-black text-lg">{customerName}</p>
        <p className="text-gray-600 text-sm">{customerLocation}</p>
        <p className="font-medium text-red-600 text-xs">
          Cliente desde {getCustomerSinceYear(testimonial.customerSince)}
        </p>
      </div>
    </div>
  );
}

export function TestimonialsSection({
  content,
  className,
}: ReviewsSectionProps = {}) {
  const { data: reviews, isLoading, error } = useReviews();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const testimonials = useMemo(
    () =>
      reviews?.filter(
        (review) =>
          review && review.testimonial && review.testimonial.trim().length > 0,
      ) ?? [],
    [reviews],
  );

  const sectionContent = {
    ...testimonialsConfig,
    ...content,
    testimonials,
  };

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const scrollToSlide = (index: number) => {
    api?.scrollTo(index);
  };

  if (isLoading) {
    return (
      <section className={cn("bg-gray-50 py-12 md:py-16", className)}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <SectionTitle
            title={sectionContent.title}
            subtitle={sectionContent.subtitle}
            className="mb-12 md:mb-16"
          />
          <TestimonialsSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn("bg-gray-50 py-12 md:py-16", className)}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <SectionTitle
            title={sectionContent.title}
            subtitle={sectionContent.subtitle}
            className="mb-12 md:mb-16"
          />
          <div className="flex flex-col justify-center items-center py-12 text-center">
            <div className="mb-4 text-gray-500">
              Error al cargar los testimonios
            </div>
            <div className="text-gray-400 text-sm">
              Por favor, inténtalo de nuevo más tarde.
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && testimonials.length === 0) {
    return null;
  }

  return (
    <section className={cn("bg-gray-50 py-12 md:py-16", className)}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Section Title */}
        <SectionTitle
          title={sectionContent.title}
          subtitle={sectionContent.subtitle}
          className="mb-12 md:mb-16"
        />

        {/* Testimonials Display */}
        <div className="relative">
          {sectionContent.testimonials.length > 3 ? (
            <>
              {/* Carousel for 4+ reviews */}
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                orientation="horizontal"
                className="mx-auto w-full max-w-sm md:max-w-xl xl:max-w-6xl"
                setApi={setApi}
              >
                <CarouselContent className="-ml-1">
                  {sectionContent.testimonials.map(
                    (testimonial: Review, index: number) => (
                      <CarouselItem
                        key={
                          testimonial.documentId ||
                          testimonial.id ||
                          `testimonial-${index}`
                        }
                        className="flex-shrink-0 pl-6 basis-full md:basis-1/2 xl:basis-1/3"
                      >
                        <ReviewCard testimonial={testimonial} />
                      </CarouselItem>
                    ),
                  )}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>

              {/* Dot Indicators */}
              <DotIndicators
                totalSlides={count}
                currentSlide={current - 1}
                onDotClick={scrollToSlide}
              />
            </>
          ) : (
            /* Grid layout for 1-3 reviews */
            <div
              className={`grid gap-6 mx-auto max-w-6xl ${
                sectionContent.testimonials.length === 1
                  ? "grid-cols-1 max-w-md"
                  : sectionContent.testimonials.length === 2
                    ? "grid-cols-1 md:grid-cols-2 max-w-4xl"
                    : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              }`}
            >
              {sectionContent.testimonials.map(
                (testimonial: Review, index: number) => (
                  <div
                    key={
                      testimonial.documentId ||
                      testimonial.id ||
                      `testimonial-${index}`
                    }
                  >
                    <ReviewCard testimonial={testimonial} />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
