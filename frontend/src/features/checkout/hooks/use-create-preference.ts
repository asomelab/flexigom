import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  createPaymentPreference,
  buildPreferenceRequest,
} from "../services/mercadopago-service";
import type {
  MercadoPagoPreferenceResponse,
  MercadoPagoErrorResponse,
} from "../types/mercadopago-types";
import type { CartItem } from "@/features/cart/types";
import type { ShippingFormData } from "@/features/cart/types";

/**
 * Input parameters for creating a payment preference
 */
export interface CreatePreferenceParams {
  cartItems: CartItem[];
  shippingData: ShippingFormData;
  externalReference?: string;
}

/**
 * Hook for creating MercadoPago payment preference
 * Returns mutation with loading, error, and success states
 */
export function useCreatePreference() {
  return useMutation<
    MercadoPagoPreferenceResponse,
    AxiosError<MercadoPagoErrorResponse>,
    CreatePreferenceParams
  >({
    mutationFn: async (params: CreatePreferenceParams) => {
      const { cartItems, shippingData, externalReference } = params;

      const items = cartItems.map((item) => {
        const price = Number(item.price) || 0;

        return {
          title: item.product.name,
          quantity: item.quantity,
          unit_price: price,
          description: [
            typeof item.product.description === "string"
              ? item.product.description
              : "",
            item.composition ? `Composición: ${item.composition}` : "",
            item.measurement ? `Medida: ${item.measurement}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
          category_id: item.product.categories?.[0]?.name || undefined,
        };
      });

      const payer = {
        name: shippingData.firstName,
        surname: shippingData.lastName,
        email: shippingData.email,
        phone: shippingData.phone,
        documentType: shippingData.documentType,
        documentNumber: shippingData.documentNumber,
        fiscalCategory: shippingData.fiscalCategory,
        address: `${shippingData.address}, ${shippingData.city}, ${shippingData.province} ${shippingData.postalCode}`,
        city: shippingData.city,
        province: shippingData.province,
        postalCode: shippingData.postalCode,
      };

      // Get webhook URL from environment variable
      // This should be the publicly accessible URL for the backend webhook endpoint
      const notificationUrl = import.meta.env.VITE_MERCADOPAGO_WEBHOOK_URL;

      const preferenceRequest = buildPreferenceRequest({
        items,
        payer,
        externalReference: externalReference || `ORDER-${Date.now()}`,
        notificationUrl,
      });

      return createPaymentPreference(preferenceRequest);
    },
    onSuccess: (data) => {
      toast.success("Redirigiendo a MercadoPago...");

      const checkoutUrl =
        import.meta.env.VITE_NODE_ENV === "production"
          ? data.init_point
          : data.sandbox_init_point || data.init_point;

      window.location.href = checkoutUrl;
    },
    onError: (error) => {
      console.error("Error creating MercadoPago preference:", error);

      let errorMessage =
        "Error al procesar el pago. Por favor, intenta nuevamente.";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.message) {
          errorMessage = errorData.message;
        }

        if (errorData.details && errorData.details.length > 0) {
          const detailMessages = errorData.details
            .map((detail) => detail.message)
            .join(", ");
          errorMessage = `${errorMessage}: ${detailMessages}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    },
    retry: 1,
    retryDelay: 1000,
  });
}
