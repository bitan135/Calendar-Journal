'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Trade, DaySummary } from '@/lib/types';
import { generateDaySummary } from '@/lib/utils/calculations';
import { formatCompactCurrency } from '@/lib/utils/formatters';

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
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-all active:scale-90 cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>

        <div className="flex items-center gap-4">
          <motion.h2
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: direction * 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-base font-semibold tracking-[-0.015em]"
          >
            {format(new Date(year, month), 'MMMM yyyy')}
          </motion.h2>
          <button
            onClick={onGoToday}
            className="text-xs font-semibold text-primary hover:opacity-80 transition-all active:scale-95 cursor-pointer"
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-all active:scale-90 cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid — single fade-in instead of per-cell stagger */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, y: direction * 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction * -10 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="grid grid-cols-7 gap-1"
        >
          {calendarDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const summary = daySummaries.get(dateStr);
            const inMonth = isSameMonth(date, new Date(year, month));
            const today = isToday(date);
            const hasTrades = summary && summary.tradeCount > 0;
            const pnl = summary?.totalPnL || 0;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(date)}
                className={`
                  relative flex flex-col items-center justify-start gap-1
                  min-h-[76px] lg:min-h-[92px] p-2 rounded-lg
                  transition-all duration-150 group border border-transparent
                  ${inMonth ? 'text-foreground' : 'text-muted-foreground/20'}
                  ${today ? 'bg-primary/5 border-primary/20' : ''}
                  ${hasTrades ? 'glass-card cursor-pointer shadow-sm' : 'hover:bg-accent/30 cursor-pointer'}
                `}
                aria-label={`${format(date, 'MMMM d, yyyy')}${hasTrades ? `, ${summary!.tradeCount} trades, P&L ${pnl}` : ''}`}
              >
                {/* Day Number */}
                <div
                  className={`
                    w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full
                    ${today ? 'bg-primary text-primary-foreground font-bold shadow-sm' : ''}
                  `}
                >
                  {format(date, 'd')}
                </div>

                {/* P&L Badge */}
                {hasTrades && inMonth && (
                  <div
                    className={`
                      text-[9px] lg:text-xs font-mono-num font-semibold
                      px-1.5 py-0.5 rounded
                      ${pnl > 0
                        ? 'bg-profit/10 text-profit'
                        : pnl < 0
                          ? 'bg-loss/10 text-loss'
                          : 'bg-muted-foreground/10 text-muted-foreground'
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
                          ${pnl > 0 ? 'bg-profit/60' : pnl < 0 ? 'bg-loss/60' : 'bg-muted-foreground/60'}
                        `}
                      />
                    ))}
                    {summary!.tradeCount > 4 && (
                      <span className="text-[7px] text-muted-foreground/80 ml-0.5 font-medium">+{summary!.tradeCount - 4}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-muted-foreground/75 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[3px] bg-profit" />
          <span>Profitable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[3px] bg-loss" />
          <span>Losing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-[3px] bg-card border border-border" />
          <span>No Trades</span>
        </div>
      </div>
    </div>
  );
}
