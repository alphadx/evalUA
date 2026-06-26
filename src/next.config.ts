import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["mongoose", "ioredis"],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
