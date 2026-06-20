'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import TradingCalendar from '@/components/calendar/trading-calendar';
import SearchModal from '@/components/shared/search-modal';
import { useTradesByMonth } from '@/lib/hooks/use-trades';
import { calculateTotalPnL, calculateWinRate } from '@/lib/utils/calculations';
import { formatCurrency, formatPercentage } from '@/lib/utils/formatters';
import { requestPersistentStorage } from '@/lib/db/database';

export default function HomePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [searchOpen, setSearchOpen] = useState(false);

  const { trades, loading } = useTradesByMonth(year, month);

  // Request persistent storage on first load
  useEffect(() => {
    requestPersistentStorage();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'ArrowLeft' && !e.metaKey && !searchOpen) {
        handlePrevMonth();
      }
      if (e.key === 'ArrowRight' && !e.metaKey && !searchOpen) {
        handleNextMonth();
      }
      if (e.key === 't' && !e.metaKey && !searchOpen && document.activeElement?.tagName !== 'INPUT') {
        handleGoToday();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, month, year]);

  const handlePrevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleGoToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }, []);

  // Monthly stats
  const totalPnL = calculateTotalPnL(trades);
  const winRate = calculateWinRate(trades);
  const totalTrades = trades.length;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 glass-nav px-4 lg:px-8 pt-safe pb-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="lg:hidden flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="SMC Journal Logo" className="w-8 h-8 rounded-xl shadow-lg shadow-cyan-500/20 ring-1 ring-white/10" />
            <h1 className="text-lg font-bold tracking-tight">SMC Journal</h1>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold tracking-tight">Trading Calendar</h1>
            <p className="text-xs text-muted-foreground">Track your daily performance</p>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground glass transition-all"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Monthly Stats Bar */}
        {totalTrades > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            <div className="glass-card rounded-xl p-3 lg:p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Monthly P&L</p>
              <p className={`text-lg lg:text-xl font-bold font-mono-num ${totalPnL >= 0 ? 'text-gradient-profit' : 'text-gradient-loss'}`}>
                {formatCurrency(totalPnL)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 lg:p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Win Rate</p>
              <p className="text-lg lg:text-xl font-bold font-mono-num text-foreground">
                {formatPercentage(winRate)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-3 lg:p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Trades</p>
              <p className="text-lg lg:text-xl font-bold font-mono-num text-foreground">
                {totalTrades}
              </p>
            </div>
          </motion.div>
        )}

        {/* Calendar */}
        <TradingCalendar
          trades={trades}
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onGoToday={handleGoToday}
        />
      </div>

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
