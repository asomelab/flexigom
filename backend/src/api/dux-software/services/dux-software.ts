/**
 * Dux Software Service
 * Main service for creating and managing invoices in Dux Software
 */

import type {
  DuxConfig,
  StrapiOrder,
  DuxInvoiceRequest,
  DuxInvoiceResponse,
  CreateInvoiceResult,
} from '../types';
import { loadDuxConfig } from '../utils/auth';
import { createDuxClient, extractErrorMessage, DuxClient } from '../utils/client';
import { mapOrderToDuxInvoice, validateOrderForInvoicing } from '../utils/mapper';
import { retryWithBackoff } from '../utils/retry';
import { logDuxError, createErrorSummary, shouldRetryInvoice } from '../utils/error-handler';

export default () => {
  let duxClient: DuxClient | null = null;
  let config: DuxConfig | null = null;

  /**
   * Initialize Dux client (lazy initialization)
   */
  const getDuxClient = (): DuxClient => {
    if (!duxClient || !config) {
      config = loadDuxConfig();
      duxClient = createDuxClient(config);
    }
    return duxClient;
  };

  return {
    /**
     * Create invoice in Dux Software from order
     */
    async createInvoice(order: StrapiOrder): Promise<CreateInvoiceResult> {
      console.log(`[Dux Service] Creating invoice for order ${order.id} (${order.external_reference})`);

      // Validate order data
      const validation = validateOrderForInvoicing(order);
      if (!validation.valid) {
        const errorMessage = `Validación fallida: ${validation.errors.join(', ')}`;
        console.error(`[Dux Service] ${errorMessage}`);

        await this.updateOrderWithInvoiceFailure(order.id, errorMessage, 0);

        return {
          success: false,
          orderId: order.id,
          error: errorMessage,
          shouldRetry: false, // Don't retry validation errors
        };
      }

      // Check if invoice already created
      if (order.dux_invoice_id) {
        console.log(`[Dux Service] Invoice already exists for order ${order.id}: ${order.dux_invoice_id}`);
        return {
          success: true,
          orderId: order.id,
          invoiceId: order.dux_invoice_id,
          invoiceNumber: order.dux_invoice_number,
          shouldRetry: false,
        };
      }

      // Map order to invoice request
      const invoiceRequest = mapOrderToDuxInvoice(order);

      // Get config for retry attempts
      const duxConfig = loadDuxConfig();
      const maxAttempts = duxConfig.retryAttempts;
      let currentAttempt = order.dux_invoice_attempts || 0;

      try {
        // Call Dux API with retry logic
        const invoiceResponse = await retryWithBackoff(
          async () => {
            currentAttempt++;

            // Update order with current attempt
            await this.updateOrderAttempts(order.id, currentAttempt);

            // Call Dux API
            return await this.callCreateInvoiceAPI(invoiceRequest);
          },
          maxAttempts,
          (error) => shouldRetryInvoice(error, currentAttempt, maxAttempts)
        );

        // Update order with invoice data
        await this.updateOrderWithInvoiceSuccess(order.id, invoiceResponse);

        console.log(`[Dux Service] Invoice created successfully for order ${order.id}`);

        return {
          success: true,
          orderId: order.id,
          invoiceId: invoiceResponse.invoiceId,
          invoiceNumber: invoiceResponse.invoiceNumber,
          shouldRetry: false,
        };
      } catch (error) {
        logDuxError('Failed to create invoice after all retries', error, order.id);

        const errorSummary = createErrorSummary(error, currentAttempt, maxAttempts);
        await this.updateOrderWithInvoiceFailure(order.id, errorSummary, currentAttempt);

        return {
          success: false,
          orderId: order.id,
          error: extractErrorMessage(error),
          shouldRetry: false, // Already exhausted retries
        };
      }
    },

    /**
     * Call Dux API to create invoice (actual API call)
     */
    async callCreateInvoiceAPI(invoiceRequest: DuxInvoiceRequest): Promise<DuxInvoiceResponse> {
      const client = getDuxClient();

      console.log('[Dux Service] Calling Dux API to create invoice...');
      console.log('[Dux Service] Request payload:', JSON.stringify(invoiceRequest, null, 2));

      // Call the Dux API endpoint
      // Endpoint: POST /factura/nuevaFactura
      const response = await client.post('/factura/nuevaFactura', invoiceRequest);

      console.log('[Dux Service] Dux API response:', JSON.stringify(response.data, null, 2));

      // Parse response (flexible schema during discovery)
      const data = response.data;

      // Dux API returns 200 status even with errors
      const errorMessage = 
        data.error || 
        data.mensaje_error || 
        data.mensajeError ||
        (data.message && data.message.toLowerCase().includes('error') ? data.message : null);

      if (errorMessage) {
        const error: any = new Error(`Dux API Error: ${errorMessage}`);
        error.response = {
          status: 200,
          data,
        };
        throw error;
      }

      // Try to extract invoice ID from response
      // Dux API returns 'id_proceso' (process ID) on successful invoice creation
      const invoiceId =
        data.id_proceso ||     // Primary: Dux returns this
        data.id ||             // Fallback: generic ID
        data.invoiceId ||      // Fallback: camelCase variant
        data.invoice_id ||     // Fallback: snake_case variant
        null;

      const invoiceNumber =
        data.invoiceNumber ||
        data.invoice_number ||
        data.numeroFactura ||
        data.numero_factura ||
        data.numero ||
        null;

      if (!invoiceId) {
        const error: any = new Error('Dux API did not return an invoice ID');
        error.response = {
          status: 200,
          data,
        };
        throw error;
      }

      return {
        success: true,
        invoiceId: invoiceId?.toString(),
        invoiceNumber: invoiceNumber?.toString(),
        data,
      };
    },

    /**
     * Get order documentId from numeric id
     */
    async getOrderDocumentId(orderId: number): Promise<string> {
      const orders = await strapi.documents('api::order.order').findMany({
        filters: { id: orderId },
        limit: 1,
      });
      if (orders && orders.length > 0) {
        return orders[0].documentId;
      }
      throw new Error(`Order not found with id ${orderId}`);
    },

    /**
     * Update order with successful invoice data
     */
    async updateOrderWithInvoiceSuccess(
      orderId: number,
      invoiceResponse: DuxInvoiceResponse
    ): Promise<void> {
      try {
        const documentId = await this.getOrderDocumentId(orderId);
        await strapi.documents('api::order.order').update({
          documentId,
          data: {
            dux_invoice_id: invoiceResponse.invoiceId,
            dux_invoice_number: invoiceResponse.invoiceNumber,
            dux_invoice_status: 'created',
            dux_invoice_data: invoiceResponse.data,
            dux_invoice_created_at: new Date().toISOString(),
            dux_invoice_error: undefined,
          },
        });

        console.log(`[Dux Service] Updated order ${orderId} with invoice data`);
      } catch (error) {
        console.error(`[Dux Service] Failed to update order ${orderId}:`, error);
        throw error;
      }
    },

    /**
     * Update order with invoice failure
     */
    async updateOrderWithInvoiceFailure(
      orderId: number,
      errorMessage: string,
      attempts: number
    ): Promise<void> {
      try {
        const documentId = await this.getOrderDocumentId(orderId);
        await strapi.documents('api::order.order').update({
          documentId,
          data: {
            dux_invoice_status: 'failed',
            dux_invoice_error: errorMessage,
            dux_invoice_attempts: attempts,
          },
        });

        console.log(`[Dux Service] Updated order ${orderId} with invoice failure`);
      } catch (error) {
        console.error(`[Dux Service] Failed to update order ${orderId} with error:`, error);
      }
    },

    /**
     * Update order attempt count
     */
    async updateOrderAttempts(orderId: number, attempts: number): Promise<void> {
      try {
        const documentId = await this.getOrderDocumentId(orderId);
        await strapi.documents('api::order.order').update({
          documentId,
          data: {
            dux_invoice_status: 'retrying',
            dux_invoice_attempts: attempts,
          },
        });
      } catch (error) {
        console.error(`[Dux Service] Failed to update order ${orderId} attempts:`, error);
      }
    },

    /**
     * Get invoice status from Dux (optional - for future use)
     */
    async getInvoiceStatus(invoiceId: string): Promise<any> {
      const client = getDuxClient();

      console.log(`[Dux Service] Getting invoice status for: ${invoiceId}`);

      // Endpoint: GET /obtenerEstadoFactura
      const response = await client.get('/obtenerEstadoFactura', {
        params: { invoiceId },
      });

      return response.data;
    },
  };
};
