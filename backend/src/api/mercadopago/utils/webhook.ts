/**
 * MercadoPago webhook utilities
 */

import crypto from "crypto";

/**
 * Normalize MercadoPago identification types to match Order schema enum
 * Frontend only sends DNI/CUIT, but MercadoPago may transform them
 */
export function normalizeDocumentType(mpType: string | undefined): 'DNI' | 'CUIT' {
  if (!mpType) return 'DNI';
  const normalized = mpType.toUpperCase().trim();
  // MercadoPago should preserve DNI/CUIT from preference
  if (normalized === 'CUIT' || normalized.includes('CUIT')) return 'CUIT';
  // Default to DNI for all other cases
  return 'DNI';
}

/**
 * Verify webhook signature from MercadoPago
 */
export const verifyWebhookSignature = (
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean => {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[MercadoPago Webhook] MERCADOPAGO_WEBHOOK_SECRET not configured');
    return false;
  }

  const ts = xSignature.match(/ts=(\d+)/)?.[1];
  const hash = xSignature.match(/v1=([a-f0-9]+)/)?.[1];

  if (!ts || !hash) {
    console.warn('[MercadoPago Webhook] Invalid signature format:', xSignature);
    return false;
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  // Timing-safe compare — guard against length mismatch first (invalid hash format)
  let isValid = false;
  if (computedHash.length === hash.length) {
    isValid = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  if (!isValid) {
    // Do NOT log the secret or computed/expected hashes — timing/oracle risk
    console.warn('[MercadoPago Webhook] Signature verification failed');
  }

  return isValid;
};

/**
 * Process payment notification and update order
 */
export const processPaymentNotification = async (
  paymentId: string,
  paymentData: any
) => {
  console.log("[MercadoPago Webhook] Processing payment notification:", {
    paymentId,
    external_reference: paymentData.external_reference,
    status: paymentData.status,
  });

  const {
    external_reference,
    status,
    transaction_amount,
    payment_method_id,
    payer,
  } = paymentData;

  if (!external_reference) {
    console.warn(
      "[MercadoPago Webhook] No external_reference found in payment data, cannot process order"
    );
    return null;
  }

  console.log(
    `[MercadoPago Webhook] Looking for existing order with external_reference: ${external_reference}`
  );

  const orders = await strapi.documents("api::order.order").findMany({
    filters: { external_reference },
    limit: 1,
  });

  console.log(
    `[MercadoPago Webhook] Found ${
      orders && Array.isArray(orders) ? orders.length : 0
    } existing order(s)`
  );

  // Create webhook notification record
  const webhookNotification = {
    timestamp: new Date().toISOString(),
    payment_id: paymentId,
    status,
    payment_method_id,
    transaction_amount,
    customer_email: payer?.email,
  };

  // Normalize document type to match Order schema enum
  const normalizedDocType = normalizeDocumentType(payer?.identification?.type);
  console.log(`[MercadoPago Webhook] Normalized document type: ${payer?.identification?.type} -> ${normalizedDocType}`);

  const orderData = {
    payment_id: paymentId,
    payment_status: status,
    payment_method: payment_method_id,
    transaction_amount,
    customer_email: payer?.email,
    customer_name: `${payer?.first_name || ''} ${payer?.last_name || ''}`.trim() || 'CONSUMIDOR FINAL',
    customer_phone: payer?.phone?.number || payer?.phone?.area_code
      ? `${payer.phone.area_code || ''}${payer.phone.number || ''}`
      : '',
    customer_dni: payer?.identification?.number || '',
    customer_document_type: normalizedDocType,
    customer_fiscal_category: paymentData?.metadata?.customer_fiscal_category || 'CONSUMIDOR_FINAL',
    customer_address: payer?.address?.street_name
      ? `${payer.address.street_name} ${payer.address.street_number || ''}`.trim()
      : '',
    mercadopago_data: paymentData,
  };

  let updatedOrder;
  // Track whether this webhook transitions the order INTO approved for the first time.
  // Guards Dux invoice, emails, and CAPI — they must fire exactly once.
  let becomingApproved = false;

  if (orders && Array.isArray(orders) && orders.length > 0) {
    const existingOrder = orders[0];
    console.log(
      `[MercadoPago Webhook] Found existing order ${existingOrder.id} (documentId: ${existingOrder.documentId}) - updating (NEW FLOW)`
    );

    // Idempotency: only fire side-effects on the transition pending→approved
    const wasAlreadyApproved = existingOrder.payment_status === 'approved';
    becomingApproved = status === 'approved' && !wasAlreadyApproved;

    // Amount integrity: compare paid amount to the expected order total
    const expectedAmount = Number(existingOrder.transaction_amount);
    const paidAmount = Number(transaction_amount);
    const AMOUNT_TOLERANCE_ARS = 1; // 1 peso tolerance for float rounding
    if (status === 'approved' && Math.abs(paidAmount - expectedAmount) > AMOUNT_TOLERANCE_ARS) {
      console.error(
        `[MercadoPago Webhook] AMOUNT MISMATCH — expected ${expectedAmount} ARS, paid ${paidAmount} ARS. Order ${existingOrder.id} flagged.`
      );
      await strapi.documents("api::order.order").update({
        documentId: existingOrder.documentId,
        data: { payment_status: 'in_mediation', mercadopago_data: paymentData },
      });
      return null;
    }

    // Get existing webhook notifications and append new one
    const existingNotifications = existingOrder.webhook_notifications || [];
    const updatedNotifications = Array.isArray(existingNotifications)
      ? [...existingNotifications, webhookNotification]
      : [webhookNotification];

    updatedOrder = await strapi.documents("api::order.order").update({
      documentId: existingOrder.documentId,
      data: {
        ...orderData,
        webhook_notifications: updatedNotifications,
      },
    });

    console.log(
      `[MercadoPago Webhook] Successfully updated order ${updatedOrder?.id} with new payment status: ${status}`
    );
  } else {
    console.log("[MercadoPago Webhook] No existing order found - creating new order (LEGACY FALLBACK)");
    // Treat creation as "becoming approved" for side-effect guards
    becomingApproved = status === 'approved';

    updatedOrder = await strapi.documents("api::order.order").create({
      data: {
        ...orderData,
        external_reference,
        items: paymentData.additional_info?.items || [],
        webhook_notifications: [webhookNotification],
      },
    });

    console.log(
      `[MercadoPago Webhook] Successfully created new order ${updatedOrder.id} (documentId: ${updatedOrder.documentId})`
    );
  }

  // Log comprehensive order operation summary
  if (updatedOrder) {
    console.log(`[MercadoPago Webhook] Order operation successful`, {
      orderId: updatedOrder.id,
      externalReference: external_reference,
      paymentStatus: status,
      documentType: updatedOrder.customer_document_type,
      transactionAmount: transaction_amount,
    });
  }

  // Trigger Dux invoice creation only on first transition to approved
  if (becomingApproved && updatedOrder) {
    const duxToken = process.env.DUX_API_TOKEN;

    if (duxToken) {
      try {
        console.log(
          `[MercadoPago Webhook] Triggering Dux invoice for order ${updatedOrder.id}`
        );

        await strapi
          .service("api::dux-software.dux-software")
          .createInvoice(updatedOrder);

        console.log(
          `[MercadoPago Webhook] Dux invoice created successfully for order ${updatedOrder.id}`
        );
      } catch (error) {
        console.error(
          `[MercadoPago Webhook] Dux invoice creation failed for order ${updatedOrder.id}:`,
          error
        );

        // Store error in order record
        try {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await strapi.documents("api::order.order").update({
            documentId: updatedOrder.documentId,
            data: {
              dux_invoice_status: "failed",
              dux_invoice_error: errorMessage,
            },
          });
        } catch (updateError) {
          console.error(
            `[MercadoPago Webhook] Failed to update order with Dux error:`,
            updateError
          );
        }
      }
    } else {
      console.log(
        `[MercadoPago Webhook] Dux integration disabled (no token) - skipping invoice for order ${updatedOrder.id}`
      );
    }
  } else {
    console.log(
      `[MercadoPago Webhook] Skipping Dux invoice creation (status: ${status}, hasOrder: ${!!updatedOrder})`
    );
  }

  // Trigger email notifications only on first transition to approved
  if (becomingApproved && updatedOrder) {
    try {
      console.log(
        `[MercadoPago Webhook] Triggering email notifications for order ${updatedOrder.id}`
      );

      const { sendNewOrderEmail, sendOrderConfirmationEmail } = require("../../../services/email.service");

      const emailData = {
        customerName: updatedOrder.customer_name,
        customerEmail: updatedOrder.customer_email,
        customerPhone: updatedOrder.customer_phone,
        customerAddress: updatedOrder.customer_address,
        orderId: updatedOrder.id.toString(),
        orderDate: new Date().toLocaleDateString("es-AR"),
        paymentDate: new Date().toLocaleDateString("es-AR"),
        items: ((updatedOrder.items as any) || []).map((item: any) => ({
          name: item.title,
          quantity: item.quantity,
          price: item.unit_price,
          composicion: item.description?.includes("Composición:")
            ? item.description.split("Composición:")[1].split("|")[0].trim()
            : undefined,
          medida: item.description?.includes("Medida:")
            ? item.description.split("Medida:")[1].split("|")[0].trim()
            : undefined,
        })),
        total: updatedOrder.transaction_amount,
        paymentMethod: updatedOrder.payment_method || "MercadoPago",
        notes: (updatedOrder.metadata as any)?.notes,
      };

      // Send team notification
      await sendNewOrderEmail(emailData);

      // Send customer confirmation
      if (updatedOrder.customer_email) {
        await sendOrderConfirmationEmail(emailData);
      }

      console.log(
        `[MercadoPago Webhook] Email notifications sent for order ${updatedOrder.id}`
      );
    } catch (error) {
      console.error(
        `[MercadoPago Webhook] Email notifications failed for order ${updatedOrder.id}:`,
        error
      );
    }
  }

  // Trigger Meta Conversions API Purchase Event only on first transition to approved
  if (becomingApproved && updatedOrder) {
    try {
      await sendMetaCAPIPurchase(updatedOrder);
    } catch (capiError) {
      console.error(
        `[MercadoPago Webhook] Failed to dispatch CAPI Purchase event:`,
        capiError
      );
    }
  }

  return updatedOrder;
};

/**
 * Hash customer data using SHA256 as required by Meta privacy policies
 */
function hashData(data: string | undefined): string | null {
  if (!data) return null;
  return crypto
    .createHash('sha256')
    .update(data.trim().toLowerCase())
    .digest('hex');
}

/**
 * Send server-side Purchase event to Meta Conversions API
 */
async function sendMetaCAPIPurchase(order: any) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN in env');
    return;
  }

  try {
    const payload = {
      data: [
        {
          event_name: 'Purchase',
          // Stable event_id lets Meta dedup server event against browser pixel
          event_id: order.external_reference || order.id?.toString(),
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: 'https://www.flexigomtucuman.com/checkout/success',
          user_data: {
            em: order.customer_email ? [hashData(order.customer_email)] : [],
            ph: order.customer_phone ? [hashData(order.customer_phone)] : [],
            fn: order.customer_name ? [hashData(order.customer_name.split(' ')[0])] : [],
            ln: order.customer_name && order.customer_name.split(' ').length > 1 
              ? [hashData(order.customer_name.split(' ').slice(1).join(' '))] 
              : [],
          },
          custom_data: {
            value: Number(order.transaction_amount) || 0,
            currency: 'ARS',
            order_id: order.external_reference,
          },
        },
      ],
    };

    console.log(`[Meta CAPI] Sending Purchase event for order ${order.external_reference}...`);
    
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData: any = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(responseData));
    }

    console.log(`[Meta CAPI] Successfully sent Purchase event for order ${order.external_reference}`);
  } catch (error: any) {
    console.error('[Meta CAPI] Failed to send Conversions API event:', error.message);
  }
}
