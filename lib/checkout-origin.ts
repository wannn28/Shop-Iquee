import { siteUrl } from "@/lib/site";

/**
 * Checkout POSTs must come from this storefront.
 * Browsers set Origin and refuse to let another site spoof it.
 * `request.url` can be an internal host, so the public site URL and the
 * Host header are accepted as well. A non-browser client can still set
 * those headers; rate limiting covers that path.
 */
export function isAllowedCheckoutOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  try {
    if (originUrl.origin === new URL(request.url).origin) return true;
  } catch {
    /* request.url can be relative in some runtimes */
  }

  if (originUrl.origin === siteUrl()) return true;

  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (!host || originUrl.host !== host) return false;

  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (!proto) return true;
  return originUrl.protocol === `${proto}:`;
}
