import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ["@avax-ledger/types", "@avax-ledger/utils", "@avax-ledger/config"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@avax-ledger/types": resolve(__dirname, "../../packages/types/src"),
      "@avax-ledger/utils": resolve(__dirname, "../../packages/utils/src"),
      "@avax-ledger/config": resolve(__dirname, "../../packages/config/src"),
    };
    return config;
  },
};

export default nextConfig;

