// ============================================================================
// SMC Journal — Image Blob Storage Operations
// ============================================================================

import { db } from './database';
import { TradeImage, ImageType } from '@/lib/types';
import { APP_CONFIG } from '@/lib/utils/constants';

// ============================================================================
// Compress Image
// ============================================================================

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const maxWidth = APP_CONFIG.maxImageWidth;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not compress image'));
          }
        },
        'image/jpeg',
        APP_CONFIG.imageQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}

// ============================================================================
// Create
// ============================================================================

export async function addImage(
  tradeId: number,
  file: File,
  type: ImageType
): Promise<number> {
  const blob = await compressImage(file);

  const id = await db.images.add({
    tradeId,
    type,
    blob,
    filename: file.name,
    mimeType: 'image/jpeg',
    createdAt: new Date().toISOString(),
  } as TradeImage);

  return id as number;
}

// ============================================================================
// Read
// ============================================================================

export async function getImagesByTradeId(tradeId: number): Promise<TradeImage[]> {
  return db.images.where('tradeId').equals(tradeId).toArray();
}

/**
 * Create a temporary object URL for displaying an image.
 * IMPORTANT: Call URL.revokeObjectURL() when done to prevent memory leaks.
 */
export function getImageUrl(image: TradeImage): string {
  return URL.createObjectURL(image.blob);
}

// ============================================================================
// Delete
// ============================================================================

export async function deleteImage(id: number): Promise<void> {
  await db.images.delete(id);
}

export async function deleteImagesByTradeId(tradeId: number): Promise<void> {
  await db.images.where('tradeId').equals(tradeId).delete();
}

// ============================================================================
// Export Helper (convert blobs to base64 for JSON export)
// ============================================================================

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
