import type { Product } from "@/types";
import type { ShippingFormData } from "./shipping-types";

/**
 * Cart item with product information and quantity
 */
export interface CartItem {
  id?: string;
  documentId?: string;
  productId?: string;
  price?: number;
  product: Product;
  quantity: number;
  addedAt?: string; // ISO timestamp
  composition?: string;
  measurement?: string;
  base_type?: "Económica" | "Reforzada";
}

/**
 * Discount coupon definition
 */
export interface Coupon {
  id?: number | string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
}

/**
 * Cart state managed by Zustand
 */
export interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  appliedCoupon: Coupon | null;
  // Actions
  fetchCart: () => Promise<void>;
  addItem: (
    product: Product,
    quantity?: number,
    baseType?: "Económica" | "Reforzada",
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  // Computed getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  getItem: (productId: string) => CartItem | undefined;
}

/**
 * Checkout step enumeration
 */
export enum CheckoutStep {
  SHIPPING = "shipping",
  PAYMENT = "payment",
  REVIEW = "review",
  CONFIRMATION = "confirmation",
}

/**
 * Payment method types
 */
export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "transfer"
  | "mercadopago"
  | "cash";

/**
 * Payment information form data
 */
export interface PaymentFormData {
  paymentMethod: PaymentMethodType;
  // Credit/Debit card fields (optional, only for card payments)
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

/**
 * Complete checkout form data
 */
export interface CheckoutFormData {
  shipping: ShippingFormData;
  payment: PaymentFormData;
}

/**
 * Checkout state managed by Zustand
 */
export interface CheckoutState {
  currentStep: CheckoutStep;
  formData: Partial<CheckoutFormData>;
  isProcessing: boolean;
  orderId: string | null;
  error: string | null;
  // Actions
  setCurrentStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateShippingData: (data: ShippingFormData) => void;
  updatePaymentData: (data: PaymentFormData) => void;
  resetCheckout: () => void;
  submitOrder: () => Promise<void>;
}

/**
 * Order summary for display
 */
export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}
