import { ChevronLeft, Pause, Play } from "lucide-react"
import { useGoalStore } from "../store/useGoalStore.ts"
import { formatDate, formatUsd, formatPct } from "../utils/formatters.ts"

import GoalBadge from "./GoalBadge.tsx"
export type GoalStatus = "idle" | "active" | "paused" | "completed"

interface GoalDetailScreenProps {
  goalId: string
  onBack: () => void
}

const STATUS_BADGE: Record<
  GoalStatus,
  { label: string; bg: string; border: string; text: string }
> = {
  paused: { label: "PAUSED", bg: "bg-amber/10", border: "border-amber/30", text: "text-amber" },
  active: { label: "ACTIVE", bg: "bg-emerald/10", border: "border-emerald/30", text: "text-emerald" },
  idle: { label: "IDLE", bg: "bg-surface-3", border: "border-white/10", text: "text-muted" },
  completed: { label: "COMPLETED", bg: "bg-emerald/10", border: "border-emerald/30", text: "text-emerald" },
}

const BAR_COLOR: Record<GoalStatus, string> = {
  paused: "bg-amber",
  active: "bg-emerald",
  idle: "bg-[#3A3A3C]",
  completed: "bg-emerald",
}

export default function GoalDetailScreen({ goalId, onBack }: GoalDetailScreenProps) {
  const store = useGoalStore.getState()
  const goal = useGoalStore((s) => s.getGoal(goalId))
  const dailyRate = useGoalStore((s) => s.goalDailyRate(goalId))
  const tick = useGoalStore((s) => s.tick) // 1-second UI tick forces live percentage / ETA refresh

  if (!goal) return null

  const isActive = goal.status === "active"
  const isPaused = goal.status === "paused"
  const isIdle = goal.status === "idle"
  const isCompleted = goal.status === "completed"

  const badge = STATUS_BADGE[goal.status] ?? STATUS_BADGE.idle
  const { label: badgeLabel, bg: badgeBg, border: badgeBorder, text: badgeText } = badge
  const barColor = BAR_COLOR[goal.status] ?? BAR_COLOR.idle
  const pct = store.goalPct(goal.id)
  const eta = store.goalEtaLine(goal.id)
  const pctColor = isActive || isCompleted ? "text-emerald" : isPaused ? "text-amber" : "text-muted"

  void tick

  const actionButton = isPaused ? (
    <button
      type="button"
      className="w-full bg-amber rounded-xl min-h-[48px] py-3 px-4 text-emerald-text font-bold text-base"
      onClick={() => store.toggleSaving(goal.id)}
    >
      Resume Saving
    </button>
  ) : isIdle ? (
    <button
      type="button"
      className="w-full bg-emerald rounded-xl min-h-[48px] py-3 px-4 text-emerald-text font-bold text-base"
      onClick={() => store.toggleSaving(goal.id)}
    >
      Start Saving
    </button>
  ) : isCompleted ? (
    <button
      type="button"
      disabled
      className="w-full border border-white/10 rounded-xl min-h-[48px] py-3 px-4 text-muted font-bold text-base"
    >
      Completed
    </button>
  ) : (
    <button
      type="button"
      className="w-full border border-emerald/50 rounded-xl min-h-[48px] py-3 px-4 text-emerald font-bold text-base"
      onClick={() => store.toggleSaving(goal.id)}
    >
      Pause Saving
    </button>
  )

  return (
    <div className="flex flex-col min-h-screen bg-background text-text p-4">
      <header className="flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Back"
          className="size-11 rounded-full bg-surface-1 border border-white/6 flex items-center justify-center"
          onClick={onBack}
        >
          <ChevronLeft className="w-5 h-5 text-text" />
        </button>
        <h2 className="flex-1 text-center font-bold text-xl tracking-tight text-[#FFFFFF]">
          Goal Progress
        </h2>
        <div className="size-11" aria-hidden="true" />
      </header>

      <main className="flex-1 overflow-y-auto">
        <section className="bg-surface-2 rounded-2xl border border-white/6 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <GoalBadge badge={goal.badge} />
              <h3 className="font-bold text-[#FFFFFF] truncate min-w-0">{goal.title}</h3>
            </div>
            <span
              className={`flex-1 ${badgeBg} ${badgeBorder} rounded-full px-3 py-1 text-[10px] font-bold uppercase ${badgeText} text-center`}
            >
              {badgeLabel}
            </span>
            <button
              type="button"
              aria-label={isPaused ? "Resume saving" : "Pause saving"}
              className="size-11 rounded-full border border-white/6 bg-surface-1 flex items-center justify-center"
              onClick={() => store.toggleSaving(goal.id)}
            >
              {isActive ? <Pause className="w-5 h-5 text-text" /> : <Play className="w-5 h-5 text-text" />}
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-sm font-semibold text-muted">Saved</span>
          </div>
          <div className="font-bold text-[24px] tabular-nums text-[#FFFFFF]">
            {formatUsd(goal.saved)} / {formatUsd(goal.target)}
          </div>
          <div className="h-2 w-full rounded-full bg-[#3A3A3C] overflow-hidden">
            <div className={`h-2 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-sm font-semibold text-muted">Progress</span>
            <span className={`font-bold tabular-nums ${pctColor}`}>{formatPct(pct)}</span>
          </div>
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-sm font-semibold text-muted">ETA</span>
            <span className="font-bold text-[#FFFFFF] tabular-nums">{eta}</span>
          </div>
        </section>

        <section className="bg-surface-2 rounded-2xl border border-white/6 p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm text-muted">Daily Rate:</span>
              <span className="font-bold text-[#FFFFFF] tabular-nums">{formatUsd(dailyRate)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm text-muted">Started:</span>
              <span className="font-bold text-[#FFFFFF]">{formatDate(goal.createdAt)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2 border-t border-white/6 pt-3">
              <span className="text-sm text-muted">Target:</span>
              <span className="font-bold text-[#FFFFFF] tabular-nums">{formatUsd(goal.target)}</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-4 left-4 right-4 flex flex-col gap-3 p-1">
        {actionButton}
        <button
          type="button"
          className="w-full rounded-xl min-h-[44px] py-3 px-4 text-sm font-medium text-muted opacity-70 hover:opacity-100"
          onClick={() => {
            store.deleteGoal(goal.id)
            onBack()
          }}
        >
          Delete Goal
        </button>
      </div>
    </div>
  )
}
