import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude venom-bot and related packages from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      
      config.externals = config.externals || [];
      config.externals.push({
        'venom-bot': 'commonjs venom-bot',
        'puppeteer': 'commonjs puppeteer',
        'puppeteer-core': 'commonjs puppeteer-core',
      });
    }
    
    return config;
  },
  serverExternalPackages: ['venom-bot', 'puppeteer', 'puppeteer-core']
};

export default nextConfig;
