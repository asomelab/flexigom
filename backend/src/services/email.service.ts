import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export interface OrderEmailData {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
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

function teamOrderNotificationHtml(order: OrderEmailData): string {
  const itemsList = order.items
    .map(
      item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #ebebeb; color: #111827;">${item.name}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #ebebeb; color: #737373;">${item.composicion || '-'}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #ebebeb; color: #737373;">${item.medida || '-'}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #ebebeb; color: #737373; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #ebebeb; color: #111827; font-weight: bold; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
      </tr>
    `
    )
    .join('')

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #000000; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">
          Flexigom <span style="color: #dc2626;">Ventas</span>
        </h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px;">Nueva orden recibida</p>
      </div>

      <div style="padding: 30px 25px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 1px solid #ebebeb; padding-bottom: 15px;">
          <div style="padding-right: 20px;">
            <p style="margin: 0; color: #737373; font-size: 12px; text-transform: uppercase; font-weight: bold;">Orden ID</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 18px; font-weight: bold;">#${order.orderId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #737373; font-size: 12px; text-transform: uppercase; font-weight: bold;">Fecha</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 14px;">${order.orderDate}</p>
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

      <div style="background-color: #000000; padding: 20px; text-align: center; color: #a0a0a0; font-size: 12px;">
        <p style="margin: 0;">Este es un mensaje automático del sistema de ventas de Flexigom.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Flexigom. Todos los derechos reservados.</p>
      </div>
    </div>
  `
}

function customerOrderConfirmationHtml(order: OrderEmailData): string {
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
    .join('')

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ebebeb; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #000000; padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">
          Flexigom <span style="color: #dc2626;">✓</span>
        </h1>
        <p style="color: #a0a0a0; margin: 10px 0 0 0; font-size: 14px;">Pedido confirmado</p>
      </div>

      <div style="padding: 30px 25px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 10px 0;">¡Gracias por tu compra, ${order.customerName.split(' ')[0]}!</h2>
        <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">Recibimos tu pedido correctamente. Nos contactaremos pronto para confirmar los detalles de entrega.</p>

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

        <div style="background-color: #f5f5f5; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0; color: #737373; font-size: 12px; font-weight: bold;">NÚMERO DE ORDEN</p>
          <p style="margin: 0; color: #111827; font-size: 16px; font-weight: bold;">#${order.orderId}</p>
        </div>

        <p style="color: #737373; font-size: 13px; text-align: center; margin: 0;">Si tienes preguntas, no dudes en contactarnos a <strong>flexituc@gmail.com</strong></p>
      </div>

      <div style="background-color: #000000; padding: 20px; text-align: center; color: #a0a0a0; font-size: 12px;">
        <p style="margin: 0; color: #a0a0a0;">Flexigom — 20+ años de experiencia en colchones y descanso</p>
      </div>
    </div>
  `
}

export async function sendNewOrderEmail(order: OrderEmailData): Promise<{ success: boolean; error?: unknown }> {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_TO_TEAM || process.env.GMAIL_TO_TEST || '',
      subject: `🛍️ Nueva venta #${order.orderId} — $${order.total.toLocaleString('es-AR')}`,
      html: teamOrderNotificationHtml(order),
    }

    console.log('[Email Service] Sending team notification to:', mailOptions.to)
    const info = await transporter.sendMail(mailOptions)
    console.log('[Email Service] Team notification sent successfully:', info.messageId)
    return { success: true }
  } catch (err) {
    console.error('[Email Service] Error sending team notification:', err)
    return { success: false, error: err }
  }
}

export async function sendOrderConfirmationEmail(order: OrderEmailData): Promise<{ success: boolean; error?: unknown }> {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: order.customerEmail,
      subject: `✅ Recibimos tu pedido #${order.orderId} — Flexigom`,
      html: customerOrderConfirmationHtml(order),
    }

    console.log('[Email Service] Sending customer confirmation to:', mailOptions.to)
    const info = await transporter.sendMail(mailOptions)
    console.log('[Email Service] Customer confirmation sent successfully:', info.messageId)
    return { success: true }
  } catch (err) {
    console.error('[Email Service] Error sending customer confirmation:', err)
    return { success: false, error: err }
  }
}
