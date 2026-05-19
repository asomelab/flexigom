import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GetImageUrlOptions {
  width?: number;
}

/**
 * Gets the full URL for a media file, optimizing Cloudinary URLs
 * @param url - The relative or absolute URL from Strapi media
 * @param options - Transformation options (e.g., width)
 * @returns The optimized full URL
 */
export function getImageUrl(url?: string, options?: GetImageUrlOptions): string | null {
  if (!url) return null;

  let finalUrl = url;

  // If URL doesn't include the protocol, it's relative to our backend
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const baseUrl = import.meta.env.VITE_STRAPI_URL || "http://localhost:1337";
    const mediaBaseUrl = baseUrl.replace("/api", "");
    finalUrl = `${mediaBaseUrl}${url}`;
  }

  // Intercept Cloudinary URLs to inject performance transformations
  if (finalUrl.includes("res.cloudinary.com") && finalUrl.includes("/image/upload/")) {
    const transformations = ["f_auto", "q_auto"];
    if (options?.width) {
      transformations.push(`w_${options.width}`);
    }
    
    const transformString = transformations.join(",");
    
    // Only inject if it doesn't already have f_auto (to prevent duplication)
    if (!finalUrl.includes("f_auto")) {
      finalUrl = finalUrl.replace("/image/upload/", `/image/upload/${transformString}/`);
    }
  }

  return finalUrl;
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const getCustomerSinceYear = (
  dateString: string | null | undefined,
): string => {
  if (!dateString) return "2024";
  try {
    const year = new Date(dateString).getFullYear();
    return isNaN(year) ? "2024" : year.toString();
  } catch {
    return "2024";
  }
};

export const handleShare = (product: { name: string }) => {
  if (navigator.share) {
    navigator.share({
      title: product.name,
      text: `Check out this ${product.name}`,
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
};

/**
 * Format CUIT input with dashes (20-12345678-9)
 */
export const formatCuitInput = (value: string): string => {
  const raw = value.replace(/\D/g, "").slice(0, 11);

  if (raw.length <= 2) return raw;
  if (raw.length <= 10) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
  return `${raw.slice(0, 2)}-${raw.slice(2, 10)}-${raw.slice(10)}`;
};

/**
 * Format DNI input (numeric only, max 8 digits)
 */
export const formatDniInput = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 8);
};

/**
 * Get raw document number without formatting
 */
export const getRawDocument = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Validate CUIT format (11 digits)
 */
export const isValidCuit = (value: string): boolean => {
  const raw = getRawDocument(value);
  return raw.length === 11;
};

/**
 * Validate DNI format (7-8 digits)
 */
export const isValidDni = (value: string): boolean => {
  const raw = getRawDocument(value);
  return raw.length >= 7 && raw.length <= 8;
};

export {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  isLocalStorageAvailable,
} from "./utils/localStorage";

export {
  normalizeSearchTerm,
  highlightSearchTerm,
  filterProductsBySearchTerm,
  isValidSearchTerm,
} from "./utils/search";

export {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} from "./utils/recentSearches";

export {
  isMacOS,
  isWindows,
  getKeyboardShortcut,
  getModifierKey,
  isShortcutPressed,
} from "./utils/platform";

export {
  sanitizeSearchTerm,
  validateSearchInput,
  escapeHtml,
  containsSuspiciousContent,
  sanitizeUrlParameter,
  createSecureDisplayTerm,
} from "./utils/security";

export {
  SecurityErrorType,
  showSecurityError,
  showSearchError,
  showSearchValidationError,
  sanitizeErrorMessage,
  shouldShowError,
  logSecurityEvent,
} from "./utils/error-messages";
