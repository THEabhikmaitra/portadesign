/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // For 3D WebGL context preservation
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

module.exports = nextConfig;
