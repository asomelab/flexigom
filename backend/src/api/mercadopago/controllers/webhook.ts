/**
 * Webhook controller for MercadoPago payment notifications
 */

import { Context } from 'koa';
import { webhookQuerySchema, webhookNotificationSchema } from '../schemas/validation';

export default {
  async handleWebhook(ctx: Context) {
    // Log incoming webhook request for debugging
    console.log('[MercadoPago Webhook] Received webhook notification');
    console.log('[MercadoPago Webhook] Headers:', {
      'x-signature': ctx.request.headers['x-signature'],
      'x-request-id': ctx.request.headers['x-request-id'],
      'content-type': ctx.request.headers['content-type'],
      'user-agent': ctx.request.headers['user-agent'],
    });

    // Validate query params against known schema — reject malformed early
    const queryParse = webhookQuerySchema.safeParse(ctx.request.query);
    if (!queryParse.success) {
      console.warn('[MercadoPago Webhook] Invalid query params:', queryParse.error.issues);
      ctx.status = 400;
      ctx.body = { error: 'Invalid query parameters' };
      return;
    }

    // Validate body against known schema
    const bodyParse = webhookNotificationSchema.safeParse((ctx.request as any).body);
    if (!bodyParse.success) {
      console.warn('[MercadoPago Webhook] Invalid body:', bodyParse.error.issues);
      ctx.status = 400;
      ctx.body = { error: 'Invalid body' };
      return;
    }

    const xSignature = ctx.request.headers['x-signature'] as string;
    const xRequestId = ctx.request.headers['x-request-id'] as string;
    const query = queryParse.data;
    const paymentId = query.id || query['data.id'];
    const notificationType = query.topic || query.type;

    console.log('[MercadoPago Webhook] Extracted data:', {
      paymentId,
      notificationType,
      hasSignature: !!xSignature,
      hasRequestId: !!xRequestId,
    });

    // Allow insecure mode via explicit env flag (not NODE_ENV) to avoid accidental prod bypass.
    // Set MP_WEBHOOK_INSECURE=true in dev .env when testing without a valid secret.
    const insecureMode = process.env.MP_WEBHOOK_INSECURE === 'true';

    if (xSignature && xRequestId && paymentId) {
      console.log('[MercadoPago Webhook] Attempting signature verification...');

      const isValid = await strapi
        .service('api::mercadopago.mercadopago')
        .verifyWebhookSignature(xSignature, xRequestId, paymentId as string);

      if (!isValid) {
        if (!insecureMode) {
          console.error('[MercadoPago Webhook] Rejecting webhook due to invalid signature');
          ctx.status = 403;
          ctx.body = { error: 'Invalid signature' };
          return;
        }
        console.warn('[MercadoPago Webhook] Signature invalid — proceeding anyway (MP_WEBHOOK_INSECURE=true)');
      } else {
        console.log('[MercadoPago Webhook] Signature verification PASSED');
      }
    } else {
      console.warn('[MercadoPago Webhook] Missing signature verification data:', {
        hasSignature: !!xSignature,
        hasRequestId: !!xRequestId,
        hasPaymentId: !!paymentId,
      });

      if (!insecureMode && !xSignature) {
        console.error('[MercadoPago Webhook] Rejecting webhook due to missing signature');
        ctx.status = 403;
        ctx.body = { error: 'Missing signature' };
        return;
      }
    }

    // Return 200 immediately so MP doesn't retry while we process
    console.log('[MercadoPago Webhook] Sending 200 OK response');
    ctx.status = 200;
    ctx.body = { success: true };

    // Process payment async
    if (notificationType === 'payment' && paymentId) {
      console.log(`[MercadoPago Webhook] Queuing async processing for payment ${paymentId}`);

      setImmediate(async () => {
        try {
          console.log(`[MercadoPago Webhook] Starting async processing for payment ${paymentId}`);

          const paymentData = await strapi
            .service('api::mercadopago.mercadopago')
            .getPaymentDetails(paymentId as string);

          console.log(`[MercadoPago Webhook] Payment data retrieved:`, {
            id: paymentData.id,
            status: paymentData.status,
            external_reference: paymentData.external_reference,
            transaction_amount: paymentData.transaction_amount,
            payment_method_id: paymentData.payment_method_id,
          });

          await strapi
            .service('api::mercadopago.mercadopago')
            .processPaymentNotification(paymentId as string, paymentData);

          console.log(`[MercadoPago Webhook] Successfully processed payment ${paymentId}`);
        } catch (error: any) {
          console.error('[MercadoPago Webhook] Error during async processing:', error);

          if (error?.status === 404) {
            console.warn(`[MercadoPago Webhook] Payment ${paymentId} not found in MercadoPago API.`);
            console.warn('[MercadoPago Webhook] Common with sandbox test payments. Use real test cards: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards');
          } else {
            // Persist a processing-failure marker so a reconcile job can retry
            try {
              const errorMessage = error instanceof Error ? error.message : String(error);
              const orders = await strapi.documents('api::order.order').findMany({
                filters: { payment_id: paymentId as string },
                limit: 1,
              });
              if (orders && orders.length > 0) {
                await strapi.documents('api::order.order').update({
                  documentId: orders[0].documentId,
                  data: {
                    payment_status: 'processing_failed',
                    processing_error: errorMessage,
                  } as any,
                });
                console.warn(`[MercadoPago Webhook] Marked order ${orders[0].id} as processing_failed for reconciliation`);
              }
            } catch (updateErr) {
              console.error('[MercadoPago Webhook] Could not persist processing_failed marker:', updateErr);
            }

            if (error instanceof Error) {
              console.error('[MercadoPago Webhook] Error message:', error.message);
              console.error('[MercadoPago Webhook] Error stack:', error.stack);
            }
          }
        }
      });
    } else {
      console.log('[MercadoPago Webhook] Skipping processing:', {
        reason: !notificationType ? 'No notification type' : notificationType !== 'payment' ? 'Not a payment notification' : 'No payment ID',
        notificationType,
        paymentId,
      });
    }
  },
};
