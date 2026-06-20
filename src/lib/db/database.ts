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
// Request Persistent Storage
// ============================================================================

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[SMC Journal] Persistent storage: ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  }
  return false;
}

// ============================================================================
// Storage Estimate
// ============================================================================

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (typeof window === 'undefined') return null;
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return null;
}
