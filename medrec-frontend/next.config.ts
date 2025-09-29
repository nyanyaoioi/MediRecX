import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // 启用静态导出
  trailingSlash: true, // 确保URL以/结尾，便于静态托管
  experimental: {
    // Enable turbopack for faster development
    turbo: {},
  },
  // 支持FHEVM的WebAssembly
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // 支持WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
  // 支持跨域请求（开发环境）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
