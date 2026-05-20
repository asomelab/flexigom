import { lazy, Suspense, useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useProductBySlug } from "../hooks/use-products";
import { RichTextRenderer } from "@/components/rich-text-renderer";
import { ProductDetailSkeleton } from "@/components/product-detail-skeleton";
const SimilarProducts = lazy(() => import("../components/similar-products").then(m => ({ default: m.SimilarProducts })));
import { InstallmentBadge } from "@/components/ui/installment-badge";
import { cn, getImageUrl, formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Star,
  Plus,
  Minus,
  Share2,
  ChevronLeft,
} from "lucide-react";
import { handleShare } from "@/lib/utils";
import { pixel } from "@/lib/meta-pixel";
import { SEOHead } from "@/components/seo";
import { useCartStore } from "@/features/cart/store/cart-store";
import { toast } from "sonner";
import {
  createProductSEO,
  createProductSchema,
  createBreadcrumbSchema,
  type StructuredDataConfig,
} from "@/lib/seo";
import { getMeasurementLabel } from "../constants/products-constants";
export function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProductBySlug(slug || "");
  const documentId = product?.documentId;
  const [quantity, setQuantity] = useState(1);
  const [baseType, setBaseType] = useState<"Económica" | "Reforzada">(
    "Económica",
  );
  const addItem = useCartStore((state) => state.addItem);
  const isSyncing = useCartStore((state) => state.isSyncing);

  // Memoize images array to prevent hook dependency issues
  const images = useMemo(() => {
    return product?.images && Array.isArray(product.images)
      ? product.images
      : [];
  }, [product?.images]);

  // Calculate pricing values
  const isReinforced = product?.has_base_options && baseType === "Reforzada";
  const price = isReinforced
    ? Number(product?.reinforced_base_price) || Number(product?.price) || 0
    : Number(product?.price) || 0;
  const discountPrice = isReinforced
    ? Number(product?.reinforced_base_discount_price) || 0
    : Number(product?.discount_price) || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;
  const savings = hasDiscount ? price - discountPrice : 0;
  const hasImages = images.length > 0;

  const { seoConfig, productSchema, breadcrumbSchema } = useMemo(() => {
    if (!product) {
      return { seoConfig: null, productSchema: null, breadcrumbSchema: null };
    }

    const productImages = images
      .map((img: { url?: string }) => getImageUrl(img.url || ""))
      .filter((url): url is string => typeof url === "string");

    const descriptionText =
      product.description && Array.isArray(product.description)
        ? product.description
            .map(
              (block: { children?: Array<{ text?: string }> }) =>
                block.children?.map((child) => child.text || "").join("") || "",
            )
            .join(" ")
        : typeof product.description === "string"
          ? product.description
          : undefined;

    // Get brand once
    const brand =
      typeof product.brand === "string"
        ? product.brand
        : product.brand || "Flexigom";

    // Get category once
    const category = product.categories?.[0]?.name || "Producto";

    // SEO config
    const seoConfig = createProductSEO({
      name: product.name,
      description: descriptionText,
      price: hasDiscount ? formatPrice(discountPrice) : formatPrice(price),
      brand,
      category,
      images: productImages,
      documentId: documentId,
      slug: slug,
    });

    // Product schema
    const productSchema = createProductSchema({
      name: product.name,
      description:
        descriptionText || `${product.name} disponible en Flexigom Tucumán`,
      price: hasDiscount ? discountPrice.toString() : price.toString(),
      currency: "ARS",
      brand,
      category,
      images: productImages,
      availability: (product.stock || 0) > 0 ? "InStock" : "OutOfStock",
      condition: "NewCondition",
      sku: product.documentId,
    });

    // Breadcrumb schema
    const breadcrumbSchema = createBreadcrumbSchema([
      { name: "Inicio", url: "/" },
      { name: "Productos", url: "/productos" },
      { name: product.name, url: `/productos/${slug}` },
    ]);

    return { seoConfig, productSchema, breadcrumbSchema };
  }, [product, documentId, slug, images, hasDiscount, price, discountPrice]);

  // Track ViewContent event
  useEffect(() => {
    if (product && documentId) {
      pixel.viewContent({
        content_ids: [documentId],
        content_name: product.name,
        content_type: "product",
        content_category: product.categories?.[0]?.name,
        value: hasDiscount ? discountPrice : price,
        currency: "ARS",
      });
    }
  }, [product, documentId, hasDiscount, discountPrice, price]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="flex flex-col justify-center items-center space-y-4 min-h-[400px]">
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-destructive text-2xl">
            Producto no encontrado
          </h1>
          <p className="text-muted-foreground">
            El producto que buscas no existe o no está disponible.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/productos">
            <ChevronLeft className="mr-2 w-4 h-4" />
            Volver a Productos
          </Link>
        </Button>
      </div>
    );
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addItem(
        product,
        quantity,
        product.has_base_options ? baseType : undefined,
      );
      toast.success(`${product.name} agregado al carrito`, {
        description: `Cantidad: ${quantity}${product.has_base_options ? ` | Base: ${baseType}` : ""}`,
      });
    }
  };

  return (
    <>
      {seoConfig && (
        <SEOHead
          config={{
            ...seoConfig,
            structuredData: [productSchema, breadcrumbSchema].filter(
              (schema): schema is StructuredDataConfig => schema !== null,
            ),
          }}
        />
      )}
      <div className="mx-auto px-4 py-6 container">
        <div className="space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Inicio</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/productos">Productos</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {product.categories?.[0] && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={`/productos?category=${product.categories[0].slug}`}
                      >
                        {product.categories[0].name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back Button */}
          <Button
            asChild
            variant="ghost"
            className="w-fit h-auto text-gray-600 hover:text-gray-900 m"
          >
            <Link to="/productos">
              <ChevronLeft className="w-4 h-4" />
              Volver a Productos
            </Link>
          </Button>

          {/* Main Product Section */}
          <div className="gap-8 grid lg:grid-cols-2">
            {/* Image Carousel */}
            <div className="space-y-4">
              {hasImages ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.map((image, index) => (
                      <CarouselItem key={image.id || index}>
                        <div className="relative bg-gray-100 rounded-lg aspect-square overflow-hidden">
                          <img
                            src={getImageUrl(image.url) || "/flexigom.png"}
                            alt={
                              image.alternativeText ||
                              `Imagen ${index + 1} de ${product.name}`
                            }
                            className="w-full h-full object-cover"
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="flex justify-center items-center bg-gray-100 rounded-lg aspect-square">
                  <div className="space-y-2 text-center">
                    <Package className="mx-auto w-16 h-16 text-gray-400" />
                    <p className="text-muted-foreground">
                      Imagen no disponible
                    </p>
                  </div>
                </div>
              )}

              {/* Thumbnail row for multiple images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.slice(0, 4).map((image, index) => (
                    <div
                      key={image.id || index}
                      className="flex-shrink-0 bg-gray-100 border-2 hover:border-primary border-transparent rounded-md w-20 h-20 overflow-hidden transition-colors cursor-pointer"
                    >
                      <img
                        src={getImageUrl(image.url) || "/flexigom.png"}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {images.length > 4 && (
                    <div className="flex flex-shrink-0 justify-center items-center bg-gray-100 border-2 border-transparent rounded-md w-20 h-20 text-muted-foreground text-sm">
                      +{images.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Product Title */}
              <div>
                <h1 className="font-bold text-gray-900 text-3xl leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Product Badges */}
              <div className="flex flex-wrap gap-2">
                {product.brand && (
                  <Badge
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {product.brand.charAt(0).toUpperCase() +
                      product.brand.slice(1)}
                  </Badge>
                )}
                {product.categories?.map((category) => (
                  <Badge key={category.id} variant="outline">
                    {category.name}
                  </Badge>
                ))}
                {product.composition && (
                  <Badge variant="secondary">{product.composition}</Badge>
                )}
                {product.measurement && (
                  <Badge variant="default" className="capitalize">
                    {getMeasurementLabel(product.measurement)}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(product.rating!)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">
                    {product.rating.toFixed(1)}
                    {product.reviewCount && ` (${product.reviewCount} reviews)`}
                  </span>
                </div>
              )}

              {/* Price Section */}
              <Card className="p-6">
                <div className="space-y-3">
                  {hasDiscount && (
                    <Badge
                      variant="destructive"
                      className="bg-red-600 font-bold"
                    >
                      -{discountPercentage}% OFF
                    </Badge>
                  )}

                  <div className="space-y-2">
                    {hasDiscount ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500 text-sm line-through">
                            {formatPrice(price)}
                          </span>
                          <span className="font-bold text-red-600 text-3xl">
                            {formatPrice(discountPrice)}
                          </span>
                        </div>
                        <p className="font-medium text-green-600 text-sm">
                          Ahorras {formatPrice(savings)}
                        </p>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-900 text-3xl">
                        {formatPrice(price)}
                      </span>
                    )}
                    <div className="pt-2">
                      <InstallmentBadge className="text-sm px-3 py-1" />
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span
                      className={cn(
                        "font-medium text-sm",
                        product.stock > 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {product.stock > 0
                        ? `${product.stock} en stock`
                        : "Sin stock"}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Description */}
              {product.description &&
                Array.isArray(product.description) &&
                product.description.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-semibold text-xl">Descripción</h2>
                    <RichTextRenderer
                      content={product.description}
                      className="max-w-none text-gray-700 prose prose-sm"
                    />
                  </div>
                )}

              {/* Base Options Section */}
              {product.has_base_options && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Calidad de la Base</h3>
                  <RadioGroup
                    defaultValue="Económica"
                    value={baseType}
                    onValueChange={(val) =>
                      setBaseType(val as "Económica" | "Reforzada")
                    }
                  >
                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="Económica" id="base-economica" />
                      <Label
                        htmlFor="base-economica"
                        className="cursor-pointer w-full h-full flex-1"
                      >
                        Base Económica (Ecocuero)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="Reforzada" id="base-reforzada" />
                      <Label
                        htmlFor="base-reforzada"
                        className="cursor-pointer w-full h-full flex-1"
                      >
                        Base Reforzada (Tela)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Quantity Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm">Cantidad</h3>
                  <span className="text-green-600 text-sm">
                    Stock disponible
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 w-10 h-10"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1 || isSyncing}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 font-medium text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 w-10 h-10"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock || isSyncing}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="font-medium text-green-600 text-sm">
                    {product.stock} unidades
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 h-12 font-medium text-white"
                  disabled={product.stock <= 0 || isSyncing}
                  onClick={handleAddToCart}
                >
                  {isSyncing ? (
                    <ShoppingCart className="mr-2 w-5 h-5 animate-pulse" />
                  ) : (
                    <ShoppingCart className="mr-2 w-5 h-5" />
                  )}
                  {product.stock > 0
                    ? isSyncing
                      ? "Agregando..."
                      : "Agregar al Carrito"
                    : "Sin Stock"}
                </Button>
                {/* <Button variant="outline" size="icon" className="w-12 h-12">
                  <Heart className="w-5 h-5" />
                </Button> */}
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => handleShare(product)}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Shipping Info */}
              <div className="gap-4 grid grid-cols-3 pt-4 border-t">
                <div className="space-y-1 text-center">
                  <div className="flex justify-center items-center bg-green-100 mx-auto rounded-full w-8 h-8">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="font-medium text-xs">Envío Gratis</p>
                  <p className="text-gray-500 text-xs">En compras +$50.000</p>
                </div>
                <div className="space-y-1 text-center">
                  <div className="flex justify-center items-center bg-blue-100 mx-auto rounded-full w-8 h-8">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-medium text-xs">Garantía</p>
                  <p className="text-gray-500 text-xs">5 años</p>
                </div>
                <div className="space-y-1 text-center">
                  <div className="flex justify-center items-center bg-purple-100 mx-auto rounded-full w-8 h-8">
                    <ArrowLeft className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="font-medium text-xs">Devolución</p>
                  <p className="text-gray-500 text-xs">30 días</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          {product.specifications &&
            Array.isArray(product.specifications) &&
            product.specifications.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 font-semibold text-xl">Especificaciones</h2>
                <Accordion type="single" collapsible defaultValue="item-0">
                  <AccordionItem value="item-0">
                    <AccordionTrigger>Detalles del Producto</AccordionTrigger>
                    <AccordionContent>
                      <RichTextRenderer
                        content={product.specifications}
                        className="max-w-none text-gray-700 prose prose-sm"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            )}

          {/* Similar Products */}
          {product && (
            <Suspense fallback={<div className="h-40" />}>
              <SimilarProducts
                currentProductId={product.documentId}
                categorySlug={product.categories?.[0]?.slug}
              />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
}

export const Component = ProductDetailPage;
