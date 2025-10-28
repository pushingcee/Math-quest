import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages serves from /<repo-name>/ - update this to match your repo name
  // If deploying to username.github.io, set basePath to ''
  basePath: process.env.NODE_ENV === 'production' ? '/board-game' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
