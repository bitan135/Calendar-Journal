'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Dot } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Trade, DaySummary } from '@/lib/types';
import { generateDaySummary } from '@/lib/utils/calculations';
import { formatCompactCurrency, getPnLColor } from '@/lib/utils/formatters';

// ============================================================================
// Types
// ============================================================================

interface TradingCalendarProps {
  trades: Trade[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
}

// ============================================================================
// Calendar Component
// ============================================================================

export default function TradingCalendar({
  trades,
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}: TradingCalendarProps) {
  const router = useRouter();
  const [direction, setDirection] = useState(0);

  // Calculate the calendar grid
  const calendarDays = useMemo(() => {
    const monthDate = new Date(year, month, 1);
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });

    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [year, month]);

  // Build day summaries
  const daySummaries = useMemo(() => {
    const map = new Map<string, DaySummary>();
    const tradesByDate = new Map<string, Trade[]>();

    for (const trade of trades) {
      if (!tradesByDate.has(trade.date)) tradesByDate.set(trade.date, []);
      tradesByDate.get(trade.date)!.push(trade);
    }

    for (const [date, dayTrades] of tradesByDate) {
      map.set(date, generateDaySummary(date, dayTrades));
    }

    return map;
  }, [trades]);

  const handlePrev = () => {
    setDirection(-1);
    onPrevMonth();
  };

  const handleNext = () => {
    setDirection(1);
    onNextMonth();
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/day/${dateStr}`);
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6 px-1">
        <button
          onClick={handlePrev}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/5 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3">
          <motion.h2
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: direction * 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xl font-bold tracking-tight"
          >
            {format(new Date(year, month), 'MMMM yyyy')}
          </motion.h2>
          <button
            onClick={onGoToday}
            className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/5 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="grid grid-cols-7 gap-1"
        >
          {calendarDays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const summary = daySummaries.get(dateStr);
            const inMonth = isSameMonth(date, new Date(year, month));
            const today = isToday(date);
            const hasTrades = summary && summary.tradeCount > 0;
            const pnl = summary?.totalPnL || 0;

            return (
              <motion.button
                key={dateStr}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.008, duration: 0.2 }}
                onClick={() => handleDayClick(date)}
                className={`
                  relative flex flex-col items-center justify-start gap-0.5
                  min-h-[72px] lg:min-h-[88px] p-1.5 lg:p-2 rounded-xl
                  transition-all duration-200 group
                  ${inMonth ? 'text-foreground' : 'text-muted-foreground/30'}
                  ${today ? 'ring-1 ring-cyan-500/40 bg-cyan-500/5' : ''}
                  ${hasTrades ? 'glass-card cursor-pointer' : 'hover:bg-white/[0.02] cursor-pointer'}
                `}
                aria-label={`${format(date, 'MMMM d, yyyy')}${hasTrades ? `, ${summary!.tradeCount} trades, P&L ${pnl}` : ''}`}
              >
                {/* Day Number */}
                <span
                  className={`
                    text-xs font-medium
                    ${today ? 'text-cyan-400 font-bold' : ''}
                  `}
                >
                  {format(date, 'd')}
                </span>

                {/* P&L Badge */}
                {hasTrades && inMonth && (
                  <div
                    className={`
                      text-[10px] lg:text-xs font-mono-num font-semibold
                      px-1.5 py-0.5 rounded-md mt-0.5
                      ${pnl > 0
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : pnl < 0
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-slate-500/15 text-slate-400'
                      }
                    `}
                  >
                    {formatCompactCurrency(pnl)}
                  </div>
                )}

                {/* Trade Count Dots */}
                {hasTrades && inMonth && (
                  <div className="flex items-center gap-0.5 mt-auto">
                    {Array.from({ length: Math.min(summary!.tradeCount, 4) }).map((_, i) => (
                      <div
                        key={i}
                        className={`
                          w-1 h-1 rounded-full
                          ${pnl > 0 ? 'bg-cyan-400/60' : pnl < 0 ? 'bg-red-400/60' : 'bg-slate-400/60'}
                        `}
                      />
                    ))}
                    {summary!.tradeCount > 4 && (
                      <span className="text-[8px] text-muted-foreground ml-0.5">+{summary!.tradeCount - 4}</span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500/20 border border-cyan-500/30" />
          <span>Profitable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/30" />
          <span>Losing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-500/20 border border-slate-500/30" />
          <span>No Trades</span>
        </div>
      </div>
    </div>
  );
}
