import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async getTrackingDetails(ctx: any) {
    const { externalReference } = ctx.params;

    if (!externalReference) {
      return ctx.badRequest('External reference is required');
    }

    // Retrieve order by external reference securely
    const order = await strapi.db.query('api::order.order').findOne({
      where: { external_reference: externalReference },
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    // Return ONLY minimum necessary fields for tracking to guarantee security
    return {
      data: {
        total: Number(order.transaction_amount) || 0,
        currency: 'ARS',
        external_reference: order.external_reference,
      }
    };
  }
}));
