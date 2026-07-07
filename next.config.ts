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
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
