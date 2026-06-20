// ============================================================================
// SMC Journal — Analytics Hook
// ============================================================================

'use client';

import { useMemo } from 'react';
import { Trade, AnalyticsData } from '@/lib/types';
import {
  calculateWinRate,
  calculateAvgRR,
  calculateTotalPnL,
  calculateEquityCurve,
  calculateWeeklyPnL,
  calculateMonthlyPnL,
  calculateSessionPerformance,
  calculateAssetPerformance,
  detectMistakePatterns,
} from '@/lib/utils/calculations';

export function useAnalytics(trades: Trade[]): AnalyticsData {
  return useMemo(() => {
    if (!trades.length) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        avgRR: 0,
        weeklyPnL: [],
        monthlyPnL: [],
        equityCurve: [],
        sessionPerformance: [],
        assetPerformance: [],
        mistakePatterns: [],
      };
    }

    return {
      totalTrades: trades.length,
      totalPnL: calculateTotalPnL(trades),
      winRate: calculateWinRate(trades),
      avgRR: calculateAvgRR(trades),
      weeklyPnL: calculateWeeklyPnL(trades),
      monthlyPnL: calculateMonthlyPnL(trades),
      equityCurve: calculateEquityCurve(trades),
      sessionPerformance: calculateSessionPerformance(trades),
      assetPerformance: calculateAssetPerformance(trades),
      mistakePatterns: detectMistakePatterns(trades),
    };
  }, [trades]);
}
