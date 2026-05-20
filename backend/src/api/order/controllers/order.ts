import { factories } from '@strapi/strapi';
import { normalizeDocumentType } from '../../mercadopago/utils/webhook';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async getTrackingDetails(ctx: any) {
    const { externalReference } = ctx.params;

    if (!externalReference) {
      return ctx.badRequest('External reference is required');
    }

    const order = await strapi.db.query('api::order.order').findOne({
      where: { external_reference: externalReference },
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    return {
      data: {
        total: Number(order.transaction_amount) || 0,
        currency: 'ARS',
        external_reference: order.external_reference,
      }
    };
  },

  async createManualOrder(ctx: any) {
    const body = (ctx.request as any).body;
    const { items, payer, couponCode, payment_method, external_reference } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('items is required');
    }

    if (!payment_method || payment_method === 'mercadopago') {
      return ctx.badRequest('Invalid payment_method for manual order');
    }

    const { mpItems, finalTotal } = await strapi
      .service('api::mercadopago.mercadopago')
      .calculateOrderItems(items, couponCode);

    const externalRef = external_reference || `ORDER-${Date.now()}`;

    const order = await strapi.documents('api::order.order').create({
      data: {
        external_reference: externalRef,
        payment_status: 'pending',
        payment_method,
        transaction_amount: finalTotal,
        items: mpItems,
        customer_name: payer
          ? `${payer.name || ''} ${payer.surname || ''}`.trim() || 'CONSUMIDOR FINAL'
          : 'CONSUMIDOR FINAL',
        customer_email: payer?.email || '',
        customer_phone: payer?.phone
          ? `${payer.phone.area_code || ''}${payer.phone.number || ''}`
          : '',
        customer_dni: payer?.identification?.number || '',
        customer_document_type: normalizeDocumentType(payer?.identification?.type),
        customer_fiscal_category: (payer?.fiscalCategory as 'CONSUMIDOR_FINAL' | 'RESPONSABLE_INSCRIPTO' | 'EXENTO' | 'MONOTRIBUTISTA') || 'CONSUMIDOR_FINAL',
        customer_address: payer?.address || '',
      },
    });

    console.log(`[Order] Created manual order ${order.documentId} (${payment_method}) ref: ${externalRef}`);

    return {
      data: {
        external_reference: externalRef,
        total: finalTotal,
        currency: 'ARS',
        order_id: order.id,
      },
    };
  },
}));
