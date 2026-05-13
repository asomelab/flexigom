import { ProductCard } from "@/features/home/components/product-card";
import { useSimilarProducts } from "../hooks/use-products";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Product } from "@/types";

interface SimilarProductsProps {
  currentProductId: string;
  categorySlug?: string;
}

export function SimilarProducts({
  currentProductId,
  categorySlug,
}: SimilarProductsProps) {
  const { data: products = [], isLoading } = useSimilarProducts(
    categorySlug,
    currentProductId,
  );

  if (isLoading || products.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t">
      <h2 className="font-bold text-gray-900 text-2xl mb-6">
        También te puede interesar
      </h2>

      {/* Mobile view: Carousel */}
      <div className="md:hidden">
        <Carousel className="w-full" opts={{ align: "start" }}>
          <CarouselContent className="-ml-3 pb-4">
            {products.map((product: Product) => (
              <CarouselItem
                key={product.id}
                className="pl-3 basis-[60%] sm:basis-1/2"
              >
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop view: Grid */}
      <div className="hidden md:block">
        <Carousel className="w-full" opts={{ align: "start" }}>
          <CarouselContent className="-ml-4 pb-4">
            {products.map((product: Product) => (
              <CarouselItem
                key={product.id}
                className="pl-4 basis-1/3 lg:basis-1/4"
              >
                <ProductCard product={product} className="h-full" />
              </CarouselItem>
            ))}
          </CarouselContent>
          {products.length > 4 && (
            <>
              <CarouselPrevious className="-left-4" />
              <CarouselNext className="-right-4" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}
