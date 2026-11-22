import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { GoalStatus } from "../utils/calculator.ts"
import {
  settleGoals,
  baseRatePerMs,
  activeGoalRate,
  etaRemainingMs,
  progressPct,
} from "../utils/calculator.ts"
import { formatEtaLine } from "../utils/formatters.ts"

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface Goal {
  id: string
  title: string
  target: number
  saved: number
  status: GoalStatus
  lastUpdated: number
  createdAt: number
}

interface GoalStoreState {
  monthlySalary: number
  goals: Goal[]
  lastUpdatedTimestamp: number
  tick: number
  completedGoalId: string | null
  settleNow: () => string | null
  setSalary: (amount: number) => void
  addGoal: (title: string, target: number) => void
  deleteGoal: (id: string) => void
  startGoal: (id: string) => void
  pauseGoal: (id: string) => void
  toggleSaving: (id: string) => void
  acknowledgeCompleted: () => void
  startTicker: () => void
  stopTicker: () => void
  goalRate: (id: string) => number
  goalPct: (id: string) => number
  goalEtaMs: (id: string) => number | null
  goalEtaLine: (id: string) => string
  goalDailyRate: (id: string) => number
  getGoal: (id: string) => Goal | undefined
}

const toSettleable = (g: Goal) => ({
  id: g.id,
  title: g.title,
  saved: g.saved,
  target: g.target,
  status: g.status,
  lastUpdated: g.lastUpdated,
})

const VALID_STATUSES: GoalStatus[] = ["idle", "active", "paused", "completed"]

/** Coerce any stored/corrupted status back to a valid lifecycle value. */
function normalizeStatus(status: GoalStatus): GoalStatus {
  return VALID_STATUSES.includes(status) ? status : "idle"
}

let tickerId: ReturnType<typeof setInterval> | undefined

export const useGoalStore = create<GoalStoreState>()(
  persist(
    (set, get) => {
      /**
       * Commit earned progress up to `now` using the settled calculator.
       * Pure snapshot: returns the next goal slice without mutating state.
       * Called before every mutation so accrual always uses the current rate.
       */
      const settle = (now: number): {
        goals: Goal[]
        lastUpdatedTimestamp: number
        newlyCompleted: string | null
      } => {
        const { goals, monthlySalary } = get()
        const prevById = new Map<string, GoalStatus>()
        const createdById = new Map<string, number>()
        for (const g of goals) {
          prevById.set(g.id, g.status)
          createdById.set(g.id, g.createdAt)
        }
        const settled = settleGoals(goals.map(toSettleable), monthlySalary, now)
        let newlyCompleted: string | null = null
        const next: Goal[] = settled.map((g) => {
          const prev = prevById.get(g.id)
          if (prev !== "completed" && g.status === "completed" && newlyCompleted === null) {
            newlyCompleted = g.id
          }
          return { ...g, status: normalizeStatus(g.status), createdAt: createdById.get(g.id) ?? now }
        })
        return { goals: next, lastUpdatedTimestamp: now, newlyCompleted }
      }

      return {
        monthlySalary: 0,
        goals: [],
        lastUpdatedTimestamp: Date.now(),
        tick: 0,
        completedGoalId: null,

        settleNow: (): string | null => {
          const now = Date.now()
          const s = settle(now)
          set(s)
          return s.newlyCompleted
        },

        goalRate: (id: string): number => {
          const { goals, monthlySalary } = get()
          const g = goals.find((x) => x.id === id)
          if (!g || g.status !== "active" || g.saved >= g.target) return 0
          const activeCount = goals.filter((x) => x.status === "active" && x.saved < x.target).length
          return activeGoalRate(baseRatePerMs(monthlySalary), activeCount)
        },

        goalPct: (id: string): number => {
          const now = Date.now()
          const { goals } = get()
          const g = goals.find((x) => x.id === id)
          if (!g) return 0
          let liveSaved = g.saved
          if (g.status === "active" && g.saved < g.target) {
            const rate = get().goalRate(id)
            liveSaved = Math.min(g.target, g.saved + rate * (now - g.lastUpdated))
          }
          return progressPct(liveSaved, g.target)
        },

        goalEtaMs: (id: string): number | null => {
          const now = Date.now()
          const { goals } = get()
          const g = goals.find((x) => x.id === id)
          if (!g) return null
          const rate = g.status === "active" ? get().goalRate(id) : 0
          let liveSaved = g.saved
          if (rate > 0 && g.saved < g.target) {
            liveSaved = Math.min(g.target, g.saved + rate * (now - g.lastUpdated))
          }
          return etaRemainingMs(liveSaved, g.target, rate)
        },

        goalEtaLine: (id: string): string => {
          const { goals } = get()
          const g = goals.find((x) => x.id === id)
          if (!g) return "--"
          return formatEtaLine(g.status, get().goalEtaMs(id))
        },

        goalDailyRate: (id: string): number => {
          return get().goalRate(id) * MS_PER_DAY
        },

        getGoal: (id: string): Goal | undefined => {
          return get().goals.find((g) => g.id === id)
        },

        setSalary: (amount: number): void => {
          const now = Date.now()
          const s = settle(now)
          const update: Partial<GoalStoreState> & { completedGoalId?: string | null } = { goals: s.goals, lastUpdatedTimestamp: now, monthlySalary: amount }
          if (s.newlyCompleted) update.completedGoalId = s.newlyCompleted
          set(update)
        },

        addGoal: (title: string, target: number): void => {
          const now = Date.now()
          const { monthlySalary } = get()
          const s = settle(now)
          const newGoal: Goal = {
            id: crypto.randomUUID(),
            title: title.trim(),
            target,
            saved: 0,
            status: "idle",
            lastUpdated: now,
            createdAt: now,
          }
          const nextGoals = [...s.goals, newGoal]
          const update: Partial<GoalStoreState> & { completedGoalId?: string | null } = { goals: nextGoals, lastUpdatedTimestamp: now, monthlySalary }
          if (s.newlyCompleted) update.completedGoalId = s.newlyCompleted
          set(update)
        },

        deleteGoal: (id: string): void => {
          const now = Date.now()
          const s = settle(now)
          const nextGoals = s.goals.filter((g) => g.id !== id)
          const update: Partial<GoalStoreState> & { completedGoalId?: string | null } = { goals: nextGoals, lastUpdatedTimestamp: now }
          if (s.newlyCompleted) update.completedGoalId = s.newlyCompleted
          set(update)
        },

        startGoal: (id: string): void => {
          const now = Date.now()
          const s = settle(now)
          const update: Partial<GoalStoreState> & { completedGoalId?: string | null } = {
            goals: s.goals.map((g) =>
              g.id === id && (g.status === "idle" || g.status === "paused")
                ? { ...g, status: "active", lastUpdated: now }
                : g
            ),
            lastUpdatedTimestamp: now,
          }
          if (s.newlyCompleted) update.completedGoalId = s.newlyCompleted
          set(update)
        },

        pauseGoal: (id: string): void => {
          const now = Date.now()
          const s = settle(now)
          const update: Partial<GoalStoreState> & { completedGoalId?: string | null } = {
            goals: s.goals.map((g) =>
              g.id === id && g.status === "active" ? { ...g, status: "paused", lastUpdated: now } : g
            ),
            lastUpdatedTimestamp: now,
          }
          if (s.newlyCompleted) update.completedGoalId = s.newlyCompleted
          set(update)
        },

        toggleSaving: (id: string): void => {
          const g = get().getGoal(id)
          if (g && g.status === "active") {
            get().pauseGoal(id)
          } else {
            get().startGoal(id)
          }
        },

        acknowledgeCompleted: (): void => {
          set({ completedGoalId: null })
        },

        startTicker: (): void => {
          get().stopTicker()
          tickerId = setInterval(() => {
            set((state) => ({ tick: state.tick + 1 }))
          }, 1000)
        },

        stopTicker: (): void => {
          if (tickerId !== undefined) {
            clearInterval(tickerId)
            tickerId = undefined
          }
        },
      }
    },
    {
      name: "goal-ticker-storage",
      storage: createJSONStorage(() => globalThis.localStorage),
      partialize: (state) => ({
        monthlySalary: state.monthlySalary,
        goals: state.goals,
        lastUpdatedTimestamp: state.lastUpdatedTimestamp,
      }),
    }
  )
)

