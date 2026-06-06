export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderId: string;
  orderDate: string;
  paymentDate: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    composicion?: string | null;
    medida?: string | null;
  }[];
  total: number;
  paymentMethod: string;
  notes?: string;
  /**
   * Whether the payment has been confirmed/approved.
   * true  → "¡Pago confirmado!" wording (MercadoPago approved)
   * false → "¡Pedido recibido!" wording (manual/pending orders)
   * Defaults to true when omitted.
   */
  paymentConfirmed?: boolean;
}

/**
 * Generates the HTML content for the team notification email
 */
function teamOrderNotificationHtml(order: OrderEmailData): string {
  const itemsList = order.items
    .map(
      item => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${item.name}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${item.composicion || '-'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${item.medida || '-'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
        </tr>
      `
    )
    .join('');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background-color: #94a3b8; padding: 30px 20px; text-align: center;">
        <img src="https://flexigomtucuman.com/flexigom.png" alt="Logo de Flexigom" style="width: 150px; height: auto; display: block; margin: 0 auto 15px auto;" />
        <h1 style="color: #ff0000ff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">
          Flexigom Ventas
        </h1>
        <p style="color: #000000; margin: 10px 0 0 0; font-size: 14px;">Notificación de nueva orden recibida</p>
      </div>

      <!-- Content Body -->
      <div style="padding: 30px 25px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
          <div style="padding-right: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Orden ID</p>
            <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 18px; font-weight: bold;">#${order.orderId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Fecha</p>
            <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px;">${order.orderDate}</p>
          </div>
        </div>

        <h3 style="color: #111827; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid #dc2626;">📦 Detalles del Pedido</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">PRODUCTO</th>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">COMP.</th>
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">MEDIDA</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">CANT.</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">PRECIO</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="padding: 20px 8px 10px 8px; text-align: right; color: #737373; font-weight: bold;">TOTAL:</td>
              <td style="padding: 20px 8px 10px 8px; text-align: right; color: #dc2626; font-size: 20px; font-weight: bold;">$${order.total.toLocaleString('es-AR')}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
          <div style="border-bottom: 1px solid #ebebeb; padding-bottom: 10px; margin-bottom: 10px;">
            <p style="margin: 0; color: #737373; font-size: 12px; font-weight: bold;">INFORMACIÓN DE PAGO</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 14px;"><strong>Método:</strong> ${order.paymentMethod}</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 14px;"><strong>Fecha de pago:</strong> ${order.paymentDate}</p>
          </div>
        </div>

        <h3 style="color: #111827; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid #000000;">👤 Datos del Cliente</h3>
        <div style="background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; padding: 20px;">
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Nombre:</strong> ${order.customerName}</p>
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Email:</strong> ${order.customerEmail}</p>
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Teléfono:</strong> ${order.customerPhone}</p>
          <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Dirección:</strong> ${order.customerAddress}</p>
        </div>

        ${
          order.notes
            ? `
        <div style="margin-top: 25px;">
          <p style="margin: 0 0 5px 0; color: #737373; font-size: 12px; font-weight: bold;">NOTAS DEL PEDIDO</p>
          <div style="padding: 15px; border-left: 4px solid #dc2626; background-color: #fff5f5; color: #7c2d12; font-size: 14px; border-radius: 0 10px 10px 0;">
            ${order.notes}
          </div>
        </div>
        `
            : ''
        }
      </div>

      <!-- Footer -->
      <div style="background-color: #000000; padding: 20px; text-align: center; color: #a0a0a0; font-size: 12px;">
        <p style="margin: 0;">Este es un mensaje automático del sistema de ventas de Flexigom.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Flexigom. Todos los derechos reservados.</p>
      </div>
    </div>
  `;
}

/**
 * Generates the HTML content for the customer order confirmation email.
 * When order.paymentConfirmed is false (manual/pending orders) the heading
 * reads "¡Pedido recibido!" instead of "¡Pago confirmado!".
 */
function customerOrderConfirmationHtml(order: OrderEmailData): string {
  const confirmed = order.paymentConfirmed !== false; // default true

  const itemsList = order.items
    .map(
      item => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #ebebeb; color: #111827;">${item.name}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #ebebeb; color: #737373; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #ebebeb; color: #111827; font-weight: bold; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
      </tr>
    `
    )
    .join('');

  const headerSubtitle = confirmed ? 'Pago confirmado' : 'Pedido recibido';
  const greeting = confirmed
    ? `¡Pago confirmado, ${order.customerName.split(' ')[0]}!`
    : `¡Recibimos tu pedido, ${order.customerName.split(' ')[0]}!`;
  const bodyText = confirmed
    ? 'Tu pago fue procesado correctamente. Nos contactaremos pronto para coordinar la entrega.'
    : 'Tu pedido fue registrado correctamente. Nos contactaremos pronto para coordinar el pago y la entrega.';

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #000000; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">
          Flexigom <span style="color: #dc2626;">✓</span>
        </h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px;">${headerSubtitle}</p>
      </div>

      <div style="padding: 30px 25px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 10px 0;">${greeting}</h2>
        <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">${bodyText}</p>

        <h3 style="color: #111827; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid #dc2626;">📦 Tu Pedido</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">PRODUCTO</th>
              <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">CANT.</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #ebebeb; color: #737373; font-size: 12px;">PRECIO</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 20px 8px 10px 8px; text-align: right; color: #737373; font-weight: bold;">TOTAL:</td>
              <td style="padding: 20px 8px 10px 8px; text-align: right; color: #dc2626; font-size: 18px; font-weight: bold;">$${order.total.toLocaleString('es-AR')}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <p style="margin: 0 0 10px 0; color: #737373; font-size: 12px; font-weight: bold;">NÚMERO DE ORDEN</p>
          <p style="margin: 0; color: #111827; font-size: 16px; font-weight: bold;">#${order.orderId}</p>
        </div>

        <h3 style="color: #111827; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid #000000;">🚚 Datos de entrega</h3>
        <div style="background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Nombre:</strong> ${order.customerName}</p>
          <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Teléfono:</strong> ${order.customerPhone}</p>
          <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Dirección:</strong> ${order.customerAddress}</p>
        </div>

        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
          <p style="margin: 0 0 5px 0; color: #737373; font-size: 12px; font-weight: bold;">INFORMACIÓN DE PAGO</p>
          <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;"><strong>Método:</strong> ${order.paymentMethod}</p>
          <p style="margin: 0; color: #111827; font-size: 14px;"><strong>Fecha:</strong> ${order.paymentDate}</p>
        </div>

        <p style="color: #737373; font-size: 13px; text-align: center; margin: 0;">Si tienes preguntas, no dudes en contactarnos a <strong>flexituc@gmail.com</strong></p>
      </div>

      <div style="background-color: #000000; padding: 20px; text-align: center; color: #a0a0a0; font-size: 12px;">
        <p style="margin: 0; color: #a0a0a0;">Flexigom — 20+ años de experiencia en colchones y descanso</p>
      </div>
    </div>
  `;
}

/**
 * Sends a notification email to the Flexigom team for a new sale
 */
export async function sendNewOrderEmail(order: OrderEmailData): Promise<{ success: boolean; error?: unknown }> {
  try {
    const toEmail = process.env.SMTP_TO_EMAIL || 'flexituc@gmail.com';
    console.log('[Email Service] Sending team notification email to:', toEmail);
    
    await strapi.plugin('email').service('email').send({
      to: toEmail,
      subject: `🛍️ Nueva venta #${order.orderId} — $${order.total.toLocaleString('es-AR')}`,
      html: teamOrderNotificationHtml(order),
    });

    console.log('[Email Service] Notification email sent successfully via SES');
    return { success: true };
  } catch (err) {
    console.error('[Email Service] Unexpected error sending team notification email via SMTP:', err);
    return { success: false, error: err };
  }
}

/**
 * Sends a confirmation email to the customer for their purchase
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<{ success: boolean; error?: unknown }> {
  try {
    console.log('[Email Service] Sending customer confirmation email to:', order.customerEmail);
    
    await strapi.plugin('email').service('email').send({
      to: order.customerEmail,
      subject: `✅ Recibimos tu pedido #${order.orderId} — Flexigom`,
      html: customerOrderConfirmationHtml(order),
    });

    console.log('[Email Service] Customer confirmation email sent successfully via SES');
    return { success: true };
  } catch (err) {
    console.error('[Email Service] Unexpected error sending customer confirmation email via SMTP:', err);
    return { success: false, error: err };
  }
}
