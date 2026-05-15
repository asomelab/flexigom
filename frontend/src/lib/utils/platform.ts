/**
 * Platform detection and keyboard shortcut utilities
 */

export interface KeyboardShortcut {
  symbol: string;
  key: string;
  displayText: string;
}

// Type declaration for the User-Agent Client Hints API
interface NavigatorUAData {
  platform: string;
  brands: Array<{ brand: string; version: string }>;
}

declare global {
  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

/**
 * Detects if the current platform is macOS
 * @returns true if running on macOS, false otherwise
 */
export const isMacOS = (): boolean => {
  if (typeof window === "undefined") return false;

  // Use modern userAgentData API if available
  if (navigator.userAgentData?.platform) {
    return navigator.userAgentData.platform === "macOS";
  }

  // Fallback to userAgent string parsing
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("mac") &&
    !userAgent.includes("iphone") &&
    !userAgent.includes("ipad")
  );
};

/**
 * Detects if the current platform is Windows
 * @returns true if running on Windows, false otherwise
 */
export const isWindows = (): boolean => {
  if (typeof window === "undefined") return false;

  // Use modern userAgentData API if available
  if (navigator.userAgentData?.platform) {
    return navigator.userAgentData.platform === "Windows";
  }

  // Fallback to userAgent string parsing
  return navigator.userAgent.toLowerCase().includes("win");
};

/**
 * Gets the appropriate keyboard shortcut for the current platform
 * @param key - The key to combine with the modifier (default: 'K')
 * @returns KeyboardShortcut object with symbol, key, and display text
 */
export const getKeyboardShortcut = (key: string = "K"): KeyboardShortcut => {
  const mac = isMacOS();

  return {
    symbol: mac ? "⌘" : "Ctrl",
    key,
    displayText: mac ? `⌘${key}` : `Ctrl+${key}`,
  };
};

/**
 * Gets the modifier key event property name for the current platform
 * @returns 'metaKey' for macOS, 'ctrlKey' for other platforms
 */
export const getModifierKey = (): "metaKey" | "ctrlKey" => {
  return isMacOS() ? "metaKey" : "ctrlKey";
};

/**
 * Checks if a keyboard event matches the platform-specific shortcut
 * @param event - Keyboard event to check
 * @param key - The key to match (case insensitive)
 * @returns true if the event matches the platform shortcut
 */
export const isShortcutPressed = (
  event: KeyboardEvent,
  key: string,
): boolean => {
  if (!event.key) return false;

  const targetKey = key.toLowerCase();
  const eventKey = event.key.toLowerCase();

  // Check if the correct modifier key is pressed along with the target key
  if (isMacOS()) {
    return event.metaKey && eventKey === targetKey;
  } else {
    return event.ctrlKey && eventKey === targetKey;
  }
};
