import type { NextConfig } from "next";

function wooHostname() {
  try {
    return new URL(process.env.WC_BASE_URL || "https://woo.iquee.tech").hostname;
  } catch {
    return "woo.iquee.tech";
  }
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
};

export default nextConfig;
