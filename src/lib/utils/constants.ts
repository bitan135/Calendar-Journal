// ============================================================================
// SMC Journal — Constants & Presets
// ============================================================================

import { Session, Bias, IntradayBias, POIType, EntryModel } from '@/lib/types';

// ============================================================================
// Asset Presets
// ============================================================================

export const DEFAULT_ASSETS = [
  'XAUUSD',
  'EURUSD',
  'GBPUSD',
  'GBPJPY',
  'USDJPY',
  'AUDUSD',
  'USDCAD',
  'NZDUSD',
  'EURJPY',
  'EURGBP',
  'NAS100',
  'US30',
  'SPX500',
  'BTCUSD',
  'ETHUSD',
] as const;

// ============================================================================
// Session Definitions
// ============================================================================

export const SESSIONS: { value: Session; label: string; timeRange: string; color: string }[] = [
  { value: 'asian', label: 'Asian', timeRange: '00:00 – 09:00 GMT', color: '#a78bfa' },
  { value: 'london', label: 'London', timeRange: '07:00 – 16:00 GMT', color: '#60a5fa' },
  { value: 'new_york', label: 'New York', timeRange: '12:00 – 21:00 GMT', color: '#f97316' },
];

export const SESSION_LABELS: Record<Session, string> = {
  asian: 'Asian',
  london: 'London',
  new_york: 'New York',
};

// ============================================================================
// Bias Options
// ============================================================================

export const BIAS_OPTIONS: { value: Bias; label: string; color: string }[] = [
  { value: 'bullish', label: 'Bullish', color: '#00d4ff' },
  { value: 'bearish', label: 'Bearish', color: '#ff4757' },
];

export const INTRADAY_BIAS_OPTIONS: { value: IntradayBias; label: string }[] = [
  { value: 'continuation', label: 'Continuation' },
  { value: 'reversal', label: 'Reversal' },
];

// ============================================================================
// POI Types
// ============================================================================

export const POI_TYPES: { value: POIType; label: string }[] = [
  { value: 'extreme', label: 'Extreme POI' },
  { value: 'decisional', label: 'Decisional POI' },
];

// ============================================================================
// Entry Models
// ============================================================================

export const ENTRY_MODELS: { value: EntryModel; label: string }[] = [
  { value: 'two_leg_protocol', label: 'Two-Leg Protocol' },
  { value: 'mitigation_to_m1_poi', label: 'Mitigation to M1 POI' },
  { value: 'inducement', label: 'Inducement' },
];

export const ENTRY_MODEL_LABELS: Record<EntryModel, string> = {
  two_leg_protocol: 'Two-Leg Protocol',
  mitigation_to_m1_poi: 'Mitigation to M1 POI',
  inducement: 'Inducement',
};

// ============================================================================
// Direction
// ============================================================================

export const DIRECTIONS = [
  { value: 'buy' as const, label: 'Buy', color: '#00d4ff' },
  { value: 'sell' as const, label: 'Sell', color: '#ff4757' },
];

// ============================================================================
// Trade Outcome Colors
// ============================================================================

export const OUTCOME_COLORS = {
  win: '#00d4ff',
  loss: '#ff4757',
  breakeven: '#64748b',
} as const;

export const PNL_COLORS = {
  profit: '#00d4ff',
  loss: '#ff4757',
  neutral: '#64748b',
} as const;

// ============================================================================
// Chart Colors
// ============================================================================

export const CHART_COLORS = {
  primary: '#00d4ff',
  secondary: '#a78bfa',
  tertiary: '#f97316',
  positive: '#00d4ff',
  negative: '#ff4757',
  grid: '#1e1e2e',
  axis: '#4a4a6a',
  tooltip: '#1a1a2e',
} as const;

// ============================================================================
// Note Fields Configuration
// ============================================================================

export const NOTE_FIELDS = [
  { key: 'tradeReasoning' as const, label: 'Trade Reasoning', placeholder: 'Why did you take this trade?' },
  { key: 'marketNarrative' as const, label: 'Market Narrative', placeholder: 'What was the market context?' },
  { key: 'sessionObservation' as const, label: 'Session Observation', placeholder: 'Key observations during the session...' },
  { key: 'mistakeMade' as const, label: 'Mistake Made', placeholder: 'What went wrong, if anything?' },
  { key: 'lessonLearned' as const, label: 'Lesson Learned', placeholder: 'Key takeaway from this trade...' },
  { key: 'emotionalState' as const, label: 'Emotional State', placeholder: 'How were you feeling during execution?' },
  { key: 'importantNote' as const, label: 'Important Note', placeholder: 'Anything worth remembering...' },
] as const;

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const KEYBOARD_SHORTCUTS = [
  { key: '⌘K', description: 'Search trades' },
  { key: 'N', description: 'New trade' },
  { key: 'T', description: 'Go to today' },
  { key: '←', description: 'Previous month' },
  { key: '→', description: 'Next month' },
  { key: '?', description: 'Show shortcuts' },
  { key: 'Esc', description: 'Close modal' },
] as const;

// ============================================================================
// App Config
// ============================================================================

export const APP_CONFIG = {
  name: 'SMC Journal',
  version: '1.0.0',
  backupVersion: 1,
  maxImageWidth: 1920,
  imageQuality: 0.8,
  defaultLotSize: 0.01,
} as const;
