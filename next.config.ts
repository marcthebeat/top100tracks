import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true, // you can even drop this if Antigravity is already using the app router
  },
};

export default nextConfig;
