import { track } from '@vercel/analytics';

// Analytics must never interrupt a customer's design or order flow.
export function trackEvent(name, properties = {}) {
  try {
    const result = track(name, properties);
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // Tracking is optional; keep the storefront usable if it is blocked.
  }
}
