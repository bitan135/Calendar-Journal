// ============================================================================
// SMC Journal — Trade Data Hooks
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FilterState } from '@/lib/types';
import {
  getTradesByDate,
  getTradesByMonth,
  getAllTrades,
  searchTrades,
  getTradeById,
} from '@/lib/db/trades';

// ============================================================================
// useTrades — fetch trades by date
// ============================================================================

export function useTradesByDate(date: string) {
  const trades = useLiveQuery(() => getTradesByDate(date), [date]);
  
  return { 
    trades: trades || [], 
    loading: trades === undefined,
    refresh: () => {} // Kept for backwards compatibility
  };
}

// ============================================================================
// useTradesByMonth — fetch trades for a calendar month
// ============================================================================

export function useTradesByMonth(year: number, month: number) {
  const trades = useLiveQuery(() => getTradesByMonth(year, month), [year, month]);
  
  return { 
    trades: trades || [], 
    loading: trades === undefined,
    refresh: () => {}
  };
}

// ============================================================================
// useAllTrades — fetch all trades (with optional filters)
// ============================================================================

export function useAllTrades(filters?: Partial<FilterState>) {
  // Convert filters to string for dependency array
  const filterDeps = JSON.stringify(filters || {});

  const trades = useLiveQuery(() => {
    return getAllTrades().then((result) => {
      if (filters) {
        if (filters.asset) {
          result = result.filter((t) => t.asset === filters.asset);
        }
        if (filters.session) {
          result = result.filter((t) => t.session === filters.session);
        }
        if (filters.dateFrom) {
          result = result.filter((t) => t.date >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          result = result.filter((t) => t.date <= filters.dateTo!);
        }
        if (filters.entryModel) {
          result = result.filter((t) => t.entryModel === filters.entryModel);
        }
        if (filters.outcome) {
          result = result.filter((t) => t.outcome === filters.outcome);
        }
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          result = result.filter(
            (t) =>
              t.asset.toLowerCase().includes(q) ||
              t.tradeReasoning?.toLowerCase().includes(q) ||
              t.marketNarrative?.toLowerCase().includes(q) ||
              t.mistakeMade?.toLowerCase().includes(q) ||
              t.lessonLearned?.toLowerCase().includes(q)
          );
        }
      }
      return result;
    });
  }, [filterDeps]);

  return { 
    trades: trades || [], 
    loading: trades === undefined,
    refresh: () => {}
  };
}

// ============================================================================
// useTrade — fetch single trade by ID
// ============================================================================

export function useTrade(id: number | null) {
  const trade = useLiveQuery(
    () => {
      // If no ID is provided, query limit 0 to keep Dexie tracking active and avoid crash
      if (id === null) return getTradesByDate('1970-01-01').then(() => null);
      return getTradeById(id).then((t) => t || null);
    },
    [id]
  );

  return { 
    trade: trade === undefined ? null : trade, 
    loading: trade === undefined,
    refresh: () => {}
  };
}

// ============================================================================
// useSearchTrades — search with debouncing
// ============================================================================

export function useSearchTrades(query: string, delay: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<import('@/lib/types').Trade[]>([]);

  // Debounce the query string
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDebouncedQuery('');
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Fetch results when debounced query changes
  // We use standard useEffect to completely avoid useLiveQuery zero-dependency crashes
  useEffect(() => {
    let active = true;
    
    if (!debouncedQuery.trim()) {
      if (active) setResults([]);
      return;
    }

    searchTrades(debouncedQuery).then((res) => {
      if (active) {
        setResults(res);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  return { 
    results, 
    loading 
  };
}
