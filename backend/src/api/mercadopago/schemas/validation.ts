import { z } from "zod";

// Phone schema
export const phoneSchema = z
  .object({
    area_code: z.string().optional(),
    number: z.string().optional(),
  })
  .optional();

// Identification schema
export const identificationSchema = z
  .object({
    type: z.string().optional(),
    number: z.string().optional(),
  })
  .optional();

// Address schema
export const addressSchema = z
  .object({
    zip_code: z.string().optional(),
    street_name: z.string().optional(),
    street_number: z.string().optional(),
  })
  .optional();

// Payer schema
export const payerSchema = z
  .object({
    name: z.string().optional(),
    surname: z.string().optional(),
    email: z.email("Invalid email format").optional(),
    phone: phoneSchema,
    identification: identificationSchema,
    address: addressSchema,
  })
  .optional();

// Item schema
export const itemSchema = z.object({
  productId: z.string().min(1, "Product ID cannot be empty"),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .max(99, "Quantity cannot exceed 99 units"),

  composition: z.string().optional(),
  measurement: z.string().optional(),
  base_type: z.enum(["Económica", "Reforzada"]).nullish().or(z.literal("")),
});

// Create preference request schema
export const createPreferenceSchema = z.object({
  items: z.array(itemSchema).nonempty("Items array cannot be empty"),

  couponCode: z.string().optional(),

  payer: payerSchema,

  external_reference: z.string().optional(),

  notification_url: z.string().url("Invalid notification URL").optional(),

  metadata: z.record(z.string(), z.any()).optional(),
});

// Type inference from schemas
export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;
export type PreferenceItem = z.infer<typeof itemSchema>;
export type PreferencePayer = z.infer<typeof payerSchema>;

// ============================================
// Webhook Validation Schemas
// ============================================

// Payment status enum
export const paymentStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'refunded',
  'cancelled',
  'in_process',
  'in_mediation',
  'charged_back',
]);

// Webhook notification types
export const notificationTypeSchema = z.enum([
  'payment',
  'merchant_order',
  'point_integration_wh',
  'subscription_preapproval',
  'subscription_authorized_payment',
]);

// Webhook action types
export const actionTypeSchema = z.enum([
  'payment.created',
  'payment.updated',
]);

// Webhook query parameters schema
export const webhookQuerySchema = z.object({
  id: z.string().optional(),
  topic: notificationTypeSchema.optional(),
  'data.id': z.string().optional(),
  type: notificationTypeSchema.optional(),
});

// Webhook notification body schema
export const webhookNotificationSchema = z.object({
  action: z.string().optional(),
  api_version: z.string().optional(),
  data: z.object({
    id: z.string(),
  }).optional(),
  date_created: z.string().optional(),
  id: z.number().optional(),
  live_mode: z.boolean().optional(),
  type: z.string().optional(),
  user_id: z.string().optional(),
});

// Type exports
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type WebhookQuery = z.infer<typeof webhookQuerySchema>;
export type WebhookNotification = z.infer<typeof webhookNotificationSchema>;
