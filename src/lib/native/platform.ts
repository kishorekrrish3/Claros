/**
 * Universal mobile/browser utilities for Claros.
 * Provides haptic feedback and native share sheets using standard Web APIs.
 */

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Triggers haptic vibration feedback on supported mobile devices.
 */
export async function triggerHaptic(
  type: "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error" = "light"
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (type === "light" || type === "selection") navigator.vibrate(12);
      else if (type === "medium") navigator.vibrate(24);
      else if (type === "heavy") navigator.vibrate(40);
      else if (type === "success") navigator.vibrate([15, 50, 20]);
      else if (type === "error" || type === "warning") navigator.vibrate([30, 60, 30]);
    }
  } catch {
    // Gracefully ignore
  }
}

/**
 * Triggers native share sheet via Web Share API.
 */
export async function shareContent(options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: options.title || "Claros Finance",
        text: options.text,
        url: options.url,
      });
      return true;
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      console.warn("Share failed:", err);
    }
  }

  return false;
}
