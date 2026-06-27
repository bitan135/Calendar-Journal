// ============================================================================
// SMC Journal — Dexie Database Definition
// ============================================================================

import Dexie, { type EntityTable } from 'dexie';
import { Trade, TradeImage, AppSettings } from '@/lib/types';

// ============================================================================
// Database Class
// ============================================================================

class SMCJournalDB extends Dexie {
  trades!: EntityTable<Trade, 'id'>;
  images!: EntityTable<TradeImage, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('smc-journal');

    this.version(1).stores({
      trades: '++id, date, asset, session, entryModel, outcome, createdAt',
      images: '++id, tradeId',
      settings: 'id',
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const db = new SMCJournalDB();

// ============================================================================
// Global Error Handler
// ============================================================================

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (event.reason.name?.includes('Dexie') || event.reason.stack?.includes('dexie'))) {
      console.error('[SMC Journal] Unhandled Dexie database error:', event.reason);
    }
  });
}

// ============================================================================
// Request Persistent Storage
// ============================================================================

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    }
  } catch (error) {
    console.error('[SMC Journal] Failed to request persistent storage:', error);
  }
  return false;
}

// ============================================================================
// Storage Estimate
// ============================================================================

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof window === 'undefined') return null;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
  } catch (error) {
    console.error('[SMC Journal] Failed to get storage estimate:', error);
  }
  return null;
}

// ============================================================================
// Database Health Check
// ============================================================================

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await db.trades.count();
    return true;
  } catch {
    return false;
  }
}
