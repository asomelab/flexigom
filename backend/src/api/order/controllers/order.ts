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
        payment_type: payment_method,
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

    if (payment_method === 'transfer' && order.customer_email) {
      const formattedTotal = finalTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
      const htmlTemplate = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #dc2626;">¡Gracias por tu compra!</h2>
          <p>Tu pedido <strong>#${externalRef}</strong> ha sido registrado con éxito.</p>
          <p>El total a pagar es: <strong style="font-size: 18px; color: #111827;">${formattedTotal}</strong></p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #111827; border-bottom: 2px solid #ebebeb; padding-bottom: 10px;">Datos Bancarios</h3>
            <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
              <li><strong>Banco:</strong> Santander</li>
              <li><strong>Razón Social:</strong> JEHMA S A S</li>
              <li><strong>CUIT:</strong> 30718933060</li>
              <li><strong>CC en Pesos:</strong> 069-102470/6</li>
              <li><strong>CBU:</strong> 0720069420000010247068</li>
              <li><strong>Alias:</strong> jehmasas</li>
            </ul>
          </div>

          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #78350f; line-height: 1.5;">
            <strong>⚠️ Recordatorio Importante:</strong> Dispone de un plazo máximo de <strong>48 horas</strong> para realizar la transferencia y enviar su comprobante. Transcurrido este periodo sin recibir la confirmación de pago, el pedido será cancelado automáticamente para liberar el stock reservado.
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://wa.me/5493815824678?text=Hola,%20adjunto%20el%20comprobante%20de%20pago%20para%20la%20orden%20${externalRef}" 
               style="background-color: #25D366; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Enviar comprobante por WhatsApp
            </a>
          </div>
        </div>
      `;

      strapi.plugin('email').service('email').send({
        to: order.customer_email,
        subject: `Instrucciones de pago para tu pedido #${externalRef}`,
        html: htmlTemplate,
      }).catch((err: any) => {
        console.error('[Order Controller] Failed to send bank transfer email:', err);
      });
    }

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
