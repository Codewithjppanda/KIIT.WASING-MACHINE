import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint checks during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  /* config options here */
};

export default nextConfig;
