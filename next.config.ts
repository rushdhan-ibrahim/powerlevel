import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // libheif-js uses dynamic require() to load its WASM bundle — webpack
  // flags this as "Critical dependency" at build time but it's safe.
  // Same for sharp's native bindings. Bundle them on the server as-is.
  serverExternalPackages: ["sharp", "heic-convert", "libheif-js"],
};

export default nextConfig;
