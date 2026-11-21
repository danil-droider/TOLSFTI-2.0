/// <reference types="vitest" />

import { describe, expect, it } from 'vitest'
import {
  activeGoalRate,
  baseRatePerMs,
  etaRemainingMs,
  MS_PER_30_DAYS,
  progressPct,
  settleGoals,
} from './calculator.ts'
import type { SettleableGoal } from './calculator.ts'
import { formatEtaLine, formatPct, formatUsd } from './formatters.ts'

const monthlySalary = 3000
const baseRate = baseRatePerMs(monthlySalary)

describe('baseRatePerMs', () => {
  it('matches monthlySalary / (30 * 24 * 60 * 60 * 1000)', () => {
    const expected = monthlySalary / MS_PER_30_DAYS
    expect(baseRatePerMs(monthlySalary)).toBeCloseTo(expected, 6)
  })

  it('returns 0 for zero salary', () => {
    expect(baseRatePerMs(0)).toBe(0)
  })

  it('returns 0 for negative salary', () => {
    expect(baseRatePerMs(-1000)).toBe(0)
  })

  it('returns 0 for NaN / Infinity', () => {
    expect(baseRatePerMs(NaN)).toBe(0)
    expect(baseRatePerMs(Infinity)).toBe(0)
  })
})

describe('activeGoalRate (equal splitting)', () => {
  it('returns base rate divided by N for N active goals', () => {
    expect(activeGoalRate(baseRate, 1)).toBeCloseTo(baseRate / 1, 6)
    expect(activeGoalRate(baseRate, 2)).toBeCloseTo(baseRate / 2, 6)
    expect(activeGoalRate(baseRate, 4)).toBeCloseTo(baseRate / 4, 6)
  })

  it('returns 0 when no active goals', () => {
    expect(activeGoalRate(baseRate, 0)).toBe(0)
    expect(activeGoalRate(baseRate, -1)).toBe(0)
  })

  it('returns 0 for non-positive base rate', () => {
    expect(activeGoalRate(0, 5)).toBe(0)
    expect(activeGoalRate(-100, 5)).toBe(0)
  })
})

describe('settleGoals', () => {
  it('does not mutate the input array', () => {
    const g: SettleableGoal = { id: 'a', title: 'A', saved: 0, target: 100, status: 'active', lastUpdated: 0 }
    const before = JSON.parse(JSON.stringify(g))
    settleGoals([g], monthlySalary, 100000)
    expect(g).toEqual(before)
  })

  it('0 active goals: saved unchanged, timestamps refreshed to now', () => {
    const g1: SettleableGoal = { id: 'a', title: 'A', saved: 100, target: 500, status: 'paused', lastUpdated: 0 }
    const g2: SettleableGoal = { id: 'b', title: 'B', saved: 0, target: 500, status: 'completed', lastUpdated: 0 }
    const now = 500000
    const settled = settleGoals([g1, g2], monthlySalary, now)
    expect(settled[0].saved).toBe(100)
    expect(settled[1].saved).toBe(0)
    expect(settled[0].lastUpdated).toBe(now)
    expect(settled[1].lastUpdated).toBe(now)
  })

  it('idle / paused / completed earn 0 and do not count toward N', () => {
    // Large target so the earning goal does not complete within one month.
    const earning: SettleableGoal = { id: 'earn', title: 'Earn', saved: 0, target: 100000, status: 'active', lastUpdated: 0 }
    const paused: SettleableGoal = { id: 'p', title: 'P', saved: 0, target: 100000, status: 'paused', lastUpdated: 0 }
    const idle: SettleableGoal = { id: 'i', title: 'I', saved: 0, target: 100000, status: 'idle', lastUpdated: 0 }
    const completed: SettleableGoal = { id: 'c', title: 'C', saved: 1000, target: 1000, status: 'completed', lastUpdated: 0 }

    const now = 30 * 24 * 60 * 60 * 1000
    const settled = settleGoals([earning, paused, idle, completed], monthlySalary, now)

    expect(settled[0].saved).toBeCloseTo(monthlySalary, 0)
    expect(settled[0].status).toBe('active')
    expect(settled[1].saved).toBe(0)
    expect(settled[2].saved).toBe(0)
    expect(settled[3].saved).toBe(1000)
    expect(settled[3].status).toBe('completed')
  })

  it('settlement before mutation: re-settling at the same now adds nothing (idempotent)', () => {
    const g: SettleableGoal = { id: 'a', title: 'A', saved: 0, target: 1000, status: 'active', lastUpdated: 0 }
    const now = 1000000
    const first = settleGoals([g], monthlySalary, now)
    const second = settleGoals(first, monthlySalary, now)
    expect(second[0].saved).toBeCloseTo(first[0].saved, 6)
    expect(second[0].lastUpdated).toBe(now)
  })

  it('catch-up: goals with different lastUpdated earn only from their own timestamp', () => {
    const early: SettleableGoal = { id: 'early', title: 'Early', saved: 0, target: 10000, status: 'active', lastUpdated: 0 }
    const late: SettleableGoal = { id: 'late', title: 'Late', saved: 0, target: 10000, status: 'active', lastUpdated: 1000000 }
    const now = 2000000
    const settled = settleGoals([early, late], monthlySalary, now)

    // Early earns alone from 0-1000000 at full rate, then both active at half rate.
    const earlyExpected = baseRate * 1000000 + (baseRate / 2) * 1000000
    const lateExpected = (baseRate / 2) * 1000000
    expect(settled[0].saved).toBeCloseTo(earlyExpected, 0)
    expect(settled[1].saved).toBeCloseTo(lateExpected, 0)
    expect(settled[1].saved).toBeLessThan(settled[0].saved)
  })
})

describe('cascade completion', () => {
  it('caps first finisher at target, marks completed, redistributes freed rate', () => {
    const a: SettleableGoal = { id: 'a', title: 'Small', saved: 0, target: 100, status: 'active', lastUpdated: 0 }
    const b: SettleableGoal = { id: 'b', title: 'Large', saved: 0, target: 100000, status: 'active', lastUpdated: 0 }
    const now = 30 * 24 * 60 * 60 * 1000

    const settled = settleGoals([a, b], monthlySalary, now)

    expect(settled[0].status).toBe('completed')
    expect(settled[0].saved).toBe(100)
    expect(settled[1].saved).toBeGreaterThan(0)
    expect(settled[1].saved).toBeLessThan(100000)
    expect(settled[1].status).toBe('active')
    expect(settled[0].lastUpdated).toBe(now)
    expect(settled[1].lastUpdated).toBe(now)
  })

  it('handles multi-goal cascade within a single delta', () => {
    const a: SettleableGoal = { id: 'a', title: 'A', saved: 0, target: 10, status: 'active', lastUpdated: 0 }
    const b: SettleableGoal = { id: 'b', title: 'B', saved: 0, target: 20, status: 'active', lastUpdated: 0 }
    const c: SettleableGoal = { id: 'c', title: 'C', saved: 0, target: 30, status: 'active', lastUpdated: 0 }
    const now = 30 * 24 * 60 * 60 * 1000

    const settled = settleGoals([a, b, c], monthlySalary, now)

    expect(settled[0].status).toBe('completed')
    expect(settled[0].saved).toBe(10)
    expect(settled[1].status).toBe('completed')
    expect(settled[1].saved).toBe(20)
    expect(settled[2].status).toBe('completed')
    expect(settled[2].saved).toBe(30)
    expect(settled.every((g) => g.lastUpdated === now)).toBe(true)
  })

  it('never exceeds target even with a huge delta', () => {
    const g: SettleableGoal = { id: 'a', title: 'A', saved: 0, target: 500, status: 'active', lastUpdated: 0 }
    const hugeDelta = 1000 * 30 * 24 * 60 * 60 * 1000
    const settled = settleGoals([g], monthlySalary, hugeDelta)
    expect(settled[0].saved).toBe(500)
    expect(settled[0].status).toBe('completed')
  })
})

describe('helpers', () => {
  it('progressPct clamps to [0, 100]', () => {
    expect(progressPct(0, 1000)).toBe(0)
    expect(progressPct(500, 1000)).toBe(50)
    expect(progressPct(1000, 1000)).toBe(100)
    expect(progressPct(2000, 1000)).toBe(100)
    expect(progressPct(100, 0)).toBe(0)
  })

  it('etaRemainingMs returns null when not earning or already complete', () => {
    expect(etaRemainingMs(500, 1000, 0)).toBeNull()
    expect(etaRemainingMs(1000, 1000, 10)).toBeNull()
    expect(etaRemainingMs(0, 1000, 10)).toBe(100)
  })

  it('formatUsd produces tabular-nums friendly strings', () => {
    expect(formatUsd(3500)).toBe('$3,500.00')
    expect(formatUsd(3500, { spaced: true })).toBe('$ 3,500.00')
    expect(formatUsd(0)).toBe('$0.00')
    expect(formatUsd(-100.5)).toBe('-$100.50')
  })

  it('formatPct clamps and uses 2 decimals', () => {
    expect(formatPct(42.854)).toBe('42.85%')
    expect(formatPct(0)).toBe('0.00%')
    expect(formatPct(100)).toBe('100.00%')
    expect(formatPct(-5)).toBe('0.00%')
    expect(formatPct(150)).toBe('100.00%')
    expect(formatPct(NaN)).toBe('0.00%')
  })

  it('formatEtaLine returns status strings for non-active goals', () => {
    expect(formatEtaLine('completed', null)).toBe('Completed')
    expect(formatEtaLine('paused', 100000)).toBe('Paused')
    expect(formatEtaLine('idle', 100000)).toBe('Paused')
  })

  it('formatEtaLine returns Xd Yh Zm Ss for active goals', () => {
    expect(formatEtaLine('active', 86400000)).toBe('1d 0h 0m 0s')
    expect(formatEtaLine('active', 90061000)).toBe('1d 1h 1m 1s')
    expect(formatEtaLine('active', null)).toBe('--')
  })
})
