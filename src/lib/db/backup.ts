// ============================================================================
// SMC Journal — Backup & Restore
// ============================================================================

import { db } from './database';
import { BackupData, Trade, TradeImage } from '@/lib/types';
import { APP_CONFIG } from '@/lib/utils/constants';
import { blobToBase64, base64ToBlob } from './images';
import { validateBackupStructure } from '@/lib/utils/validation';

// ============================================================================
// Export
// ============================================================================

export async function exportBackup(): Promise<void> {
  const trades = await db.trades.toArray();
  const allImages = await db.images.toArray();
  const settings = (await db.settings.get('app_settings')) || null;

  // Convert image blobs to base64 for JSON serialization
  const images = await Promise.all(
    allImages.map(async (img) => ({
      tradeId: img.tradeId,
      type: img.type,
      filename: img.filename,
      mimeType: img.mimeType,
      dataUrl: await blobToBase64(img.blob),
    }))
  );

  const backup: BackupData = {
    version: APP_CONFIG.backupVersion,
    exportedAt: new Date().toISOString(),
    trades,
    images,
    settings,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `smc-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Update last backup date
  await db.settings.put({
    id: 'app_settings',
    defaultAssets: settings?.defaultAssets || [],
    defaultLotSize: settings?.defaultLotSize || APP_CONFIG.defaultLotSize,
    lastBackupDate: new Date().toISOString(),
  });
}

// ============================================================================
// Import (Transactional — rolls back on failure to prevent data loss)
// ============================================================================

export async function importBackup(file: File): Promise<{ trades: number; images: number }> {
  const text = await file.text();

  let backup: BackupData;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file. Please select a valid backup file.');
  }

  // Validate backup structure before proceeding
  const validation = validateBackupStructure(backup);
  if (!validation.valid) {
    throw new Error(`Invalid backup format: ${validation.errors.join(', ')}`);
  }

  // Wrap the entire import in a transaction so that if anything fails,
  // the original data is preserved (rollback on error)
  const result = await db.transaction('rw', [db.trades, db.images, db.settings], async () => {
    // Clear existing data (inside transaction — rolls back if import fails)
    await db.trades.clear();
    await db.images.clear();

    // Import trades
    let tradeCount = 0;
    const idMap = new Map<number, number>(); // old ID → new ID

    for (const trade of backup.trades) {
      const oldId = trade.id;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...tradeData } = trade;
      const newId = await db.trades.add(tradeData as unknown as Trade);
      if (oldId !== undefined) {
        idMap.set(oldId, newId as number);
      }
      tradeCount++;
    }

    // Import images
    let imageCount = 0;
    if (backup.images && Array.isArray(backup.images)) {
      for (const img of backup.images) {
        try {
          const blob = await base64ToBlob(img.dataUrl);
          const newTradeId = idMap.get(img.tradeId) || img.tradeId;

          await db.images.add({
            tradeId: newTradeId,
            type: img.type,
            blob,
            filename: img.filename,
            mimeType: img.mimeType,
            createdAt: new Date().toISOString(),
          } as unknown as TradeImage);
          imageCount++;
        } catch (e) {
          console.warn(`[SMC Journal] Skipping image: ${img.filename}`, e);
        }
      }
    }

    // Import settings
    if (backup.settings) {
      await db.settings.put(backup.settings);
    }

    return { trades: tradeCount, images: imageCount };
  });

  return result;
}
