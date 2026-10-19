import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseImageBucket = process.env.SUPABASE_STORAGE_IMAGE_BUCKET;

const imageRemotePatterns = (() => {
  if (!supabaseUrl || !supabaseImageBucket) {
    return [];
  }

  const parsed = new URL(supabaseUrl);
  const host = `${parsed.protocol}//${parsed.host}`;
  return [
    new URL(`${host}/storage/v1/object/public/${supabaseImageBucket}/**`),
  ];
})();

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.SITE_URL ? [new URL(process.env.SITE_URL).hostname] : [],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingIncludes: {
    '/*': ['./.env.production.enc'],
  },
  outputFileTracingExcludes: {
    '/*': ['./.env', './.env.local', './.env.production', './.env.production.local', './.env.production.key', './.env.keys', './.env.keys.*'],
  },
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
