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
    { label: 'Best Trade', value: formatCurrency(summary.bestTrade), icon: TrendingUp, color: 'text-cyan-400' },
    { label: 'Worst Trade', value: formatCurrency(summary.worstTrade), icon: TrendingDown, color: 'text-red-400' },
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Log Trade</span>
          </button>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Stats Grid */}
        {summary.tradeCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Trades
            </h2>
            {trades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/trade/${trade.id}`)}
                className={`
                  glass-card rounded-xl p-4 cursor-pointer
                  ${trade.profitLoss > 0
                    ? 'border-l-profit'
                    : trade.profitLoss < 0
                      ? 'border-l-loss'
                      : 'border-l-neutral'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{trade.asset}</span>
                    <span className={`
                      text-[10px] font-bold uppercase px-2 py-0.5 rounded-md
                      ${trade.direction === 'buy'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'bg-red-500/15 text-red-400'
                      }
                    `}>
                      {trade.direction}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {SESSION_LABELS[trade.session]}
                    </span>
                  </div>
                  <span className={`text-sm font-bold font-mono-num ${getPnLColor(trade.profitLoss)}`}>
                    {formatCurrency(trade.profitLoss)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatTime(trade.entryTime)} → {formatTime(trade.exitTime)}</span>
                  <span>RR {formatRR(trade.rrRatio)}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5">
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
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No trades recorded</h3>
            <p className="text-sm text-muted-foreground/60 mb-6 max-w-xs">
              {today ? 'Start journaling your trades to track performance.' : 'No trades were logged on this day.'}
            </p>
            {today && (
              <button
                onClick={() => router.push(`/trade/new?date=${date}`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Log Your First Trade
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* FAB - Log Trade (only on today) */}
      {today && trades.length > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          onClick={() => router.push(`/trade/new?date=${date}`)}
          className="fixed bottom-24 lg:bottom-8 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow animate-pulse-glow"
          aria-label="Log Trade"
        >
          <Plus className="w-5 h-5" />
          <span>Log Trade</span>
        </motion.button>
      )}
    </>
  );
}
