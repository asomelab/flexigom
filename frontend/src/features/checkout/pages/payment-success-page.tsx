/**
 * Payment Success Page
 * Shown when user successfully completes payment on MercadoPago
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Package, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/features/cart/store/cart-store";
import { pixel } from "@/lib/meta-pixel";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  // Get payment info from URL params
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const externalReference = searchParams.get("external_reference");
  const merchantOrderId = searchParams.get("merchant_order_id");

  // Clear cart on successful payment
  useEffect(() => {
    if (status === "approved") {
      const total = useCartStore.getState().getTotal();

      // Track Purchase event (only if there is a valid total to avoid duplicate tracking on reload)
      if (total > 0) {
        pixel.purchase({
          value: total,
          currency: "ARS",
          order_id: externalReference || merchantOrderId || undefined,
        });
      }

      clearCart();
    }
  }, [status, clearCart, externalReference, merchantOrderId]);

  return (
    <div className="mx-auto px-4 py-12 container">
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex justify-center items-center bg-green-100 rounded-full w-20 h-20">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="mb-4 font-bold text-3xl text-green-600">
            ¡Pago Exitoso!
          </h1>

          <p className="mb-8 text-lg text-muted-foreground">
            Tu pago ha sido procesado correctamente. Recibirás un correo
            electrónico con los detalles de tu compra.
          </p>

          {/* Order Details */}
          <div className="mb-8 space-y-3 text-left">
            {externalReference && (
              <div className="flex justify-between items-center border-b py-3">
                <span className="font-medium text-sm">Número de Orden:</span>
                <span className="font-mono text-sm">{externalReference}</span>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between items-center border-b py-3">
                <span className="font-medium text-sm">ID de Pago:</span>
                <span className="font-mono text-sm">{paymentId}</span>
              </div>
            )}
            {merchantOrderId && (
              <div className="flex justify-between items-center border-b py-3">
                <span className="font-medium text-sm">
                  ID de Orden MercadoPago:
                </span>
                <span className="font-mono text-sm">{merchantOrderId}</span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 mb-8 p-6 rounded-lg text-left">
            <div className="flex items-start gap-3 mb-4">
              <Package className="flex-shrink-0 mt-1 w-5 h-5 text-blue-600" />
              <div>
                <h3 className="mb-2 font-semibold text-blue-900">
                  Próximos Pasos
                </h3>
                <ul className="space-y-2 text-blue-800 text-sm list-disc list-inside">
                  <li>
                    Recibirás un correo de confirmación con los detalles de tu
                    pedido
                  </li>
                  <li>
                    Procesaremos tu orden y te notificaremos cuando esté lista
                    para envío
                  </li>
                  <li>
                    Podrás rastrear tu pedido con el número de orden
                    proporcionado
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate("/productos")}
              variant="outline"
              className="flex-1"
            >
              <Package className="mr-2 w-4 h-4" />
              Ver Productos
            </Button>
            <Button
              onClick={() => navigate("/")}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Home className="mr-2 w-4 h-4" />
              Volver al Inicio
            </Button>
          </div>

          {/* Support Link */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-muted-foreground text-sm">
              ¿Necesitas ayuda?{" "}
              <button
                onClick={() => navigate("/contacto")}
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
              >
                Contáctanos
                <ArrowRight className="w-3 h-3" />
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export const Component = PaymentSuccessPage;
