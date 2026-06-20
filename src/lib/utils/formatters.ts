// ============================================================================
// SMC Journal — Formatters
// ============================================================================

import { format, parseISO, isToday, isValid } from 'date-fns';

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  const prefix = value >= 0 ? '+$' : '-$';
  return `${prefix}${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a compact currency for calendar cells
 */
export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    const prefix = value >= 0 ? '+' : '-';
    return `${prefix}$${(Math.abs(value) / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format RR ratio
 */
export function formatRR(ratio: number): string {
  return `1:${ratio.toFixed(2)}`;
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Format a date with day of week
 */
export function formatDateFull(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  if (!time) return '';
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return time;
  }
}

/**
 * Format month for calendar header
 */
export function formatMonth(year: number, month: number): string {
  const date = new Date(year, month);
  return format(date, 'MMMM yyyy');
}

/**
 * Check if a date string is today
 */
export function isDateToday(dateStr: string): boolean {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

/**
 * Get ISO date string for today
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get the P&L color class
 */
export function getPnLColor(value: number): string {
  if (value > 0) return 'text-cyan-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

/**
 * Get the P&L background color class
 */
export function getPnLBgColor(value: number): string {
  if (value > 0) return 'bg-cyan-500/20 text-cyan-400';
  if (value < 0) return 'bg-red-500/20 text-red-400';
  return 'bg-slate-500/20 text-slate-400';
}
