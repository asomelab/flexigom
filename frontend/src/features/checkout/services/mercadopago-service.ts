/**
 * MercadoPago service
 * Handles API calls to backend MercadoPago endpoints
 * SECURITY: Never exposes ACCESS_TOKEN (stays in backend)
 */

import api from "@/lib/api";
import type {
  MercadoPagoPreferenceRequest,
  MercadoPagoPreferenceResponse,
} from "../types/mercadopago-types";

/**
 * Create a MercadoPago payment preference
 * Sends cart data to backend which securely creates preference with MP
 */
export async function createPaymentPreference(
  data: MercadoPagoPreferenceRequest,
): Promise<MercadoPagoPreferenceResponse> {
  const response = await api.post<{ data: MercadoPagoPreferenceResponse }>(
    "/mercadopago/create-preference",
    data,
  );

  return response.data.data;
}

/**
 * Build preference request from cart and user data
 * Helper function to transform cart items to MercadoPago format
 */
export function buildPreferenceRequest(params: {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    description?: string;
    category_id?: string;
  }>;
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
    documentType?: "DNI" | "CUIT";
    documentNumber?: string;
    fiscalCategory?:
      | "CONSUMIDOR_FINAL"
      | "RESPONSABLE_INSCRIPTO"
      | "EXENTO"
      | "MONOTRIBUTISTA";
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  externalReference?: string;
  notificationUrl?: string;
}): MercadoPagoPreferenceRequest {
  const { items, payer, externalReference, notificationUrl } = params;

  const preferenceRequest: MercadoPagoPreferenceRequest = {
    items: items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
      description: item.description,
      category_id: item.category_id,
    })),
    external_reference: externalReference,
    notification_url: notificationUrl,
    metadata: payer?.fiscalCategory
      ? {
          customer_fiscal_category: payer.fiscalCategory,
        }
      : undefined,
  };

  // Add payer information if provided
  if (payer) {
    preferenceRequest.payer = {
      name: payer.name,
      surname: payer.surname,
      email: payer.email,
    };

    // Add document identification if provided
    if (payer.documentNumber && payer.documentType) {
      preferenceRequest.payer.identification = {
        type: payer.documentType,
        number: payer.documentNumber,
      };
    }

    // Add phone if provided
    if (payer.phone) {
      const phoneMatch = payer.phone.match(/^(\d{2,4})?(\d+)$/);
      if (phoneMatch) {
        preferenceRequest.payer.phone = {
          area_code: phoneMatch[1] || "",
          number: phoneMatch[2] || payer.phone,
        };
      }
    }

    // Add address if provided
    if (payer.address) {
      preferenceRequest.payer.address = {
        street_name: payer.address,
        zip_code: payer.postalCode,
      };
    }
  }

  return preferenceRequest;
}
