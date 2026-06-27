// ============================================================================
// SMC Journal — Validation Utilities
// ============================================================================

import { Trade, Session, Bias, IntradayBias, POIType, EntryModel } from '@/lib/types';

// ============================================================================
// Constants for Validation
// ============================================================================

const VALID_SESSIONS: Session[] = ['asian', 'london', 'new_york'];
const VALID_BIASES: Bias[] = ['bullish', 'bearish'];
const VALID_INTRADAY_BIASES: IntradayBias[] = ['continuation', 'reversal'];
const VALID_POI_TYPES: POIType[] = ['extreme', 'decisional'];
const VALID_ENTRY_MODELS: EntryModel[] = ['two_leg_protocol', 'mitigation_to_m1_poi', 'inducement'];
const VALID_DIRECTIONS = ['buy', 'sell'] as const;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Validate Trade Data
// ============================================================================

export function validateTradeData(
  data: Partial<Omit<Trade, 'id' | 'outcome' | 'createdAt' | 'updatedAt'>>
): ValidationResult {
  const errors: string[] = [];

  // Required string fields
  if (!data.asset || typeof data.asset !== 'string' || !data.asset.trim()) {
    errors.push('Asset is required');
  }

  if (!data.date || typeof data.date !== 'string' || !ISO_DATE_REGEX.test(data.date)) {
    errors.push('Valid date is required (YYYY-MM-DD)');
  }

  if (!data.direction || !VALID_DIRECTIONS.includes(data.direction as typeof VALID_DIRECTIONS[number])) {
    errors.push('Direction must be "buy" or "sell"');
  }

  if (!data.session || !VALID_SESSIONS.includes(data.session as Session)) {
    errors.push('Valid session is required');
  }

  // Numeric fields — must be valid numbers
  if (data.lotSize !== undefined && (typeof data.lotSize !== 'number' || isNaN(data.lotSize) || data.lotSize < 0)) {
    errors.push('Lot size must be a non-negative number');
  }

  if (data.entryPrice !== undefined && (typeof data.entryPrice !== 'number' || isNaN(data.entryPrice))) {
    errors.push('Entry price must be a valid number');
  }

  if (data.stopLoss !== undefined && (typeof data.stopLoss !== 'number' || isNaN(data.stopLoss))) {
    errors.push('Stop loss must be a valid number');
  }

  if (data.takeProfit !== undefined && (typeof data.takeProfit !== 'number' || isNaN(data.takeProfit))) {
    errors.push('Take profit must be a valid number');
  }

  if (data.profitLoss !== undefined && (typeof data.profitLoss !== 'number' || isNaN(data.profitLoss))) {
    errors.push('P&L must be a valid number');
  }

  if (data.rrRatio !== undefined && (typeof data.rrRatio !== 'number' || isNaN(data.rrRatio))) {
    errors.push('RR ratio must be a valid number');
  }

  // Enum validations (optional fields — only validate if present)
  if (data.bias4H && !VALID_BIASES.includes(data.bias4H as Bias)) {
    errors.push('Invalid 4H bias value');
  }

  if (data.bias1H && !VALID_BIASES.includes(data.bias1H as Bias)) {
    errors.push('Invalid 1H bias value');
  }

  if (data.bias15M && !VALID_INTRADAY_BIASES.includes(data.bias15M as IntradayBias)) {
    errors.push('Invalid 15M bias value');
  }

  if (data.poiType && !VALID_POI_TYPES.includes(data.poiType as POIType)) {
    errors.push('Invalid POI type');
  }

  if (data.entryModel && !VALID_ENTRY_MODELS.includes(data.entryModel as EntryModel)) {
    errors.push('Invalid entry model');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Validate Backup Structure
// ============================================================================

export function validateBackupStructure(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Backup data is not a valid object'] };
  }

  const backup = data as Record<string, unknown>;

  if (typeof backup.version !== 'number') {
    errors.push('Missing or invalid version number');
  }

  if (!Array.isArray(backup.trades)) {
    errors.push('Trades must be an array');
  } else {
    // Validate first few trades to catch format issues early
    const samplesToCheck = Math.min(backup.trades.length, 5);
    for (let i = 0; i < samplesToCheck; i++) {
      const trade = backup.trades[i];
      if (!trade || typeof trade !== 'object') {
        errors.push(`Trade at index ${i} is not a valid object`);
        continue;
      }
      if (!trade.asset || !trade.date) {
        errors.push(`Trade at index ${i} is missing required fields (asset, date)`);
      }
    }
  }

  if (backup.images !== undefined && !Array.isArray(backup.images)) {
    errors.push('Images must be an array if present');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
