import type { NextConfig } from "next";

function wooHostname() {
  try {
    return new URL(process.env.WC_BASE_URL || "https://woo.iquee.tech").hostname;
  } catch {
    return "woo.iquee.tech";
  }
}

function contentSecurityPolicy(wooHost: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://${wooHost}`,
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://js.stripe.com https://m.stripe.network",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
  ].join("; ");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: wooHostname(),
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
  async headers() {
    const wooHost = wooHostname();
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy(wooHost) },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
