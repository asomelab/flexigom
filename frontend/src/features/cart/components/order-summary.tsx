import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Package, MapPin, CreditCard } from "lucide-react";
import { useCart } from "../hooks/use-cart";
import { MercadoPagoCheckoutButton } from "@/features/checkout";
import { CouponInput } from "@/features/checkout/components/coupon-input";
import type { ShippingFormData, PaymentFormData } from "../types";

interface OrderSummaryProps {
  shippingData: ShippingFormData;
  paymentData: PaymentFormData;
  onSubmit: () => void;
  onBack?: () => void;
  isProcessing?: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  mercadopago: "Mercado Pago",
  transfer: "Transferencia Bancaria",
  cash: "Efectivo al recibir",
  credit_card: "Tarjeta de Crédito",
  debit_card: "Tarjeta de Débito",
};

export function OrderSummary({
  shippingData,
  paymentData,
  onSubmit,
  onBack,
  isProcessing = false,
}: OrderSummaryProps) {
  const { items, subtotal, total, appliedCoupon } = useCart();

  const shippingCost = subtotal >= 50000 ? 0 : 0; // Free shipping over $50k, otherwise 0 for now

  return (
    <div className="space-y-6">
      {/* Products Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">Resumen del Pedido</h3>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const price = Number(item.price) || 0;
            const imageUrl =
              item.product.images && item.product.images.length > 0
                ? getImageUrl(item.product.images[0].url)
                : "/flexigom.png";

            return (
              <div
                key={item.product.documentId}
                className="flex gap-3 pb-3 border-b last:border-b-0"
              >
                <div className="flex-shrink-0 bg-gray-100 rounded w-16 h-16 overflow-hidden">
                  <img
                    src={imageUrl || "/flexigom.png"}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <p className="font-medium text-sm line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(price * item.quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="mb-4">
          <CouponInput />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="font-medium">
                Descuento (
                {appliedCoupon.type === "percentage"
                  ? `${appliedCoupon.value}%`
                  : `$${appliedCoupon.value}`}
                )
              </span>
              <span>-{formatPrice(subtotal - total)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span className={shippingCost === 0 ? "text-green-600" : ""}>
              {shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-base">Total</span>
            <span className="font-bold text-primary text-xl">
              {formatPrice(total + shippingCost)}
            </span>
          </div>
        </div>
      </Card>

      {/* Shipping Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">Información de Envío</h3>
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">
              {shippingData.firstName} {shippingData.lastName}
            </span>
          </p>
          <p className="text-muted-foreground">{shippingData.email}</p>
          <p className="text-muted-foreground">{shippingData.phone}</p>
          <Separator className="my-3" />
          <p className="text-muted-foreground">{shippingData.address}</p>
          <p className="text-muted-foreground">
            {shippingData.city}, {shippingData.province}{" "}
            {shippingData.postalCode}
          </p>
          {shippingData.additionalInfo && (
            <>
              <Separator className="my-3" />
              <p className="text-muted-foreground text-xs">
                {shippingData.additionalInfo}
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">Método de Pago</h3>
        </div>

        <p className="text-sm">
          {paymentMethodLabels[paymentData.paymentMethod] ||
            paymentData.paymentMethod}
        </p>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isProcessing}
          >
            Volver
          </Button>
        )}
        {paymentData.paymentMethod === "mercadopago" ? (
          <MercadoPagoCheckoutButton
            cartItems={items}
            shippingData={shippingData}
            appliedCoupon={appliedCoupon}
            externalReference={`ORDER-${Date.now()}`}
            disabled={isProcessing}
            className="flex-1"
          />
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? "Procesando..." : "Confirmar Pedido"}
          </Button>
        )}
      </div>

      {/* Terms */}
      <p className="text-muted-foreground text-xs text-center">
        Al confirmar tu pedido, aceptas nuestros{" "}
        <a href="/terminos" className="hover:text-foreground underline">
          Términos y Condiciones
        </a>{" "}
        y{" "}
        <a href="/privacidad" className="hover:text-foreground underline">
          Política de Privacidad
        </a>
        .
      </p>
    </div>
  );
}
