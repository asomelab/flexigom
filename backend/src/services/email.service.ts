export interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerDni?: string;
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
  /** MercadoPago verification fields — populated for MP orders only */
  externalReference?: string;
  mercadopagoPaymentId?: string;
  paymentStatus?: string;
}

/**
 * Map raw MercadoPago payment_method_id / payment_type to a human-readable Spanish label.
 */
export function formatPaymentMethodLabel(method: string | undefined): string {
  if (!method) return 'MercadoPago';
  const map: Record<string, string> = {
    account_money: 'MercadoPago (dinero en cuenta)',
    mercadopago: 'MercadoPago',
    credit_card: 'Tarjeta de crédito',
    debit_card: 'Tarjeta de débito',
    ticket: 'Efectivo (Rapipago / Pago Fácil)',
    bank_transfer: 'Transferencia bancaria',
    atm: 'Cajero automático',
    cash: 'Efectivo',
    transfer: 'Transferencia bancaria',
  };
  return map[method.toLowerCase()] ?? method;
}

/**
 * Shared brand email shell — logo header + red accent + dark footer.
 * innerHtml is placed in the body section. subtitle appears under the logo.
 */
export function brandEmailShell(innerHtml: string, subtitle?: string): string {
  return `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 28px 20px 20px 20px; text-align: center; border-bottom: 3px solid #dc2626;">
        <img src="https://flexigomtucuman.com/flexigom.png" alt="Flexigom" style="width: 150px; height: auto; display: block; margin: 0 auto;" />
        ${subtitle ? `<p style="margin: 12px 0 0 0; color: #8e8e8e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">${subtitle}</p>` : ''}
      </div>
      <!-- Body -->
      <div style="padding: 32px 28px;">
        ${innerHtml}
      </div>
      <!-- Footer -->
      <div style="background-color: #111111; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #8e8e8e; font-size: 12px; line-height: 1.5;">Flexigom &mdash; 20+ a&ntilde;os de experiencia en colchones y descanso</p>
        <p style="margin: 6px 0 0 0; color: #8e8e8e; font-size: 12px;">Consultas: <a href="mailto:flexituc@gmail.com" style="color: #dc2626; text-decoration: none;">flexituc@gmail.com</a></p>
      </div>
    </div>
  `;
}

/**
 * Generates the HTML content for the team notification email.
 * Includes MercadoPago verification block when mercadopagoPaymentId is present.
 */
function teamOrderNotificationHtml(order: OrderEmailData): string {
  const itemsList = order.items
    .map(
      item => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; color: #252525; font-size: 14px;">${item.name}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; color: #8e8e8e; font-size: 13px;">${item.composicion || '&mdash;'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; color: #8e8e8e; font-size: 13px;">${item.medida || '&mdash;'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; color: #8e8e8e; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; color: #252525; font-size: 14px; font-weight: 600; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
        </tr>
      `
    )
    .join('');

  const mpVerificationBlock = order.mercadopagoPaymentId
    ? `
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 0 10px 10px 0; padding: 16px 20px; margin-bottom: 28px;">
      <p style="margin: 0 0 10px 0; color: #92400e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">&#9888;&#65039; Verificar antes de despachar</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 3px 0; color: #78350f; font-size: 13px; width: 40%; vertical-align: top;"><strong>ID de pago MP:</strong></td>
          <td style="padding: 3px 0; color: #252525; font-size: 13px; font-family: 'Courier New', monospace; word-break: break-all;">${order.mercadopagoPaymentId}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; color: #78350f; font-size: 13px;"><strong>Referencia:</strong></td>
          <td style="padding: 3px 0; color: #252525; font-size: 13px; font-family: 'Courier New', monospace;">${order.externalReference || '&mdash;'}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; color: #78350f; font-size: 13px;"><strong>N&deg; de orden:</strong></td>
          <td style="padding: 3px 0; color: #252525; font-size: 13px; font-weight: 600;">#${order.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 3px 0; color: #78350f; font-size: 13px;"><strong>Estado:</strong></td>
          <td style="padding: 3px 0; color: #16a34a; font-size: 13px; font-weight: 700; text-transform: uppercase;">${order.paymentStatus || '&mdash;'}</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 13px;">
        <a href="https://www.mercadopago.com.ar/activities" style="color: #dc2626; font-weight: 600; text-decoration: none;">&rarr; Verificar en MercadoPago</a>
      </p>
    </div>
    `
    : '';

  const body = `
    <!-- Heading row -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
      <tr>
        <td>
          <p style="margin: 0; color: #8e8e8e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;">N&deg; Orden</p>
          <p style="margin: 6px 0 0 0; color: #252525; font-size: 26px; font-weight: 700;">#${order.orderId}</p>
        </td>
        <td style="text-align: right; vertical-align: top;">
          <p style="margin: 0; color: #8e8e8e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;">Fecha</p>
          <p style="margin: 6px 0 0 0; color: #252525; font-size: 14px;">${order.orderDate}</p>
        </td>
      </tr>
    </table>

    ${mpVerificationBlock}

    <!-- Products -->
    <p style="margin: 0 0 12px 0; color: #252525; font-size: 15px; font-weight: 700; padding-left: 12px; border-left: 4px solid #dc2626;">&#128230; Detalle del pedido</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border-radius: 10px; overflow: hidden;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;">Producto</th>
          <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase;">Comp.</th>
          <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase;">Medida</th>
          <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase;">Cant.</th>
          <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
      <tfoot>
        <tr style="background-color: #fff8f8;">
          <td colspan="4" style="padding: 14px 8px; text-align: right; color: #8e8e8e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Total:</td>
          <td style="padding: 14px 8px; text-align: right; color: #dc2626; font-size: 20px; font-weight: 700;">$${order.total.toLocaleString('es-AR')}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment info -->
    <div style="background-color: #f8f8f8; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
      <p style="margin: 0 0 10px 0; color: #8e8e8e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;">Informaci&oacute;n de pago</p>
      <p style="margin: 0 0 5px 0; color: #252525; font-size: 14px;"><strong>M&eacute;todo:</strong> ${order.paymentMethod}</p>
      <p style="margin: 0; color: #252525; font-size: 14px;"><strong>Fecha:</strong> ${order.paymentDate}</p>
    </div>

    <!-- Customer data -->
    <p style="margin: 0 0 12px 0; color: #252525; font-size: 15px; font-weight: 700; padding-left: 12px; border-left: 4px solid #dc2626;">&#128100; Datos del cliente</p>
    <div style="background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; padding: 18px 20px; margin-bottom: ${order.notes ? '28px' : '0'};">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px; width: 35%;">Nombre</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-weight: 500;">${order.customerName}</td></tr>
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Email</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerEmail}</td></tr>
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Tel&eacute;fono</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerPhone || '&mdash;'}</td></tr>
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Direcci&oacute;n</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerAddress || '&mdash;'}</td></tr>
        ${order.customerDni ? `<tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">DNI</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerDni}</td></tr>` : ''}
      </table>
    </div>

    ${order.notes ? `
    <div style="padding: 14px 16px; border-left: 4px solid #dc2626; background-color: #fff5f5; border-radius: 0 8px 8px 0; color: #7c2d12; font-size: 14px; line-height: 1.5;">
      <strong>Nota:</strong> ${order.notes}
    </div>` : ''}
  `;

  return brandEmailShell(body, 'Nueva venta recibida');
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
          <td style="padding: 11px 8px; border-bottom: 1px solid #f0f0f0; color: #252525; font-size: 14px;">
            ${item.name}
            ${item.composicion || item.medida ? `<br><span style="color: #8e8e8e; font-size: 12px;">${[item.composicion, item.medida].filter(Boolean).join(' &middot; ')}</span>` : ''}
          </td>
          <td style="padding: 11px 8px; border-bottom: 1px solid #f0f0f0; color: #8e8e8e; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 11px 8px; border-bottom: 1px solid #f0f0f0; color: #252525; font-size: 14px; font-weight: 600; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
        </tr>
      `
    )
    .join('');

  const statusBadge = confirmed
    ? `<div style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.06em;">&#10003; Pago confirmado</div>`
    : `<div style="display: inline-block; background-color: #fef9c3; color: #854d0e; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.06em;">&#128203; Pedido recibido</div>`;

  const greeting = confirmed
    ? `&iexcl;Pago confirmado, ${order.customerName.split(' ')[0]}!`
    : `&iexcl;Recibimos tu pedido, ${order.customerName.split(' ')[0]}!`;

  const bodyText = confirmed
    ? 'Tu pago fue procesado correctamente. Nos contactaremos pronto para coordinar la entrega.'
    : 'Tu pedido fue registrado correctamente. Nos contactaremos pronto para coordinar el pago y la entrega.';

  const body = `
    ${statusBadge}
    <h2 style="margin: 0 0 10px 0; color: #252525; font-size: 22px; font-weight: 700;">${greeting}</h2>
    <p style="margin: 0 0 28px 0; color: #8e8e8e; font-size: 14px; line-height: 1.6;">${bodyText}</p>

    <!-- Products -->
    <p style="margin: 0 0 12px 0; color: #252525; font-size: 15px; font-weight: 700; padding-left: 12px; border-left: 4px solid #dc2626;">&#128230; Tu pedido</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;">Producto</th>
          <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase;">Cant.</th>
          <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #ebebeb; color: #8e8e8e; font-size: 11px; text-transform: uppercase;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
      <tfoot>
        <tr style="background-color: #fff8f8;">
          <td colspan="2" style="padding: 14px 8px; text-align: right; color: #8e8e8e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Total:</td>
          <td style="padding: 14px 8px; text-align: right; color: #dc2626; font-size: 20px; font-weight: 700;">$${order.total.toLocaleString('es-AR')}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Delivery data -->
    <p style="margin: 0 0 12px 0; color: #252525; font-size: 15px; font-weight: 700; padding-left: 12px; border-left: 4px solid #dc2626;">&#128666; Datos de entrega</p>
    <div style="background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; padding: 18px 20px; margin-bottom: 16px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px; width: 35%;">Nombre</td><td style="padding: 4px 0; color: #252525; font-size: 13px; font-weight: 500;">${order.customerName}</td></tr>
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Email</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerEmail}</td></tr>
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Tel&eacute;fono</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerPhone || '&mdash;'}</td></tr>
        <tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">Direcci&oacute;n</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerAddress || '&mdash;'}</td></tr>
        ${order.customerDni ? `<tr><td style="padding: 4px 0; color: #8e8e8e; font-size: 13px;">DNI</td><td style="padding: 4px 0; color: #252525; font-size: 13px;">${order.customerDni}</td></tr>` : ''}
      </table>
    </div>

    <!-- Payment info -->
    <div style="background-color: #f8f8f8; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 3px 0; color: #8e8e8e; font-size: 13px; width: 40%;">N&deg; Pedido</td><td style="padding: 3px 0; color: #252525; font-size: 14px; font-weight: 700;">#${order.orderId}</td></tr>
        <tr><td style="padding: 3px 0; color: #8e8e8e; font-size: 13px;">M&eacute;todo de pago</td><td style="padding: 3px 0; color: #252525; font-size: 13px;">${order.paymentMethod}</td></tr>
        <tr><td style="padding: 3px 0; color: #8e8e8e; font-size: 13px;">Fecha</td><td style="padding: 3px 0; color: #252525; font-size: 13px;">${order.paymentDate}</td></tr>
      </table>
    </div>

    <p style="margin: 0; color: #8e8e8e; font-size: 13px; text-align: center; line-height: 1.7;">
      &iquest;Ten&eacute;s preguntas? Escrib&iacute;nos a <a href="mailto:flexituc@gmail.com" style="color: #dc2626; text-decoration: none; font-weight: 600;">flexituc@gmail.com</a><br>
      o por WhatsApp: <a href="https://wa.me/5493815824678" style="color: #dc2626; text-decoration: none; font-weight: 600;">+54 9 381 582-4678</a>
    </p>
  `;

  return brandEmailShell(body, confirmed ? 'Pago confirmado' : 'Pedido recibido');
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
