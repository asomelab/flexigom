/**
 * Dux Software API Types
 * Types for Dux Software invoice integration
 */

export interface DuxConfig {
  baseUrl: string;
  apiToken: string;
  environment: 'production' | 'test';
  retryAttempts: number;
  timeout: number;
}

export interface DuxCustomer {
  nombre?: string;
  email?: string;
  telefono?: string;
  cuit?: string;
  direccion?: string;
  [key: string]: any; // Allow additional fields during discovery
}

export interface DuxInvoiceItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  iva?: number;
  [key: string]: any; // Allow additional fields during discovery
}

export interface DuxInvoiceRequest {
  cliente?: DuxCustomer;
  items?: DuxInvoiceItem[];
  [key: string]: any; // Allow additional fields during discovery
}

export interface DuxInvoiceResponse {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  message?: string;
  error?: string;
  data?: any;
}

export interface DuxErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
  details?: any;
}

export interface StrapiOrder {
  id: number;
  documentId?: string;
  external_reference: string;
  payment_id?: string;
  payment_status: string;
  payment_method?: string;
  transaction_amount?: number;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_dni?: string;
  customer_document_type?: 'DNI' | 'CUIT';
  customer_fiscal_category?: 'CONSUMIDOR_FINAL' | 'RESPONSABLE_INSCRIPTO' | 'EXENTO' | 'MONOTRIBUTISTA';
  customer_address?: string;
  items: OrderItem[];
  dux_invoice_id?: string;
  dux_invoice_number?: string;
  dux_invoice_status?: 'pending' | 'created' | 'failed' | 'retrying';
  dux_invoice_attempts?: number;
  dux_invoice_error?: string;
  dux_invoice_data?: any;
  dux_invoice_created_at?: string;
}

export interface OrderItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  picture_url?: string;
}

export interface CreateInvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  orderId: number;
  error?: string;
  shouldRetry: boolean;
}
