import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCartStore,
  selectAppliedCoupon,
} from "@/features/cart/store/cart-store";
import api from "@/lib/api";
import { Tag, X, Loader2 } from "lucide-react";

export function CouponInput() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appliedCoupon = useCartStore(selectAppliedCoupon);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // API call to Strapi to find an active coupon matching the code
      const { data } = await api.get(
        `/coupons?filters[code][$eq]=${code.trim()}&filters[isActive][$eq]=true`,
      );

      const coupons = data.data;
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        // Check expiration
        let isExpired = false;
        if (coupon.expirationDate) {
          const expDate = new Date(coupon.expirationDate);
          if (new Date() > expDate) {
            isExpired = true;
          }
        }

        if (isExpired) {
          setError("Este cupón ha expirado");
        } else {
          applyCoupon(coupon);
          setCode("");
        }
      } else {
        setError("Cupón inválido o inactivo");
      }
    } catch (err) {
      console.error("Error applying coupon", err);
      setError("Error al validar el cupón");
    } finally {
      setIsLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center text-green-700">
          <Tag className="w-4 h-4 mr-2" />
          <span className="font-medium">
            Cupón aplicado: {appliedCoupon.code}
          </span>
        </div>
        <button
          onClick={removeCoupon}
          className="p-1 text-green-600 hover:text-green-800 transition-colors"
          title="Remover cupón"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Código de descuento"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="uppercase"
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={isLoading || !code.trim()}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
