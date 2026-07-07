import crypto from 'node:crypto';
import path from 'node:path';
import {
  buildSupabasePublicObjectUrl,
  getSupabaseAdminClient,
  getSupabaseImageBucket,
  getSupabaseImagePrefix,
  getSupabaseUrl,
  isSupabaseStorageConfigured,
} from '@/lib/supabase-storage';

const LEGACY_LOCAL_IMAGES_PREFIX = '/images/properties/';

function getImageObjectPath(filename: string): string {
  const prefix = getSupabaseImagePrefix();
  return prefix ? `${prefix}/${filename}` : filename;
}

function getImagePublicBaseUrl(): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${getSupabaseImageBucket()}/`;
}

function getImageObjectPathFromPublicUrl(imageUrl: string): string | null {
  const publicBaseUrl = getImagePublicBaseUrl();
  if (!imageUrl.startsWith(publicBaseUrl)) {
    return null;
  }

  const urlWithoutQuery = imageUrl.split('?')[0];
  const encodedPath = urlWithoutQuery.slice(publicBaseUrl.length);
  if (!encodedPath) {
    return null;
  }

  return decodeURIComponent(encodedPath);
}

function getImageExtension(file: File): string {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) {
    return fromName;
  }

  switch (file.type) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.img';
  }
}

export async function savePropertyImage(file: File): Promise<string> {
  if (!isSupabaseStorageConfigured()) {
    throw new Error('Supabase storage is not configured');
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error('An image file is required');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Uploaded file must be an image');
  }

  const filename = `${crypto.randomUUID()}${getImageExtension(file)}`;
  const objectPath = getImageObjectPath(filename);
  const contentType = file.type || 'application/octet-stream';
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .storage
    .from(getSupabaseImageBucket())
    .upload(objectPath, fileBuffer, {
      contentType,
      upsert: false,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Failed to upload property image: ${error.message}`);
  }

  return buildSupabasePublicObjectUrl(getSupabaseImageBucket(), objectPath);
}

export async function savePropertyImages(files: File[]): Promise<string[]> {
  const savedImages: string[] = [];

  try {
    for (const file of files) {
      savedImages.push(await savePropertyImage(file));
    }

    return savedImages;
  } catch (error) {
    await Promise.all(
      savedImages.map((imageUrl) =>
        deletePropertyImage(imageUrl).catch((cleanupError) => {
          console.error('Failed to clean up partially saved image:', cleanupError);
        })
      )
    );
    throw error;
  }
}

export async function deletePropertyImage(imageUrl?: string | null): Promise<void> {
  if (!isSupabaseStorageConfigured() || !imageUrl || imageUrl.startsWith(LEGACY_LOCAL_IMAGES_PREFIX)) {
    return;
  }

  const objectPath = getImageObjectPathFromPublicUrl(imageUrl);
  if (!objectPath) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(getSupabaseImageBucket()).remove([objectPath]);
  if (error) {
    // Storage returns an error for missing files in some edge cases, keep delete idempotent.
    const message = error.message.toLowerCase();
    if (error.statusCode !== '404' && !message.includes('not found')) {
      throw new Error(`Failed to delete property image: ${error.message}`);
    }
  }
}
