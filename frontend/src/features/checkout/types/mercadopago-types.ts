/**
 * MercadoPago integration types
 * Following the backend validation schemas
 */

/**
 * Item for MercadoPago preference
 */
export interface MercadoPagoPreferenceItem {
  productId: string;
  quantity: number;
  composition?: string;
  measurement?: string;
  base_type?: "Económica" | "Reforzada";
}

/**
 * Payer information for MercadoPago preference
 */
export interface MercadoPagoPreferencePayer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
  identification?: {
    type?: string;
    number?: string;
  };
  address?: {
    zip_code?: string;
    street_name?: string;
    street_number?: string;
  };
}

/**
 * Request body for creating a MercadoPago preference
 */
export interface MercadoPagoPreferenceRequest {
  items: MercadoPagoPreferenceItem[];
  couponCode?: string;
  payer?: MercadoPagoPreferencePayer;
  external_reference?: string;
  notification_url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Response from creating a MercadoPago preference
 */
export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  collector_id: number;
  external_reference?: string;
}

/**
 * Payment status from MercadoPago
 */
export type MercadoPagoPaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled"
  | "in_process"
  | "in_mediation"
  | "charged_back";

/**
 * Payment information stored with order
 */
export interface MercadoPagoPaymentInfo {
  preferenceId: string;
  externalReference: string;
  status: MercadoPagoPaymentStatus;
  paymentId?: string;
  createdAt: string;
}

/**
 * Error response from MercadoPago API
 */
export interface MercadoPagoErrorResponse {
  error: string;
  message: string;
  details?: Array<{
    path: string;
    message: string;
  }>;
}
