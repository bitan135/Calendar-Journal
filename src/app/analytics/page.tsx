'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Award, BarChart2, AlertTriangle,
  Filter, X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/layout/page-header';
import { useAllTrades } from '@/lib/hooks/use-trades';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { formatCurrency, formatPercentage, formatRR, getPnLColor } from '@/lib/utils/formatters';
import { DEFAULT_ASSETS, SESSIONS, ENTRY_MODELS, CHART_COLORS, SESSION_LABELS } from '@/lib/utils/constants';
import { FilterState } from '@/lib/types';
import { format } from 'date-fns';

// ============================================================================
// Custom Tooltip
// ============================================================================

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className={`font-mono-num font-semibold ${entry.value >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-foreground',
  delay = 0,
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="glass-card rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className={`text-xl font-bold font-mono-num ${color}`}>{value}</p>
    </motion.div>
  );
}

// ============================================================================
// Analytics Page
// ============================================================================

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<Partial<FilterState>>({});
  const [showFilters, setShowFilters] = useState(false);
  const { trades, loading } = useAllTrades(filters);
  const analytics = useAnalytics(trades);

  const hasActiveFilters = Object.values(filters).some((v) => v);

  const clearFilters = () => setFilters({});

  const updateFilter = (key: keyof FilterState, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // Format month labels
  const monthlyData = useMemo(() =>
    analytics.monthlyPnL.map((m) => ({
      ...m,
      label: format(new Date(m.month + '-01'), 'MMM yy'),
    })),
    [analytics.monthlyPnL]
  );

  const sessionData = useMemo(() =>
    analytics.sessionPerformance.map((s) => ({
      ...s,
      label: SESSION_LABELS[s.session as keyof typeof SESSION_LABELS] || s.session,
    })),
    [analytics.sessionPerformance]
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={`${analytics.totalTrades} trades analyzed`}
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              hasActiveFilters ? 'bg-cyan-500/15 text-cyan-400' : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        }
      />

      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Filter Bar */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={filters.asset || ''} onValueChange={(v) => updateFilter('asset', v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs">
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Assets</SelectItem>
                  {DEFAULT_ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.session || ''} onValueChange={(v) => updateFilter('session', v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sessions</SelectItem>
                  {SESSIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.entryModel || ''} onValueChange={(v) => updateFilter('entryModel', v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs">
                  <SelectValue placeholder="Entry Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
                  {ENTRY_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.outcome || ''} onValueChange={(v) => updateFilter('outcome', v)}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 text-xs">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Outcomes</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                placeholder="From date"
                className="bg-white/[0.03] border-white/10 text-xs [color-scheme:dark]"
              />
            </div>
          </motion.div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Trades" value={String(analytics.totalTrades)} icon={BarChart2} delay={0} />
          <StatCard label="Total P&L" value={formatCurrency(analytics.totalPnL)} icon={TrendingUp} color={getPnLColor(analytics.totalPnL)} delay={0.05} />
          <StatCard label="Win Rate" value={formatPercentage(analytics.winRate)} icon={Target} delay={0.1} />
          <StatCard label="Avg RR" value={formatRR(analytics.avgRR)} icon={Award} delay={0.15} />
        </div>

        {analytics.totalTrades === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No data yet</h3>
            <p className="text-sm text-muted-foreground/60">Start logging trades to see your analytics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equity Curve */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-xl p-4 lg:col-span-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Equity Curve</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analytics.equityCurve}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="equity" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#equityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Monthly Performance */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Monthly Performance</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Session Performance */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass-card rounded-xl p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Session Performance</h3>
              <div className="space-y-4">
                {sessionData.map((session) => (
                  <div key={session.session} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{session.label}</span>
                      <span className={`font-mono-num font-semibold ${getPnLColor(session.pnl)}`}>
                        {formatCurrency(session.pnl)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{session.trades} trades</span>
                      <span>{formatPercentage(session.winRate)} win rate</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${session.pnl >= 0 ? 'bg-cyan-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(session.winRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Asset Performance */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-xl p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Asset Performance</h3>
              <div className="space-y-3">
                {analytics.assetPerformance.slice(0, 8).map((asset) => (
                  <div key={asset.asset} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div>
                      <span className="text-sm font-medium">{asset.asset}</span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{asset.trades} trades</span>
                        <span>{formatPercentage(asset.winRate)} WR</span>
                      </div>
                    </div>
                    <span className={`text-sm font-mono-num font-semibold ${getPnLColor(asset.pnl)}`}>
                      {formatCurrency(asset.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mistake Patterns */}
            {analytics.mistakePatterns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="glass-card rounded-xl p-4"
              >
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Repeated Mistakes
                </h3>
                <div className="space-y-2">
                  {analytics.mistakePatterns.slice(0, 5).map((pattern) => (
                    <div key={pattern.mistake} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-foreground/80 capitalize">{pattern.mistake}</span>
                      <span className="text-xs font-mono-num bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-md">
                        {pattern.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
