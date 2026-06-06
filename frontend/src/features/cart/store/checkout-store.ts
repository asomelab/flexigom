import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  CheckoutStep,
  type CheckoutState,
  type PaymentFormData,
} from "../types";
import type { ShippingFormData } from "../types/shipping-types";
import { useCartStore } from "./cart-store";
import { createManualOrder } from "@/features/checkout/services/order-service";

/**
 * Checkout flow store
 * Manages multi-step checkout process
 * Does NOT persist to avoid security issues with payment data
 */
export const useCheckoutStore = create<CheckoutState>()(
  devtools(
    (set, get) => ({
      currentStep: CheckoutStep.SHIPPING,
      formData: {},
      isProcessing: false,
      orderId: null,
      error: null,

      /**
       * Set current checkout step
       */
      setCurrentStep: (step: CheckoutStep) => {
        set({ currentStep: step, error: null }, false, "setCurrentStep");
      },

      /**
       * Move to next step in checkout flow
       */
      nextStep: () => {
        const { currentStep } = get();
        const steps = [
          CheckoutStep.SHIPPING,
          CheckoutStep.PAYMENT,
          CheckoutStep.REVIEW,
          CheckoutStep.CONFIRMATION,
        ];

        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          set(
            { currentStep: steps[currentIndex + 1], error: null },
            false,
            "nextStep",
          );
        }
      },

      /**
       * Move to previous step in checkout flow
       */
      previousStep: () => {
        const { currentStep } = get();
        const steps = [
          CheckoutStep.SHIPPING,
          CheckoutStep.PAYMENT,
          CheckoutStep.REVIEW,
          CheckoutStep.CONFIRMATION,
        ];

        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
          set(
            { currentStep: steps[currentIndex - 1], error: null },
            false,
            "previousStep",
          );
        }
      },

      /**
       * Update shipping form data
       */
      updateShippingData: (data: ShippingFormData) => {
        set(
          (state) => ({
            formData: {
              ...state.formData,
              shipping: data,
            },
          }),
          false,
          "updateShippingData",
        );
      },

      /**
       * Update payment form data
       */
      updatePaymentData: (data: PaymentFormData) => {
        set(
          (state) => ({
            formData: {
              ...state.formData,
              payment: data,
            },
          }),
          false,
          "updatePaymentData",
        );
      },

      /**
       * Reset checkout state
       */
      resetCheckout: () => {
        set(
          {
            currentStep: CheckoutStep.SHIPPING,
            formData: {},
            isProcessing: false,
            orderId: null,
            error: null,
          },
          false,
          "resetCheckout",
        );
      },

      /**
       * Submit order
       * NOTE: For MercadoPago payments, use MercadoPagoCheckoutButton instead
       * This is for other payment methods (cash, transfer, etc.)
       */
      submitOrder: async () => {
        set({ isProcessing: true, error: null }, false, "submitOrder:start");

        try {
          const { formData } = get();

          // Validate form data
          if (!formData.shipping || !formData.payment) {
            throw new Error("Información de envío y pago requerida");
          }

          // Get cart items
          const cart = useCartStore.getState();
          const cartItems = cart.items;

          if (cartItems.length === 0) {
            throw new Error("El carrito está vacío");
          }

          // For MercadoPago, the button handles the flow
          if (formData.payment.paymentMethod === "mercadopago") {
            throw new Error("Use el botón de MercadoPago para continuar");
          }

          const shipping = formData.shipping;
          const externalReference = `ORDER-${Date.now()}`;

          const rawPhone = shipping.phone || '';
          const digitsOnly = rawPhone.replace(/\D/g, '');
          const phoneMatch = digitsOnly.match(/^(\d{2,4})?(\d+)$/);
          const payer = {
            name: shipping.firstName,
            surname: shipping.lastName,
            email: shipping.email,
            phone: phoneMatch
              ? { area_code: phoneMatch[1] || "", number: phoneMatch[2] || digitsOnly }
              : { area_code: "", number: digitsOnly || rawPhone },
            identification: {
              type: shipping.documentType,
              number: shipping.documentNumber,
            },
            fiscalCategory: shipping.fiscalCategory,
            address: `${shipping.address}, ${shipping.city}, ${shipping.province} ${shipping.postalCode}`,
          };

          const items = cartItems.map((item) => ({
            productId: item.product.documentId || item.productId || "",
            quantity: item.quantity,
            composition: item.composition,
            measurement: item.measurement,
            base_type: item.base_type,
          }));

          const result = await createManualOrder({
            items,
            payer,
            couponCode: cart.appliedCoupon?.code,
            payment_method: formData.payment.paymentMethod,
            external_reference: externalReference,
          });

          cart.clearCart();

          set(
            {
              orderId: result.external_reference,
              isProcessing: false,
              currentStep: CheckoutStep.CONFIRMATION,
            },
            false,
            "submitOrder:success",
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al procesar la orden",
              isProcessing: false,
            },
            false,
            "submitOrder:error",
          );
        }
      },
    }),
    {
      name: "CheckoutStore",
    },
  ),
);

/**
 * Selectors for checkout state
 */
export const selectCurrentStep = (state: CheckoutState) => state.currentStep;
export const selectShippingData = (state: CheckoutState) =>
  state.formData.shipping;
export const selectPaymentData = (state: CheckoutState) =>
  state.formData.payment;
export const selectIsProcessing = (state: CheckoutState) => state.isProcessing;
export const selectOrderId = (state: CheckoutState) => state.orderId;
