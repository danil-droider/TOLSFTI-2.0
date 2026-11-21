/**
 * Pure financial math for Goal Ticker.
 *
 * - Continuous 24/7 accrual: baseRatePerMs = monthlySalary / (30 * 24 * 60 * 60 * 1000)
 * - Equal splitting among active goals only; idle / paused / completed earn 0.
 * - Timestamp-based settlement with iterative cascade completion over deltaMs.
 * - All functions are pure: inputs are never mutated.
 */

export type GoalStatus = 'idle' | 'active' | 'paused' | 'completed'

/** Milliseconds in a 30-day month, per the product spec. */
export const MS_PER_30_DAYS = 30 * 24 * 60 * 60 * 1000

export interface SettleableGoal {
  readonly id: string
  readonly title: string
  readonly saved: number
  readonly target: number
  readonly status: GoalStatus
  readonly lastUpdated: number
}

export interface SettledGoal {
  readonly id: string
  readonly title: string
  readonly saved: number
  readonly target: number
  readonly status: GoalStatus
  readonly lastUpdated: number
}

// Mutable working copy used during simulation; inputs stay untouched.
interface MutableGoal {
  id: string
  title: string
  saved: number
  target: number
  status: GoalStatus
  lastUpdated: number
}

/** Base earning rate in USD per millisecond. */
export function baseRatePerMs(monthlySalary: number): number {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return 0
  return monthlySalary / MS_PER_30_DAYS
}

/** Per-goal rate when N goals are active simultaneously (equal splitting). */
export function activeGoalRate(baseRate: number, activeCount: number): number {
  if (!Number.isFinite(baseRate) || baseRate <= 0 || activeCount <= 0) return 0
  return baseRate / activeCount
}

/** Milliseconds remaining for a goal to complete at a given rate, or null. */
export function etaRemainingMs(
  saved: number,
  target: number,
  ratePerMs: number,
): number | null {
  if (!Number.isFinite(ratePerMs) || ratePerMs <= 0 || saved >= target) return null
  return (target - saved) / ratePerMs
}

/** Progress percentage clamped to [0, 100]. */
export function progressPct(saved: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0
  return Math.min(100, Math.max(0, (saved / target) * 100))
}

/**
 * Settle all goals up to `now`.
 *
 * Earned amounts are committed from each goal's own `lastUpdated` up to `now`
 * using its share of the base rate (baseRate / N over periods where N goals
 * are active). If an active goal reaches its `target` before `now`, it is
 * capped at `target`, marked `completed`, and its freed rate is redistributed
 * to the remaining active goals for the remainder of the interval. The
 * simulation repeats iteratively until `now` is reached or no active goals
 * remain.
 *
 * Returns a new array; the input is never mutated. Every returned goal has
 * `lastUpdated === now`.
 */
export function settleGoals(
  goals: readonly SettleableGoal[],
  monthlySalary: number,
  now: number,
): SettledGoal[] {
  const base = baseRatePerMs(monthlySalary)
  const nowMs = Number.isFinite(now) ? now : Date.now()

  // Mutable working copies; the input array and its elements stay untouched.
  const work: MutableGoal[] = goals.map((g) => ({
    id: g.id,
    title: g.title,
    saved: g.saved,
    target: g.target,
    // A goal already at its target is completed, not actively earning.
    status: g.status === 'active' && g.saved >= g.target && g.target > 0 ? 'completed' : g.status,
    lastUpdated: g.lastUpdated,
  }))

  // Sweep events ordered by lastUpdated (stable: ties keep input order).
  const events = work
    .map((g, index) => ({ goal: g, index }))
    .sort((a, b) => a.goal.lastUpdated - b.goal.lastUpdated || a.index - b.index)

  const isEarning = (g: MutableGoal): boolean =>
    g.status === 'active' && g.saved < g.target

  const active: MutableGoal[] = []
  let sweepTime = nowMs
  let started = false

  const addIfEarning = (g: SettleableGoal): void => {
    if (isEarning(g)) active.push(g)
  }

  /**
   * Advance all currently active goals from `sweepTime` to `end`.
   * Completes any goal that reaches its target mid-interval, then
   * redistributes the freed rate iteratively.
   */
  const advanceTo = (end: number): void => {
    if (end < sweepTime) return
    while (sweepTime < end && active.length > 0) {
      const rate = base / active.length

      let finishTime = end
      let finisher: MutableGoal | undefined
      for (const g of active) {
        const need = g.target - g.saved
        if (need <= 0) {
          finisher = g
          finishTime = sweepTime
          break
        }
        const finishAt = rate > 0 ? sweepTime + need / rate : Infinity
        if (finishAt < finishTime) {
          finishTime = finishAt
          finisher = g
        }
      }

      const duration = finishTime - sweepTime
      if (duration > 0 && rate > 0) {
        for (const g of active) g.saved += rate * duration
      }
      sweepTime = finishTime

      if (finisher) {
        finisher.saved = Math.min(finisher.saved, finisher.target)
        finisher.status = 'completed'
        const finisherId = finisher.id
        for (let i = active.length - 1; i >= 0; i--) {
          if (active[i].id === finisherId) active.splice(i, 1)
        }
      } else {
        sweepTime = end
      }
    }
    sweepTime = end
  }

  for (const { goal } of events) {
    const eventTime = Math.min(Math.max(goal.lastUpdated, 0), nowMs)
    if (!started) {
      sweepTime = eventTime
      started = true
    }
    if (eventTime > sweepTime) advanceTo(eventTime)
    addIfEarning(goal)
  }
  if (started) advanceTo(nowMs)

  return work.map((g) => ({
    id: g.id,
    title: g.title,
    saved: g.saved,
    target: g.target,
    status: g.status,
    lastUpdated: nowMs,
  }))
}