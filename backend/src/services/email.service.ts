
// Initialize Resend with API Key from environment

export interface OrderEmailData {
  // Customer data
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string

  // Order data
  orderId: string
  orderDate: string
  paymentDate: string
  items: {
    name: string
    quantity: number
    price: number
    composicion?: string | null
    medida?: string | null
  }[]
  total: number
  paymentMethod: string
  notes?: string
}

/**
 * Sends a notification email to the Flexigom team for a new sale
 */
export async function sendNewOrderEmail(order: OrderEmailData) {
  try {
    const itemsList = order.items
      .map(item => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${item.name}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${item.composicion || '-'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${item.medida || '-'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: bold; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
        </tr>
      `)
      .join('')

    await strapi.plugin('email').service('email').send({
      to: process.env.SMTP_TO_EMAIL,
      subject: `🛍️ Nueva venta #${order.orderId} — $${order.total.toLocaleString('es-AR')}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background-color: #94a3b8; padding: 30px 20px; text-align: center;">
            <img src="https://flexigomtucuman.com/flexigom.png" alt="Logo de Flexigom" style="width: 150px; height: auto; display: block; margin: 0 auto 15px auto;" />
            <h1 style="color: #ff0000ff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">
              Flexigom Ventas
            </h1>
            <p style="color: #000000; margin: 10px 0 0 0; font-size: 14px;">Notificación de nueva orden recibida</p>
          </div>

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

            <!-- Items Table -->
            <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid #f97316;">📦 Detalles del Pedido</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">PRODUCTO</th>
                  <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">COMP.</th>
                  <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">MEDIDA</th>
                  <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">CANT.</th>
                  <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px;">PRECIO</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding: 20px 8px 10px 8px; text-align: right; color: #64748b; font-weight: bold;">TOTAL:</td>
                  <td style="padding: 20px 8px 10px 8px; text-align: right; color: #ff0000ff; font-size: 20px; font-weight: bold;">$${order.total.toLocaleString('es-AR')}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Payment and Dates Info -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; display: grid; gap: 15px;">
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px;">
                <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold;">INFORMACIÓN DE PAGO</p>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px;"><strong>Método:</strong> ${order.paymentMethod}</p>
                <p style="margin: 5px 0 0 0; color: #1e293b; font-size: 14px;"><strong>Fecha de pago:</strong> ${order.paymentDate}</p>
              </div>
            </div>

            <!-- Customer Info -->
            <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0; padding-left: 10px; border-left: 4px solid #1a1a1a;">👤 Datos del Cliente</h3>
            <div style="background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px;">
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Nombre:</strong> ${order.customerName}</p>
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Email:</strong> ${order.customerEmail}</p>
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 14px;"><strong>Teléfono:</strong> ${order.customerPhone}</p>
              <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Dirección:</strong> ${order.customerAddress}</p>
            </div>

            ${order.notes ? `
            <div style="margin-top: 25px;">
              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; font-weight: bold;">NOTAS DEL PEDIDO</p>
              <div style="padding: 15px; border-left: 4px solid #ff0000ff; background-color: #fffaf0; color: #7c2d12; font-size: 14px; border-radius: 0 4px 4px 0;">
                ${order.notes}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Este es un mensaje automático del sistema de ventas de Flexigom.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Flexigom. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    });

    console.log('[Email Service] Notification email sent successfully via SMTP/Nodemailer');
    return { success: true };
  } catch (err) {
    console.error('[Email Service] Unexpected error sending email via SMTP:', err);
    return { success: false, error: err };
  }
}
