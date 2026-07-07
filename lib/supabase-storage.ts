import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

let cachedAdminClient: SupabaseClient | null = null;

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getSupabaseUrl(): string {
  return requireEnv('SUPABASE_URL').replace(/\/+$/, '');
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(
    getSupabaseUrl(),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return cachedAdminClient;
}

export function getSupabaseImageBucket(): string {
  return requireEnv('SUPABASE_STORAGE_IMAGE_BUCKET');
}

export function getSupabaseImagePrefix(): string {
  const configuredPrefix = trimSlashes(process.env.SUPABASE_STORAGE_IMAGE_PREFIX || '');
  if (!configuredPrefix || configuredPrefix === 'properties') {
    return 'images/properties';
  }
  return configuredPrefix;
}

export function getSupabaseDbBucket(): string {
  return requireEnv('SUPABASE_STORAGE_DB_BUCKET');
}

export function getSupabaseDbObjectPath(): string {
  return trimSlashes(process.env.SUPABASE_STORAGE_DB_OBJECT_PATH || 'sqlite/phiarental.db');
}

export function buildSupabasePublicObjectUrl(bucket: string, objectPath: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${trimSlashes(objectPath)}`;
}
