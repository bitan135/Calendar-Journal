// ============================================================================
// SMC Journal — Trade CRUD Operations
// ============================================================================

import { db } from './database';
import { Trade } from '@/lib/types';
import { deriveOutcome } from '@/lib/utils/calculations';
import { validateTradeData } from '@/lib/utils/validation';
import { deleteImagesByTradeId } from './images';

// ============================================================================
// Create
// ============================================================================

export async function addTrade(
  trade: Omit<Trade, 'id' | 'outcome' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  // Validate trade data before saving
  const validation = validateTradeData(trade);
  if (!validation.valid) {
    throw new Error(`Invalid trade data: ${validation.errors.join(', ')}`);
  }

  const now = new Date().toISOString();
  const outcome = deriveOutcome(trade.profitLoss);

  const id = await db.trades.add({
    ...trade,
    outcome,
    createdAt: now,
    updatedAt: now,
  } as Trade);

  return id as number;
}

// ============================================================================
// Read
// ============================================================================

export function getTradeById(id: number) {
  return db.trades.get(id);
}

export function getTradesByDate(date: string) {
  return db.trades.where('date').equals(date).sortBy('entryTime');
}

export function getTradesByDateRange(startDate: string, endDate: string) {
  return db.trades
    .where('date')
    .between(startDate, endDate, true, true)
    .reverse()
    .sortBy('date');
}

export function getAllTrades() {
  return db.trades.orderBy('date').reverse().toArray();
}

export function getTradesByMonth(year: number, month: number) {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endMonth = month === 11 ? 0 : month + 1;
  const endYear = month === 11 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`;

  return db.trades
    .where('date')
    .between(startDate, endDate, true, false)
    .reverse()
    .sortBy('date');
}

// ============================================================================
// Update
// ============================================================================

export async function updateTrade(
  id: number,
  updates: Partial<Omit<Trade, 'id' | 'createdAt'>>
): Promise<void> {
  const updateData: Partial<Trade> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate outcome if P&L changed
  if (updates.profitLoss !== undefined) {
    updateData.outcome = deriveOutcome(updates.profitLoss);
  }

  const count = await db.trades.update(id, updateData);
  if (count === 0) {
    throw new Error(`Trade with id ${id} not found`);
  }
}

// ============================================================================
// Delete (Atomic — transaction ensures images + trade are deleted together)
// ============================================================================

export async function deleteTrade(id: number): Promise<void> {
  await db.transaction('rw', [db.trades, db.images], async () => {
    await deleteImagesByTradeId(id);
    await db.trades.delete(id);
  });
}

// ============================================================================
// Duplicate
// ============================================================================

export async function duplicateTrade(id: number): Promise<number | null> {
  const original = await getTradeById(id);
  if (!original) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt, updatedAt, outcome, ...tradeData } = original;

  return addTrade({
    ...tradeData,
    date: new Date().toISOString().split('T')[0],
    entryTime: '',
    exitTime: '',
    profitLoss: 0,
  });
}

// ============================================================================
// Search (Optimized — uses Dexie filter to avoid full materialization)
// ============================================================================

export async function searchTrades(query: string) {
  const lowerQuery = query.toLowerCase();

  // Fast path: if query looks like an asset symbol, use the index
  if (/^[A-Za-z0-9]{2,10}$/.test(query)) {
    const indexResults = await db.trades
      .where('asset')
      .startsWithIgnoreCase(query.toUpperCase())
      .toArray();

    if (indexResults.length > 0) {
      return indexResults;
    }
  }

  // Full-text search across all text fields
  return db.trades
    .filter((trade) => {
      return (
        trade.asset.toLowerCase().includes(lowerQuery) ||
        trade.tradeReasoning?.toLowerCase().includes(lowerQuery) ||
        trade.marketNarrative?.toLowerCase().includes(lowerQuery) ||
        trade.sessionObservation?.toLowerCase().includes(lowerQuery) ||
        trade.mistakeMade?.toLowerCase().includes(lowerQuery) ||
        trade.lessonLearned?.toLowerCase().includes(lowerQuery) ||
        trade.importantNote?.toLowerCase().includes(lowerQuery) ||
        trade.date.includes(query)
      );
    })
    .toArray();
}

// ============================================================================
// Count
// ============================================================================

export async function getTradeCount(): Promise<number> {
  return db.trades.count();
}
