import { cn, getImageUrl, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { InstallmentBadge } from "@/components/ui/installment-badge";
import type { Product } from "@/types";
import { Link } from "react-router";
import { useState } from "react";
import { useCartStore } from "@/features/cart/store/cart-store";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { getMeasurementLabel } from "@/features/products/constants/products-constants";
interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const images =
    product.images && Array.isArray(product.images) ? product.images : [];
  const imageUrl = getImageUrl(images[0]?.url, { width: 800 });
  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discount_price) || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const addItem = useCartStore((state) => state.addItem);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const [isAdded, setIsAdded] = useState(false);

  const [api, setApi] = useState<CarouselApi>();

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock > 0) {
      await addItem(product, 1);
      setIsAdded(true);
      toast.success(`${product.name} agregado al carrito`);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  return (
    <Link
      to={`/productos/${product.slug}`}
      className={cn(
        "group flex flex-col bg-white shadow-md hover:shadow-xl border border-gray-100 rounded-xl h-full overflow-hidden transition-all duration-300",
        className,
      )}
    >
      <div className="relative flex justify-center items-center bg-gray-100 aspect-square overflow-hidden group/image">
        {images.length > 1 ? (
          <div className="w-full h-full flex flex-col relative select-none">
            <Carousel
              setApi={setApi}
              className="w-full h-full"
              opts={{ loop: true }}
            >
              <CarouselContent className="h-full ml-0">
                {images.map((img, index) => (
                  <CarouselItem
                    key={img.id || index}
                    className="h-full pl-0 relative overflow-hidden"
                  >
                    <img
                      src={getImageUrl(img.url, { width: 800 }) || undefined}
                      alt={
                        img.alternativeText ||
                        `Imagen ${index + 1} de ${product.name}`
                      }
                      className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Arrows appear on hover of image area group/image */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <CarouselPrevious
                  className="relative inset-0 translate-x-0 translate-y-0 h-8 w-8 scale-90 md:scale-100 bg-white/90 hover:bg-white pointer-events-auto border-none shadow-md text-gray-700 hover:text-gray-900"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    api?.scrollPrev();
                  }}
                />
                <CarouselNext
                  className="relative inset-0 translate-x-0 translate-y-0 h-8 w-8 scale-90 md:scale-100 bg-white/90 hover:bg-white pointer-events-auto border-none shadow-md text-gray-700 hover:text-gray-900"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    api?.scrollNext();
                  }}
                />
              </div>
            </Carousel>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={
              product.images?.[0]?.alternativeText ||
              `Imagen de ${product.name}`
            }
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <img
            src="/flexigom.png"
            alt={product.name}
            className="w-2/3 h-auto opacity-50"
          />
        )}

        {hasDiscount && (
          <Badge
            variant="destructive"
            className="top-2 right-2 absolute bg-red-600 hover:bg-red-700 font-bold text-white text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5 z-30"
          >
            -{discountPercentage}%
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-5 gap-2 sm:gap-4">
        <div className="flex-1 flex flex-col gap-1 sm:gap-3">
          <h3 className="font-bold text-gray-900 text-sm sm:text-lg line-clamp-2 leading-tight">
            {product.name || "Producto sin nombre"}
          </h3>

          {/* Brand, category, composition and measurement tags */}
          <div className="flex flex-wrap gap-1">
            {product.brand && (
              <Badge
                variant="destructive"
                className="text-xs max-w-full truncate"
              >
                {product.brand.charAt(0).toUpperCase() + product.brand.slice(1)}
              </Badge>
            )}
            {product.categories?.[0]?.name && (
              <Badge variant="outline" className="text-xs max-w-full truncate">
                {product.categories[0].name}
              </Badge>
            )}
            {product.composition && (
              <Badge
                variant="secondary"
                className="text-xs max-w-full truncate"
              >
                {product.composition}
              </Badge>
            )}
            {product.measurement && (
              <Badge
                variant="default"
                className="text-[10px] lg:text-xs capitalize max-w-full truncate"
              >
                {getMeasurementLabel(product.measurement)}
              </Badge>
            )}
          </div>

          {/* Star rating */}
          {product.rating && (
            <div className="hidden sm:block">
              <StarRating
                rating={product.rating}
                reviewCount={product.reviewCount}
                size="sm"
              />
            </div>
          )}

          <div className="space-y-0.5 sm:space-y-1 mt-auto">
            {hasDiscount ? (
              <>
                <div className="flex flex-row flex-wrap items-center gap-1.5 sm:space-x-3">
                  <span className="font-bold text-red-600 text-base sm:text-2xl leading-none">
                    {formatPrice(discountPrice)}
                  </span>
                  <span className="text-gray-700 text-xs sm:text-sm line-through leading-none">
                    {formatPrice(price)}
                  </span>
                </div>
                <div className="font-medium text-green-600 text-sm md:text-base mt-1">
                  Ahorras {formatPrice(price - discountPrice)}
                </div>
              </>
            ) : (
              <span className="font-bold text-gray-900 text-base sm:text-xl leading-none">
                {formatPrice(price)}
              </span>
            )}
            <div className="pt-0.5">
              <InstallmentBadge />
            </div>
          </div>

          {product.description &&
            Array.isArray(product.description) &&
            product.description.length > 0 && (
              <div className="hidden sm:block mt-2">
                <p className="overflow-hidden text-gray-600 text-sm break-words line-clamp-2 leading-relaxed">
                  {product.description[0]?.children
                    ?.map((child) => child.text || "")
                    .join("") || ""}
                </p>
              </div>
            )}
        </div>

        <div className="flex gap-2 mt-2 w-full relative z-10">
          <div className="flex-[7] flex bg-gray-100 group-hover:bg-gray-200 text-gray-900 font-medium items-center justify-center h-8 sm:h-10 rounded-md transition-colors text-xs sm:text-sm">
            Ver Producto
          </div>
          <button
            aria-label="Agregar producto al carrito"
            onClick={handleAddToCart}
            className={cn(
              "flex-[3] flex font-medium text-white items-center justify-center h-8 sm:h-10 rounded-md transition-colors text-xs sm:text-sm",
              isAdded
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700 disabled:bg-gray-400",
            )}
            disabled={product.stock <= 0 || isSyncing}
          >
            {isSyncing ? (
              <ShoppingCart className="w-4 h-4 lg:mr-1.5 animate-pulse" />
            ) : isAdded ? (
              <span className="flex items-center gap-1">
                <span className="hidden lg:inline">Agregado</span> ✓
              </span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 lg:mr-1.5" />
                <span className="hidden lg:inline">Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
