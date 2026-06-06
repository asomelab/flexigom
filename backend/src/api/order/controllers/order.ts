import { factories } from '@strapi/strapi';
import { normalizeDocumentType } from '../../mercadopago/utils/webhook';
import { sendNewOrderEmail, sendOrderConfirmationEmail, brandEmailShell, formatPaymentMethodLabel } from '../../../services/email.service';

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
        customer_address: typeof payer?.address === 'string'
          ? payer.address
          : payer?.address?.street_name
            ? `${payer.address.street_name}${payer.address.street_number ? ' ' + payer.address.street_number : ''}${payer.address.zip_code ? ', CP ' + payer.address.zip_code : ''}`
            : '',
      },
    });

    console.log(`[Order] Created manual order ${order.documentId} (${payment_method}) ref: ${externalRef}`);

    // Build email data from saved order + calculated items
    const emailData = {
      customerName: order.customer_name || '',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      customerAddress: order.customer_address || '',
      customerDni: (order as any).customer_dni || '',
      orderId: order.id.toString(),
      orderDate: new Date().toLocaleDateString('es-AR'),
      paymentDate: 'Pendiente',
      items: (mpItems as any[]).map((item: any) => ({
        name: item.title,
        quantity: item.quantity,
        price: item.unit_price,
        composicion: item.description?.includes('Composición:')
          ? item.description.split('Composición:')[1].split('|')[0].trim()
          : undefined,
        medida: item.description?.includes('Medida:')
          ? item.description.split('Medida:')[1].split('|')[0].trim()
          : undefined,
      })),
      total: finalTotal,
      paymentMethod: formatPaymentMethodLabel(payment_method),
      paymentConfirmed: false,
    };

    // Notify Flexigom team for all manual orders
    sendNewOrderEmail(emailData).catch((err: any) => {
      console.error('[Order Controller] Failed to send team notification email:', err);
    });

    if (payment_method === 'transfer' && order.customer_email) {
      const formattedTotal = `$${finalTotal.toLocaleString('es-AR')}`;
      const transferBody = `
        <h2 style="margin: 0 0 10px 0; color: #252525; font-size: 20px; font-weight: 700;">&#161;Grac&#xED;as por tu compra, ${payer?.name || 'cliente'}!</h2>
        <p style="margin: 0 0 28px 0; color: #8e8e8e; font-size: 14px; line-height: 1.6;">
          Tu pedido <strong style="color: #252525;">#${externalRef}</strong> fue registrado.
          Realiz&#225; la transferencia por <strong style="color: #dc2626;">${formattedTotal}</strong> a los datos de abajo y envi&#225; tu comprobante.
        </p>

        <p style="margin: 0 0 12px 0; color: #252525; font-size: 15px; font-weight: 700; padding-left: 12px; border-left: 4px solid #dc2626;">&#127974; Datos bancarios</p>
        <div style="background-color: #f8f8f8; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px; width: 40%;">Banco</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-weight: 500;">Santander</td></tr>
            <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Raz&#243;n Social</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-weight: 500;">JEHMA S.A.S.</td></tr>
            <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">CUIT</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">30718933060</td></tr>
            <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">CC en Pesos</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-family: 'Courier New', monospace;">069-102470/6</td></tr>
            <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">CBU</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-family: 'Courier New', monospace;">0720069420000010247068</td></tr>
            <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Alias</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-family: 'Courier New', monospace;">jehmasas</td></tr>
          </table>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
            <strong>&#9888;&#65039; Recordatorio importante:</strong> Ten&#233;s un plazo m&#225;ximo de <strong>48 horas</strong> para realizar la transferencia y enviar el comprobante. Pasado ese tiempo, el pedido se cancelar&#225; autom&#225;ticamente.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 8px;">
          <a href="https://wa.me/5493815824678?text=Hola,%20adjunto%20el%20comprobante%20de%20pago%20para%20la%20orden%20${externalRef}"
             style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
            &#128242; Enviar comprobante por WhatsApp
          </a>
        </div>
      `;
      const htmlTemplate = brandEmailShell(transferBody, 'Instrucciones de pago');

      strapi.plugin('email').service('email').send({
        to: order.customer_email,
        subject: `Instrucciones de pago para tu pedido #${externalRef}`,
        html: htmlTemplate,
      }).catch((err: any) => {
        console.error('[Order Controller] Failed to send bank transfer email:', err);
      });
    }

    // Cash orders: send customer confirmation via the shared template
    if (payment_method === 'cash' && order.customer_email) {
      sendOrderConfirmationEmail(emailData).catch((err: any) => {
        console.error('[Order Controller] Failed to send cash order confirmation email:', err);
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
