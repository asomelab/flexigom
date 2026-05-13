/**
 * Meta Pixel Utility
 * Safely wraps fbq calls and provides typed eCommerce events
 */

// Define fbq type on window to prevent TS errors
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const pixel = {
  /**
   * Track standard PageView event
   */
  pageView: () => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  },

  /**
   * Track ViewContent event (when user views a product)
   */
  viewContent: (data: {
    content_ids: string[];
    content_name: string;
    content_type: string;
    content_category?: string;
    value: number;
    currency: string;
  }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", data);
    }
  },

  /**
   * Track AddToCart event
   */
  addToCart: (data: {
    content_ids: string[];
    content_name: string;
    content_type: string;
    value: number;
    currency: string;
  }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "AddToCart", data);
    }
  },

  /**
   * Track Purchase event
   */
  purchase: (data: {
    content_ids?: string[];
    value: number;
    currency: string;
    order_id?: string;
  }) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Purchase", data);
    }
  },
};
