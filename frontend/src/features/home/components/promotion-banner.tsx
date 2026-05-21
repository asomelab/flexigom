import { usePromotionBanner } from "../hooks/use-promotion-banner";

export function PromotionBanner() {
  const { data: banner, isLoading, error } = usePromotionBanner();

  if (isLoading || error || !banner || !banner.isActive) {
    return null;
  }

  const BannerContent = () => (
    <div className="flex items-center gap-2 px-20">
      <span className="font-bold">{banner.title}</span>
      <span>- {banner.description}</span>
      {banner.discount > 0 && <span>({banner.discount}% OFF)</span>}
      <a
        href={banner.ctaUrl}
        className="underline hover:no-underline font-medium"
      >
        {banner.ctaText}
      </a>
    </div>
  );

  return (
    <div className="bg-red-700 text-primary-foreground py-3 text-sm overflow-hidden flex whitespace-nowrap">
      <div className="animate-marquee flex">
        {[...Array(6)].map((_, i) => (
          <BannerContent key={i} />
        ))}
      </div>
    </div>
  );
}
