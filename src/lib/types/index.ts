// ============================================================================
// SMC Journal — TypeScript Type Definitions
// ============================================================================

export interface Trade {
  id?: number;

  // Basic Information
  asset: string;
  direction: 'buy' | 'sell';
  date: string; // ISO date string: "2026-06-20"
  entryTime: string; // "14:30"
  exitTime: string; // "15:45"
  session: Session;

  // Risk Management
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rrRatio: number;
  profitLoss: number;

  // Higher Timeframe Analysis
  bias4H: Bias;
  bias1H: Bias;

  // Intraday Analysis
  bias15M: IntradayBias;

  // SMC Execution
  inducementPresent: boolean;
  poiType: POIType;
  entryModel: EntryModel;

  // Trade Notes
  tradeReasoning: string;
  marketNarrative: string;
  sessionObservation: string;
  mistakeMade: string;
  lessonLearned: string;
  emotionalState: string;
  importantNote: string;

  // Metadata
  outcome: TradeOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface TradeImage {
  id?: number;
  tradeId: number;
  type: ImageType;
  blob: Blob;
  filename: string;
  mimeType: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  defaultAssets: string[];
  defaultLotSize: number;
  lastBackupDate: string;
}

// ============================================================================
// Union Types (used as dropdown/toggle values)
// ============================================================================

export type Session = 'asian' | 'london' | 'new_york';
export type Bias = 'bullish' | 'bearish';
export type IntradayBias = 'continuation' | 'reversal';
export type POIType = 'extreme' | 'decisional';
export type EntryModel = 'two_leg_protocol' | 'mitigation_to_m1_poi' | 'inducement';
export type TradeOutcome = 'win' | 'loss' | 'breakeven';
export type ImageType = 'before_entry' | 'after_trade';
export type Direction = 'buy' | 'sell';

// ============================================================================
// Computed / View Types
// ============================================================================

export interface DaySummary {
  date: string;
  totalPnL: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgRR: number;
  bestTrade: number;
  worstTrade: number;
}

export interface MonthSummary {
  [date: string]: DaySummary;
}

export interface AnalyticsData {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgRR: number;
  weeklyPnL: { week: string; pnl: number }[];
  monthlyPnL: { month: string; pnl: number }[];
  equityCurve: { date: string; equity: number }[];
  sessionPerformance: { session: string; pnl: number; winRate: number; trades: number }[];
  assetPerformance: { asset: string; pnl: number; winRate: number; trades: number }[];
  mistakePatterns: { mistake: string; count: number }[];
}

export interface FilterState {
  asset: string;
  session: string;
  dateFrom: string;
  dateTo: string;
  entryModel: string;
  outcome: string;
  searchQuery: string;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  trades: Trade[];
  images: {
    tradeId: number;
    type: ImageType;
    filename: string;
    mimeType: string;
    dataUrl: string; // Base64 for export
  }[];
  settings: AppSettings | null;
}
