/**
 * Pure formatting helpers for Goal Ticker.
 *
 * All returned strings are tabular-nums friendly (consistent digit width) so
 * live 1-second UI updates don't jitter horizontally.
 */

import type { GoalStatus } from './calculator.ts'

export interface FormatUsdOptions {
  readonly decimals?: number
  readonly spaced?: boolean
}

/** Format a USD amount with fixed decimals and thousands separators. */
export function formatUsd(
  amount: number,
  { decimals = 2, spaced = false }: FormatUsdOptions = {},
): string {
  if (!Number.isFinite(amount)) amount = 0
  const sign = amount < 0 ? '-' : ''
  const prefix = spaced ? '$ ' : '$'
  return `${sign}${prefix}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/** Format a progress percentage clamped to [0, 100] with exactly 2 decimals. */
export function formatPct(value: number): string {
  if (!Number.isFinite(value)) value = 0
  return `${Math.min(100, Math.max(0, value)).toFixed(2)}%`
}

/** Format remaining milliseconds as Xd Yh Zm (all components shown, stable width). */
export function formatEta(ms: number): string {
  const totalSeconds = Math.round(Math.max(0, ms) / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}

/**
 * Format an ETA line for a goal card.
 * completed -> "Completed", idle/paused -> "Paused", active -> remaining time or "--".
 */
export function formatEtaLine(status: GoalStatus, remainingMs: number | null): string {
  if (status === 'completed') return 'Completed'
  if (status === 'idle' || status === 'paused') return 'Paused'
  if (remainingMs === null || !Number.isFinite(remainingMs) || remainingMs <= 0) return '--'
  return formatEta(remainingMs)
}
/** Format a Unix-ish millisecond timestamp as "DD Mon YYYY" (e.g. "12 Sep 2025"). */
export function formatDate(ts: number): string {
  if (!Number.isFinite(ts)) return '--'
  return new Date(ts).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
