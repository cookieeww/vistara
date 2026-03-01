import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/vistara",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Turbopack-compatible config (no webpack block)
  turbopack: {},
};

export default nextConfig;
