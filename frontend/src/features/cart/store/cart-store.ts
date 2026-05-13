import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Product } from "@/types";
import type { CartState } from "../types";
import api from "@/lib/api";
import { toast } from "sonner";
import { pixel } from "@/lib/meta-pixel";

/**
 * Tax rate (21% IVA in Argentina)
 */
const TAX_RATE = 0;

/**
 * Cart store mapped to Strapi Backend API
 * - Removes local storage persistence
 * - Updates State via Async requests
 */
export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      items: [],
      isSyncing: false,

      /**
       * Fetch active cart from Strapi
       */
      fetchCart: async () => {
        set({ isSyncing: true }, false, "fetchCart/start");
        try {
          const { data } = await api.get("/cart/my-cart");
          set({ items: data.data?.items || [] }, false, "fetchCart/success");
        } catch (error) {
          console.error("Failed to fetch cart:", error);
          set({ items: [] }, false, "fetchCart/error");
        } finally {
          set({ isSyncing: false }, false, "fetchCart/end");
        }
      },

      /**
       * Add item to cart or update quantity if already exists via backend
       */
      addItem: async (
        product: Product,
        quantity = 1,
        baseType?: "Económica" | "Reforzada",
      ) => {
        set({ isSyncing: true }, false, "addItem/start");
        try {
          const payload = {
            productId: product.documentId,
            quantity,
            composition: product.composition,
            measurement: product.measurement,
            base_type: baseType,
          };

          const { data } = await api.post("/cart/items", payload);
          // Backend returns the full updated cart
          set({ items: data.data?.items || [] }, false, "addItem/success");

          // Track AddToCart event
          const isReinforced =
            product.has_base_options && baseType === "Reforzada";
          const price = isReinforced
            ? Number(product.reinforced_base_price) ||
              Number(product.price) ||
              0
            : Number(product.price) || 0;
          const discountPrice = isReinforced
            ? Number(product.reinforced_base_discount_price) || 0
            : Number(product.discount_price) || 0;
          const finalPrice =
            discountPrice > 0 && discountPrice < price ? discountPrice : price;

          pixel.addToCart({
            content_ids: [product.documentId],
            content_name: product.name,
            content_type: "product",
            value: finalPrice * quantity,
            currency: "ARS",
          });
        } catch (error) {
          console.error("Failed to add item:", error);
          toast.error("Error al agregar al carrito");
        } finally {
          set({ isSyncing: false }, false, "addItem/end");
        }
      },

      /**
       * Remove item from cart by CartItem documentId
       */
      removeItem: async (itemId: string) => {
        set({ isSyncing: true }, false, "removeItem/start");
        try {
          // If itemId is missing, it could be we only have productId (old cached state), but we expect CartItem documentId
          const { data } = await api.delete(`/cart/items/${itemId}`);
          set({ items: data.data?.items || [] }, false, "removeItem/success");
        } catch (error) {
          console.error("Failed to remove item:", error);
          toast.error("Error al eliminar el producto");
        } finally {
          set({ isSyncing: false }, false, "removeItem/end");
        }
      },

      /**
       * Update item quantity
       */
      updateQuantity: async (itemId: string, quantity: number) => {
        set({ isSyncing: true }, false, "updateQuantity/start");
        try {
          let response;
          if (quantity <= 0) {
            response = await api.delete(`/cart/items/${itemId}`);
          } else {
            response = await api.patch(`/cart/items/${itemId}`, { quantity });
          }
          set(
            { items: response.data.data?.items || [] },
            false,
            "updateQuantity/success",
          );
        } catch (error) {
          console.error("Failed to update cart quantity:", error);
          toast.error("Error al actualizar la cantidad");
        } finally {
          set({ isSyncing: false }, false, "updateQuantity/end");
        }
      },

      /**
       * Clear all items from cart
       */
      clearCart: async () => {
        set({ isSyncing: true }, false, "clearCart/start");
        try {
          const { data } = await api.delete("/cart");
          set({ items: data.data?.items || [] }, false, "clearCart/success");
        } catch (error) {
          console.error("Failed to clear cart:", error);
          toast.error("Error al vaciar el carrito");
        } finally {
          set({ isSyncing: false }, false, "clearCart/end");
        }
      },

      /**
       * Get total number of items in cart
       */
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      /**
       * Get cart subtotal (before tax)
       * Note: The backend cart item has a fixed `price` attribute which we should use!
       */
      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          // Fallback to front-end calc if item.price is not populated by backend yet
          let price = Number(item.price);

          if (!price && item.product) {
            price =
              item.product.discount_price > 0 &&
              item.product.discount_price < item.product.price
                ? item.product.discount_price
                : item.product.price;
          }
          return total + price * item.quantity;
        }, 0);
      },

      /**
       * Get tax amount
       */
      getTax: () => {
        const subtotal = get().getSubtotal();
        return subtotal * TAX_RATE;
      },

      /**
       * Get cart total (subtotal + tax)
       * Note: Tax is now 0 as it's already included in product prices
       */
      getTotal: () => {
        return get().getSubtotal();
      },

      /**
       * Get specific item from cart by productId (used by UI for quick lookups)
       */
      getItem: (productId: string) => {
        return get().items.find(
          (item) =>
            item.product?.documentId === productId ||
            item.productId === productId,
        );
      },
    }),
    {
      name: "CartStore", // DevTools name
    },
  ),
);

/**
 * Selectors for optimized component re-renders
 */
export const selectCartItems = (state: CartState) => state.items;
export const selectCartItemCount = (state: CartState) => state.getItemCount();
export const selectCartSubtotal = (state: CartState) => state.getSubtotal();
export const selectCartTotal = (state: CartState) => state.getTotal();
export const selectCartIsSyncing = (state: CartState) => state.isSyncing;
export const selectCartItem = (productId: string) => (state: CartState) =>
  state.getItem(productId);
