import { CheckCircle2 } from "lucide-react"

export interface GoalAchievedModalProps {
  isOpen: boolean
  onClose: () => void
  onStartNewGoal: () => void
  goal: {
    title: string
    saved: number
    target: number
  }
}

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function GoalAchievedModal({ isOpen, onClose, onStartNewGoal, goal }: GoalAchievedModalProps) {
  if (!isOpen) return null

  const summary = `Goal Achieved: ${goal.title} ' ${usd(goal.saved)} saved of ${usd(goal.target)} target.`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-2 rounded-2xl border border-white/6 p-6 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-[#FFFFFF] text-xl tracking-tight">
          Goal Achieved!
        </h2>

        <div className="mt-5 flex items-center justify-between gap-3">
          <h3 className="font-bold text-[#FFFFFF]">{goal.title}</h3>
          <div className="size-10 rounded-full bg-emerald flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-text" />
          </div>
        </div>

        <div className="mt-6 relative h-4 w-full rounded-full overflow-hidden bg-[#3A3A3C]">
          <div className="h-full bg-emerald w-full" />
          <span
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-emerald-text font-bold text-xs tabular-nums"
          >
            100.00%
          </span>
        </div>

        <div className="mt-5 space-y-1">
          <span className="text-sm font-semibold text-muted">Saved</span>
          <div className="font-bold text-[#FFFFFF] tabular-nums">
            {usd(goal.saved)} / {usd(goal.target)}
          </div>
        </div>

        <p className="mt-5 text-sm text-muted leading-relaxed">
          Congratulations! You've saved up for this goal during your contract.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            className="w-full border border-white/20 rounded-xl min-h-[48px] py-3 px-4 font-bold text-[#FFFFFF] text-base"
            onClick={() => {
              if (typeof navigator.share === "function") {
                navigator.share({ title: "Goal Achieved!", text: summary })
              } else {
                navigator.clipboard.writeText(summary).catch(() => {})
              }
            }}
          >
            Share Achievement
          </button>
          <button
            type="button"
            className="w-full bg-emerald rounded-xl min-h-[48px] py-3 px-4 text-emerald-text font-bold text-base"
            onClick={onStartNewGoal}
          >
            Start a New Goal
          </button>
        </div>
      </div>
    </div>
  )
}
