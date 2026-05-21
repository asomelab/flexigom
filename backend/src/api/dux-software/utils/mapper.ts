/**
 * Dux Software Invoice Mapper
 * Transforms Flexigom order data to Dux invoice format
 */

import type { StrapiOrder, DuxInvoiceRequest, DuxInvoiceItem } from "../types";

/**
 * Map Flexigom order to Dux invoice request
 *
 * Note: This is a flexible mapping that will be refined once we discover
 * the exact Dux API requirements through testing.
 */
export function mapOrderToDuxInvoice(order: StrapiOrder): DuxInvoiceRequest {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const fecha_comprobante = `${day}${month}${year}`;

  const invoiceRequest: DuxInvoiceRequest = {
    // Company and Branch identifiers
    id_empresa: 9325, // DISTRIBUIDORA FLEXIGOM
    id_sucursal_empresa: 1, // CASA CENTRAL
    nro_pto_vta: "1",
    id_personal: 1,
    id_deposito: 18270, // DEPOSITO

    // Invoice metadata
    tipo_entrega: "ENTREGA_INMEDIATA",
    tipo_comp: "FACTURA",
    fecha_comprobante,

    // Customer information (required fields only - KISS approach)
    apellido_razon_soc: order.customer_name || "CONSUMIDOR FINAL",
    categoria_fiscal: order.customer_fiscal_category || "CONSUMIDOR_FINAL",
    tipo_doc: order.customer_document_type || "DNI",
    nro_doc: order.customer_dni || "00000000",
    email_cliente: order.customer_email,
    telefono_cliente: order.customer_phone || "",
    direccion_cliente: order.customer_address || "",

    // Ecommerce Product
    productos: order.items.map((item) => ({
      cod_item: "EC1",
      ctd: item.quantity,
      porc_desc: "0",
      precio_uni: item.unit_price,
    })),
  };

  return invoiceRequest;
}

/**
 * Calculate total from items (prices already include IVA)
 */
export function calculateTotal(items: DuxInvoiceItem[]): number {
  return items.reduce((total, item) => {
    return total + item.cantidad * item.precioUnitario;
  }, 0);
}

/**
 * Validate order has required data for invoicing
 */
export function validateOrderForInvoicing(order: StrapiOrder): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!order.customer_name || order.customer_name.trim() === "") {
    errors.push("Customer name is required");
  }

  if (!order.customer_email || order.customer_email.trim() === "") {
    errors.push("Customer email is required");
  }

  if (!order.customer_dni || order.customer_dni.trim() === "") {
    errors.push("Customer document number is required");
  }

  if (!order.customer_document_type) {
    errors.push("Customer document type is required");
  }

  if (!order.customer_fiscal_category) {
    errors.push("Customer fiscal category is required");
  }

  if (!order.items || order.items.length === 0) {
    errors.push("Order must have at least one item");
  }

  if (!order.transaction_amount || order.transaction_amount <= 0) {
    errors.push("Transaction amount must be greater than 0");
  }

  if (!order.external_reference || order.external_reference.trim() === "") {
    errors.push("External reference is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
