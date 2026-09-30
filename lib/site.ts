/** Public storefront origin. WooCommerce is a different host — see WC_BASE_URL. */
export const DEFAULT_SITE_URL = "https://store.iquee.tech";

export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return DEFAULT_SITE_URL;
  return value.replace(/\/$/, "");
}

export function siteHost() {
  try {
    return new URL(siteUrl()).host;
  } catch {
    return "store.iquee.tech";
  }
}

export const site = {
  name: "iquee",
  description: "Editorial essentials for clothing, home, and studio.",
};
