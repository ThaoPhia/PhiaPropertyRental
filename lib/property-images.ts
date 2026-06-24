import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const PROPERTY_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'properties');
const PROPERTY_IMAGES_URL_PREFIX = '/images/properties/';

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
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('An image file is required');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Uploaded file must be an image');
  }

  await fs.mkdir(PROPERTY_IMAGES_DIR, { recursive: true });

  const filename = `${crypto.randomUUID()}${getImageExtension(file)}`;
  const filePath = path.join(PROPERTY_IMAGES_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  return `${PROPERTY_IMAGES_URL_PREFIX}${filename}`;
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
  if (!imageUrl || !imageUrl.startsWith(PROPERTY_IMAGES_URL_PREFIX)) {
    return;
  }

  const filename = path.basename(imageUrl);
  const filePath = path.join(PROPERTY_IMAGES_DIR, filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
