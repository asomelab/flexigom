/**
 * MercadoPago Checkout Button
 * Reusable component for initiating MercadoPago payment flow
 */

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCreatePreference } from "../hooks/use-create-preference";
import type { CartItem, ShippingFormData } from "@/features/cart/types";
import type { Coupon } from "@/features/cart/types/cart-types";

interface MercadoPagoCheckoutButtonProps {
  cartItems: CartItem[];
  shippingData: ShippingFormData;
  appliedCoupon?: Coupon | null;
  externalReference?: string;
  disabled?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

export function MercadoPagoCheckoutButton({
  cartItems,
  shippingData,
  appliedCoupon,
  externalReference,
  disabled = false,
  className = "",
  onError,
}: MercadoPagoCheckoutButtonProps) {
  const { mutate: createPreference, isPending } = useCreatePreference();

  const handleCheckout = () => {
    // Validate cart has items
    if (!cartItems || cartItems.length === 0) {
      const error = new Error("El carrito está vacío");
      onError?.(error);
      return;
    }

    // Validate shipping data
    if (!shippingData) {
      const error = new Error("Faltan datos de envío");
      onError?.(error);
      return;
    }

    // Create payment preference
    createPreference({
      cartItems,
      shippingData,
      couponCode: appliedCoupon?.code,
      externalReference: externalReference || `ORDER-${Date.now()}`,
    });
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isPending}
      className={`flex-1 bg-blue-600 hover:bg-blue-700 ${className}`}
      size="lg"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <svg
            className="mr-2 w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.596 15.508c-.188.469-.844.781-1.375.781-.188 0-.375-.031-.531-.125l-3.625-2.156c-.281-.156-.469-.469-.469-.813V7.969c0-.531.438-.969.969-.969s.969.438.969.969v4.781l3.313 1.969c.469.281.625.875.344 1.344z" />
          </svg>
          Pagar con MercadoPago
        </>
      )}
    </Button>
  );
}
