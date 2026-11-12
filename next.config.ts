import type { NextConfig } from "next";

// `npm run build:example` sets this to export the in-browser sample-data example for GitHub Pages.
const hostedExample = process.env.NEXT_PUBLIC_HOSTED_EXAMPLE === "true";

const nextConfig: NextConfig = hostedExample
  ? {
      output: "export",
      basePath: "/sfguide-loss-triangle-analysis/try",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
