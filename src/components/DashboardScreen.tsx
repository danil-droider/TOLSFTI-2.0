import { useState, useRef, useEffect } from "react"
import { Settings, Pause, Play, Plus } from "lucide-react"
import { useGoalStore } from "../store/useGoalStore.ts"
import { formatUsd } from "../utils/formatters.ts"
import CreateGoalModal from "./CreateGoalModal.tsx"
import SalaryModal from "./SalaryModal.tsx"
import GoalBadge from "./GoalBadge.tsx"
import type { BadgeValue } from "./GoalBadge.tsx"

type GoalStatus = "idle" | "active" | "paused" | "completed"

const ICON_NAMES: string[] = ["Laptop", "Camera", "Target"]

const STATUS_CONFIG: Record<
  GoalStatus,
  { bar: string; text: string; ring: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  active: { bar: "bg-emerald", text: "text-emerald", ring: "border-emerald/50", Icon: Pause },
  paused: { bar: "bg-amber", text: "text-amber", ring: "border-amber/50", Icon: Play },
  completed: { bar: "bg-emerald", text: "text-emerald", ring: "border-muted/30", Icon: Play },
  idle: { bar: "bg-[#3A3A3C]", text: "text-muted", ring: "border-muted/30", Icon: Play },
}

export interface DashboardScreenProps {
  onGoalSelect: (id: string) => void
  onSetSalary: () => void
  onCreateGoal: () => void
}

export default function DashboardScreen({ onGoalSelect, onSetSalary, onCreateGoal }: DashboardScreenProps) {
  const store = useGoalStore.getState()
  const monthlySalary = useGoalStore((s) => s.monthlySalary)
  const goals = useGoalStore((s) => s.goals)
  const tick = useGoalStore((s) => s.tick) // 1-second UI tick forces live ETA / percentage refresh
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)

  // Ref tracking last-rendered ETA/percentage strings to trigger animation ONLY on change
  const prevPctRef = useRef<string>('')
  const prevEtaRef = useRef<string>('')

  useEffect(() => {
    const state = useGoalStore.getState()
    if (goals.length > 0) {
      const lastGoal = goals[goals.length - 1]
      prevPctRef.current = state.goalPct(lastGoal.id).toFixed(2)
      prevEtaRef.current = state.goalEtaLine(lastGoal.id)
    }
  }, [goals, tick])

  const hourlyRate = monthlySalary / (30 * 24)

  void tick

  return (
    <div className="flex flex-col min-h-screen bg-background text-text p-4">
      <div className="flex w-full items-start justify-between">
        {/* Left column: Live Savings and Hourly Earning */}
        <div className="flex flex-col items-start gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#FFFFFF] whitespace-nowrap">Live Savings</h2>
          <p
            className="text-sm text-muted tabular-nums cursor-pointer hover:text-[#FFFFFF]"
            onClick={onSetSalary}
          >
            Hourly Earning: {formatUsd(hourlyRate)}
          </p>
        </div>

        {/* Right column: gear button and version */}
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label="Settings"
            className="h-11 w-11 rounded-full bg-[#1C1C1E]/80 border border-white/6 flex items-center justify-center hover:bg-[#242426] transition-colors"
            onClick={() => setShowSalaryModal(true)}
          >
            <Settings className="w-5 h-5 text-[#8E8E93]" />
          </button>
          <p className="text-xs text-muted">v{import.meta.env.VITE_APP_VERSION ?? "1.0"}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 pb-28">
        {goals.map((goal, index) => {
          const statusConfig = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.idle
          const { bar, text, ring, Icon: StatusIcon } = statusConfig
          const pct = store.goalPct(goal.id)
          const eta = store.goalEtaLine(goal.id)
          // Legacy goals saved before badges were introduced keep the original
          // index-cycled preset icon; new goals use their stored badge.
          const fallbackBadge: BadgeValue = {
            kind: "icon",
            value: ICON_NAMES[index % ICON_NAMES.length],
          }
          const goalBadge: BadgeValue = goal.badge ?? fallbackBadge
          return (
            <div
              key={goal.id}
              onClick={() => onGoalSelect(goal.id)}
              className="bg-surface-2 rounded-2xl border border-white/6 p-4 cursor-pointer"
              data-tick={String(tick)}
            >
              <div className="flex items-center gap-3">
                <GoalBadge badge={goalBadge} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-[#FFFFFF]">{goal.title}</h3>
                    <span className="text-muted text-sm tabular-nums">
                      {formatUsd(goal.saved)} / {formatUsd(goal.target)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    store.toggleSaving(goal.id)
                  }}
                  className={`size-11 rounded-full border ${ring} bg-surface-1 p-0 flex items-center justify-center`}
                >
                  <StatusIcon className={`w-5 h-5 ${text}`} />
                </button>
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-[#3A3A3C] overflow-hidden">
                <div className={`h-2 ${bar}`} style={{ width: `${pct}%` }} />
              </div>

              <div className={`mt-2 flex justify-between items-baseline gap-2`}>
                <span className={`
                  font-semibold ${text} tabular-nums
                  ${pct.toFixed(2) !== prevPctRef.current ? 'fade-down-in' : ''}
                `}>
                  {pct.toFixed(2)}%
                </span>
                <span className="text-muted text-sm tabular-nums">{eta}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-[calc(28px+env(safe-area-inset-bottom))] inset-x-0 z-20">
        <div className="mx-auto w-full max-w-md px-4">
          <button
            type="button"
            onClick={onCreateGoal}
            className="w-full flex items-center justify-center gap-2 bg-emerald text-emerald-text font-bold rounded-2xl min-h-[48px] py-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-center">Add New Goal</span>
          </button>
        </div>
      </div>
      <CreateGoalModal
        isOpen={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onCreate={(name, target) => {
          store.addGoal(name, target)
          setShowCreateGoal(false)
        }}
      />

      <SalaryModal isOpen={showSalaryModal} onClose={() => setShowSalaryModal(false)} onSave={(amount) => { store.setSalary(amount); setShowSalaryModal(false); }} />
    </div>
  )
}
