import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  total: number;
  shipping?: number;
  discount?: number;
}

export function CartSummary({
  subtotal,
  total,
  shipping = 0,
  discount = 0,
}: CartSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Descuento</span>
          <span className="font-medium text-green-600">
            -{formatPrice(discount)}
          </span>
        </div>
      )}

      {shipping > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span className="font-medium">{formatPrice(shipping)}</span>
        </div>
      )}

      {shipping === 0 && subtotal > 50000 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Envío</span>
          <span className="font-medium text-green-600">Gratis</span>
        </div>
      )}

      <Separator />

      <div className="flex justify-between items-center">
        <span className="font-semibold text-base">Total</span>
        <span className="font-bold text-primary text-xl">
          {formatPrice(total + shipping - discount)}
        </span>
      </div>

      {subtotal < 50000 && (
        <p className="text-muted-foreground text-xs">
          Agrega {formatPrice(50000 - subtotal)} más para envío gratis
        </p>
      )}
    </div>
  );
}
