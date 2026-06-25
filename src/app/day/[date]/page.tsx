'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Target, BarChart2, Award, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import { useTradesByDate } from '@/lib/hooks/use-trades';
import { generateDaySummary } from '@/lib/utils/calculations';
import { formatDateFull, formatCurrency, formatPercentage, formatRR, formatTime, isDateToday, getPnLColor, getPnLBgColor } from '@/lib/utils/formatters';
import { SESSION_LABELS, ENTRY_MODEL_LABELS } from '@/lib/utils/constants';

// ============================================================================
// Page
// ============================================================================

export default function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const router = useRouter();
  const { trades, loading } = useTradesByDate(date);
  const today = isDateToday(date);

  const summary = generateDaySummary(date, trades);

  const stats = [
    { label: 'Daily P&L', value: formatCurrency(summary.totalPnL), icon: TrendingUp, color: getPnLColor(summary.totalPnL) },
    { label: 'Trades', value: String(summary.tradeCount), icon: BarChart2, color: 'text-foreground' },
    { label: 'Win Rate', value: formatPercentage(summary.winRate), icon: Target, color: 'text-foreground' },
    { label: 'Avg RR', value: formatRR(summary.avgRR), icon: Award, color: 'text-foreground' },
    { label: 'Best Trade', value: formatCurrency(summary.bestTrade), icon: TrendingUp, color: 'text-profit' },
    { label: 'Worst Trade', value: formatCurrency(summary.worstTrade), icon: TrendingDown, color: 'text-loss' },
  ];

  if (loading) {
    return (
      <>
        <PageHeader
          title={formatDateFull(date)}
          subtitle="Loading trades..."
          showBack
          backHref="/"
        />
        <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto space-y-8">
          {/* Skeleton Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-20 animate-shimmer" />
            ))}
          </div>
          {/* Skeleton Trades List */}
          <div className="space-y-3">
            <div className="h-4 w-24 bg-white/5 rounded animate-shimmer mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-24 animate-shimmer" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={formatDateFull(date)}
        subtitle={`${summary.tradeCount} trade${summary.tradeCount !== 1 ? 's' : ''}`}
        showBack
        backHref="/"
        actions={
          <button
            onClick={() => router.push(`/trade/new?date=${date}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Trade</span>
          </button>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Stats Grid */}
        {summary.tradeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.15 }}
                className="glass-card rounded-xl p-4 border border-white/5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                    {stat.label}
                  </p>
                </div>
                <p className={`text-lg font-bold font-mono-num ${stat.color}`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Trade List */}
        {trades.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
              Trades
            </h2>
            {trades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => router.push(`/trade/${trade.id}`)}
                className={`
                  glass-card rounded-xl p-4 cursor-pointer hover:bg-[#2c2c2e] transition-all border border-white/5 shadow-sm
                  ${trade.profitLoss > 0
                    ? 'border-l-profit'
                    : trade.profitLoss < 0
                      ? 'border-l-loss'
                      : 'border-l-neutral'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold tracking-tight">{trade.asset}</span>
                    <span className={`
                      text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded
                      ${trade.direction === 'buy'
                        ? 'bg-profit/10 text-profit'
                        : 'bg-loss/10 text-loss'
                      }
                    `}>
                      {trade.direction}
                    </span>
                    <span className="text-xs text-muted-foreground/60 font-medium">
                      {SESSION_LABELS[trade.session]}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold font-mono-num ${getPnLColor(trade.profitLoss)}`}>
                    {formatCurrency(trade.profitLoss)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground/60 font-medium">
                  <span>{formatTime(trade.entryTime)} → {formatTime(trade.exitTime)}</span>
                  <span>RR {formatRR(trade.rrRatio)}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">
                    {ENTRY_MODEL_LABELS[trade.entryModel]}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">No trades recorded</h3>
            <p className="text-xs text-muted-foreground/60 mb-5 max-w-xs leading-relaxed">
              {today ? 'Start journaling your trades to track performance.' : 'No trades were logged on this day.'}
            </p>
            {today && (
              <button
                onClick={() => router.push(`/trade/new?date=${date}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Your First Trade
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* FAB - Log Trade (only on today) */}
      {today && trades.length > 0 && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          onClick={() => router.push(`/trade/new?date=${date}`)}
          className="fixed bottom-20 lg:bottom-6 right-6 z-40 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95 border border-white/10"
          aria-label="Log Trade"
        >
          <Plus className="w-4 h-4" />
          <span>Log Trade</span>
        </motion.button>
      )}
    </>
  );
}
