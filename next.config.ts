import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    staticGenerationMaxConcurrency: 1,
    cpus: 1,
  }
};

export default nextConfig;
