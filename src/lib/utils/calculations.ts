// ============================================================================
// SMC Journal — Utility Functions (Calculations)
// ============================================================================

import { Trade, DaySummary, TradeOutcome } from '@/lib/types';

/**
 * Calculate Risk-Reward ratio from entry, stop loss, and take profit
 */
export function calculateRR(entry: number, sl: number, tp: number): number {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  return Math.round((reward / risk) * 100) / 100;
}

/**
 * Derive trade outcome from profit/loss value
 */
export function deriveOutcome(pnl: number): TradeOutcome {
  if (pnl > 0) return 'win';
  if (pnl < 0) return 'loss';
  return 'breakeven';
}

/**
 * Calculate win rate from a list of trades
 */
export function calculateWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.outcome === 'win').length;
  return Math.round((wins / trades.length) * 1000) / 10;
}

/**
 * Calculate average RR of winning trades
 */
export function calculateAvgRR(trades: Trade[]): number {
  const winningTrades = trades.filter((t) => t.outcome === 'win');
  if (winningTrades.length === 0) return 0;
  const totalRR = winningTrades.reduce((sum, t) => sum + t.rrRatio, 0);
  return Math.round((totalRR / winningTrades.length) * 100) / 100;
}

/**
 * Calculate total P&L for a set of trades
 */
export function calculateTotalPnL(trades: Trade[]): number {
  return Math.round(trades.reduce((sum, t) => sum + t.profitLoss, 0) * 100) / 100;
}

/**
 * Generate a day summary from trades
 */
export function generateDaySummary(date: string, trades: Trade[]): DaySummary {
  const dayTrades = trades.filter((t) => t.date === date);
  const pnls = dayTrades.map((t) => t.profitLoss);

  return {
    date,
    totalPnL: calculateTotalPnL(dayTrades),
    tradeCount: dayTrades.length,
    winCount: dayTrades.filter((t) => t.outcome === 'win').length,
    lossCount: dayTrades.filter((t) => t.outcome === 'loss').length,
    winRate: calculateWinRate(dayTrades),
    avgRR: calculateAvgRR(dayTrades),
    bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
  };
}

export function calculateEquityCurve(trades: Trade[]): { date: string; equity: number }[] {
  // Sort trades chronologically regardless of how they are passed in
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  let cumulative = 0;
  // Inject the baseline origin for charting
  const curve: { date: string; equity: number }[] = [
    { date: 'Start', equity: 0 }
  ];

  for (const trade of sorted) {
    cumulative += trade.profitLoss;
    const existing = curve.find((c) => c.date === trade.date);
    if (existing) {
      existing.equity = Math.round(cumulative * 100) / 100;
    } else {
      curve.push({ date: trade.date, equity: Math.round(cumulative * 100) / 100 });
    }
  }

  return curve;
}

/**
 * Group trades by week and sum P&L (Timezone safe)
 */
export function calculateWeeklyPnL(trades: Trade[]): { week: string; pnl: number }[] {
  const weekMap = new Map<string, number>();

  for (const trade of trades) {
    const [year, month, day] = trade.date.split('-').map(Number);
    // Explicitly process in UTC to prevent timezone shifts
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = d.getUTCDay();
    // Shift algorithm: if Sunday (0), we go back 6 days. Else go back (dayOfWeek - 1) days.
    const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const startOfWeek = new Date(Date.UTC(year, month - 1, diff));
    const weekKey = startOfWeek.toISOString().split('T')[0];
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + trade.profitLoss);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, pnl]) => ({ week, pnl: Math.round(pnl * 100) / 100 }));
}

/**
 * Group trades by month and sum P&L
 */
export function calculateMonthlyPnL(trades: Trade[]): { month: string; pnl: number }[] {
  const monthMap = new Map<string, number>();

  for (const trade of trades) {
    const monthKey = trade.date.substring(0, 7); // "2026-06"
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + trade.profitLoss);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }));
}

/**
 * Calculate performance stats grouped by session
 */
export function calculateSessionPerformance(
  trades: Trade[]
): { session: string; pnl: number; winRate: number; trades: number }[] {
  const sessions = ['asian', 'london', 'new_york'] as const;
  return sessions.map((session) => {
    const sessionTrades = trades.filter((t) => t.session === session);
    return {
      session,
      pnl: calculateTotalPnL(sessionTrades),
      winRate: calculateWinRate(sessionTrades),
      trades: sessionTrades.length,
    };
  });
}

/**
 * Calculate performance stats grouped by asset
 */
export function calculateAssetPerformance(
  trades: Trade[]
): { asset: string; pnl: number; winRate: number; trades: number }[] {
  const assetMap = new Map<string, Trade[]>();

  for (const trade of trades) {
    if (!assetMap.has(trade.asset)) assetMap.set(trade.asset, []);
    assetMap.get(trade.asset)!.push(trade);
  }

  return Array.from(assetMap.entries())
    .map(([asset, assetTrades]) => ({
      asset,
      pnl: calculateTotalPnL(assetTrades),
      winRate: calculateWinRate(assetTrades),
      trades: assetTrades.length,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

/**
 * Detect repeated mistake patterns
 */
export function detectMistakePatterns(
  trades: Trade[]
): { mistake: string; count: number }[] {
  const mistakeMap = new Map<string, number>();

  for (const trade of trades) {
    if (trade.mistakeMade && trade.mistakeMade.trim()) {
      const key = trade.mistakeMade.trim().toLowerCase();
      mistakeMap.set(key, (mistakeMap.get(key) || 0) + 1);
    }
  }

  return Array.from(mistakeMap.entries())
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count);
}
