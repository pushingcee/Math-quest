import type { NextConfig } from "next";

const basePath = process.env.NODE_ENV === 'production' ? '/Math-quest' : '';

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages serves from /<repo-name>/ - update this to match your repo name
  // If deploying to username.github.io, set basePath to ''
  basePath,
  // Expose basePath to client code so PixiJS Assets.load() and CSS url() can prefix paths
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
