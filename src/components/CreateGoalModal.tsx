import { useState } from "react"
import { X } from "lucide-react"

type CreateGoalModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, target: number) => void
}

export default function CreateGoalModal({ isOpen, onClose, onCreate }: CreateGoalModalProps) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")

  const stripped = targetAmount.replace(/[^0-9.]/g, "")
  const parsed = Number(stripped)
  const isValid = name.trim().length > 0 && Number.isFinite(parsed) && parsed > 0

  const handleCreate = () => {
    if (isValid) {
      onCreate(name.trim(), parsed)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-2 rounded-2xl border border-white/6 p-6 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            aria-label="Close"
            className="size-11 rounded-full bg-surface-1 border border-white/6 flex items-center justify-center"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-text" />
          </button>
          <h2 className="flex-1 text-center font-bold text-xl tracking-tight text-[#FFFFFF]">
            Add New Goal
          </h2>
          <div className="size-11" aria-hidden="true" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-muted mb-2">Goal Name</label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vacation Fund"
            className="bg-surface-1 rounded-xl pl-4 pr-4 min-h-[44px] py-2 text-text tabular-nums w-full font-sans outline-none focus:ring-2 focus:ring-emerald/50"
          />
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-sm font-semibold text-muted">Target Amount (USD)</span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-base tabular-nums font-sans">
              $
            </span>
            <input
              type="text"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="2,500"
              className="bg-surface-1 rounded-xl pl-11 pr-4 min-h-[44px] py-2 text-text tabular-nums w-full font-sans outline-none focus:ring-2 focus:ring-emerald/50"
            />
          </div>
        </div>

        <button
          type="button"
          className="w-full bg-emerald rounded-xl min-h-[48px] py-3 px-4 text-emerald-text font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreate}
          disabled={!isValid}
        >
          Create Goal
        </button>
      </div>
    </div>
  )
}
