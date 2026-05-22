/**
 * mercadopago service
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import * as webhookUtils from "../utils/webhook";
import { normalizeDocumentType } from "../utils/webhook";

// Types for the preference creation
export interface PreferenceItem {
  productId: string;
  quantity: number;
  composition?: string;
  measurement?: string;
  base_type?: "Económica" | "Reforzada";
}

export interface PreferencePayer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
  identification?: {
    type?: string;
    number?: string;
  };
  address?: {
    zip_code?: string;
    street_name?: string;
    street_number?: string;
  };
}

export interface CreatePreferenceRequest {
  items: PreferenceItem[];
  couponCode?: string;
  payer?: PreferencePayer;
  external_reference?: string;
  notification_url?: string;
  metadata?: Record<string, any>;
}

export interface CreatePreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  collector_id: number;
  external_reference?: string;
}

// Initialize MercadoPago client
const initMercadoPago = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN is not configured in environment variables"
    );
  }

  const client = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 5000,
    },
  });

  return new Preference(client);
};

export default () => ({
  /**
   * Calculate order items and totals securely from backend product prices.
   * Shared by createPreference and createManualOrder.
   */
  async calculateOrderItems(
    items: PreferenceItem[],
    couponCode?: string
  ): Promise<{ mpItems: any[]; subtotal: number; discountAmount: number; finalTotal: number }> {
    let subtotal = 0;
    const mpItems: any[] = [];

    for (const item of items) {
      const product = await strapi.db.query('api::product.product').findOne({
        where: { documentId: item.productId },
        populate: ['categories', 'images'],
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const isReinforced = product.has_base_options && item.base_type === "Reforzada";
      const basePrice = isReinforced
        ? Number(product.reinforced_base_price) || Number(product.price) || 0
        : Number(product.price) || 0;
      const discountPrice = isReinforced
        ? Number(product.reinforced_base_discount_price) || 0
        : Number(product.discount_price) || 0;
      const finalPrice = discountPrice > 0 && discountPrice < basePrice ? discountPrice : basePrice;

      const descriptionParts: string[] = [];
      if (typeof product.description === "string") descriptionParts.push(product.description);
      if (item.composition) descriptionParts.push(`Composición: ${item.composition}`);
      if (item.measurement) descriptionParts.push(`Medida: ${item.measurement}`);

      mpItems.push({
        id: item.productId,
        title: product.name,
        quantity: item.quantity,
        unit_price: finalPrice,
        currency_id: "ARS",
        description: descriptionParts.join(" | ") || undefined,
        category_id: product.categories?.[0]?.name || undefined,
      });

      subtotal += finalPrice * item.quantity;
    }

    let discountAmount = 0;
    let finalTotal = subtotal;

    if (couponCode) {
      const coupon = await strapi.db.query('api::coupon.coupon').findOne({
        where: { code: couponCode, isActive: true },
      });

      if (coupon) {
        const isExpired = coupon.expirationDate && new Date() > new Date(coupon.expirationDate);
        if (!isExpired) {
          if (coupon.type === 'percentage') {
            discountAmount = subtotal * (Number(coupon.value) / 100);
          } else if (coupon.type === 'fixed') {
            discountAmount = Number(coupon.value);
          }
        }
      }
    }

    finalTotal = Math.max(0, subtotal - discountAmount);
    return { mpItems, subtotal, discountAmount, finalTotal };
  },

  /**
   * Create a MercadoPago payment preference and persist a pending order.
   */
  async createPreference(
    data: CreatePreferenceRequest
  ): Promise<CreatePreferenceResponse> {
    try {
      const preference = initMercadoPago();

      const successUrl =
        process.env.MERCADOPAGO_SUCCESS_URL ||
        "http://localhost:5173/checkout/success";
      const failureUrl =
        process.env.MERCADOPAGO_FAILURE_URL ||
        "http://localhost:5173/checkout/failure";
      const pendingUrl =
        process.env.MERCADOPAGO_PENDING_URL ||
        "http://localhost:5173/checkout/pending";

      const { mpItems, subtotal, discountAmount, finalTotal } = await strapi
        .service('api::mercadopago.mercadopago')
        .calculateOrderItems(data.items, data.couponCode);

      if (finalTotal === 0 && subtotal > 0) {
        throw new Error("Total cannot be 0 when using MercadoPago");
      }

      // Apply coupon discount proportionally across items for MP preference
      let adjustedItems = mpItems;
      if (discountAmount > 0 && subtotal > 0 && finalTotal > 0) {
        const discountFactor = finalTotal / subtotal;
        let runningTotal = 0;
        adjustedItems = mpItems.map((item: any, i: number) => {
          if (i === mpItems.length - 1) {
            const remainingToTarget = finalTotal - runningTotal;
            return { ...item, unit_price: Math.max(0, Number((remainingToTarget / item.quantity).toFixed(2))) };
          }
          const discountedPrice = Number((item.unit_price * discountFactor).toFixed(2));
          runningTotal += discountedPrice * item.quantity;
          return { ...item, unit_price: discountedPrice };
        });
      }

      const externalReference = data.external_reference || `ORDER-${Date.now()}`;

      // Persist a pending order immediately so the webhook can update it
      const existingOrders = await strapi.documents("api::order.order").findMany({
        filters: { external_reference: externalReference },
        limit: 1,
      });

      if (!existingOrders || existingOrders.length === 0) {
        const customerData = {
          customer_name: data.payer
            ? `${data.payer.name || ''} ${data.payer.surname || ''}`.trim() || 'CONSUMIDOR FINAL'
            : 'CONSUMIDOR FINAL',
          customer_email: data.payer?.email || '',
          customer_phone: data.payer?.phone
            ? `${data.payer.phone.area_code || ''}${data.payer.phone.number || ''}`
            : '',
          customer_dni: data.payer?.identification?.number || '',
          customer_document_type: normalizeDocumentType(data.payer?.identification?.type),
          customer_fiscal_category: (data.metadata?.customer_fiscal_category as 'CONSUMIDOR_FINAL' | 'RESPONSABLE_INSCRIPTO' | 'EXENTO' | 'MONOTRIBUTISTA') || 'CONSUMIDOR_FINAL',
          customer_address: data.payer?.address?.street_name
            ? `${data.payer.address.street_name} ${data.payer.address.street_number || ''}`.trim()
            : '',
        };

        await strapi.documents("api::order.order").create({
          data: {
            external_reference: externalReference,
            payment_status: 'pending',
            payment_method: 'mercadopago',
            payment_type: 'mercadopago',
            transaction_amount: finalTotal,
            items: mpItems,
            metadata: data.metadata || {},
            ...customerData,
          },
        });

        console.log(`[MercadoPago] Created pending order for external_reference: ${externalReference}`);
      } else {
        console.log(`[MercadoPago] Order already exists for external_reference: ${externalReference}, skipping create`);
      }

      const preferenceBody: any = {
        items: adjustedItems,
        back_urls: { success: successUrl, failure: failureUrl, pending: pendingUrl },
        statement_descriptor: "FLEXIGOM",
        external_reference: externalReference,
      };

      if (data.payer) preferenceBody.payer = data.payer;
      if (data.notification_url) preferenceBody.notification_url = data.notification_url;
      if (data.metadata) preferenceBody.metadata = data.metadata;

      const response = await preference.create({ body: preferenceBody });

      return {
        id: response.id!,
        init_point: response.init_point!,
        sandbox_init_point: response.sandbox_init_point!,
        date_created: response.date_created!,
        collector_id: response.collector_id!,
        external_reference: response.external_reference,
      };
    } catch (error) {
      console.error("MercadoPago createPreference error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to create MercadoPago preference: ${error.message}`);
      }
      throw new Error("Failed to create MercadoPago preference: Unknown error");
    }
  },

  /**
   * Verify webhook signature from MercadoPago
   */
  verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string
  ): boolean {
    return webhookUtils.verifyWebhookSignature(xSignature, xRequestId, dataId);
  },

  /**
   * Get payment details from MercadoPago API with retry logic
   * MercadoPago sometimes sends webhook before payment is available in API
   */
  async getPaymentDetails(paymentId: string, retryAttempt = 0): Promise<any> {
    const maxRetries = 3;
    const retryDelays = [2000, 4000, 8000]; // 2s, 4s, 8s

    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (!accessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
      }

      const client = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
        },
      });

      const payment = new Payment(client);
      const response = await payment.get({ id: paymentId });

      console.log(`[MercadoPago] Successfully fetched payment ${paymentId} details`);
      return response;
    } catch (error: any) {
      // If payment not found and we haven't exceeded max retries, retry with delay
      if (error.status === 404 && retryAttempt < maxRetries) {
        const delay = retryDelays[retryAttempt];
        console.warn(
          `[MercadoPago] Payment ${paymentId} not found (attempt ${retryAttempt + 1}/${maxRetries}). Retrying in ${delay}ms...`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry recursively using strapi.service to avoid 'this' context issues
        return strapi
          .service('api::mercadopago.mercadopago')
          .getPaymentDetails(paymentId, retryAttempt + 1);
      }

      // If not a 404 or exceeded retries, throw the error
      console.error(`[MercadoPago] Error getting payment ${paymentId} details:`, error);
      console.error(`[MercadoPago] This might be a test payment that doesn't exist in MercadoPago's API`);
      throw error;
    }
  },

  /**
   * Process payment notification and update order
   */
  async processPaymentNotification(paymentId: string, paymentData: any) {
    return webhookUtils.processPaymentNotification(paymentId, paymentData);
  },
});
