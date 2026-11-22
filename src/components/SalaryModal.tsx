import { useState } from "react"
import { useGoalStore } from "../store/useGoalStore.ts"

type SalaryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (amount: number) => void
}

export default function SalaryModal({ isOpen, onClose, onSave }: SalaryModalProps) {
  const [value, setValue] = useState("")
  const store = useGoalStore.getState()

  const stripped = value.replace(/[^0-9.]/g, "")
  const parsed = Number(stripped)
  const isValid = Number.isFinite(parsed) && parsed > 0

  const handleSave = () => {
    if (isValid) {
      store.setSalary(parsed)
      onSave(parsed)
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
        <h2 className="font-sans text-2xl font-bold tracking-tight text-[#FFFFFF]">
          Contract Salary (USD)
        </h2>

        <div className="mt-6 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-base tabular-nums font-sans">
            $
          </span>
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="3,500.00"
            className="bg-surface-1 rounded-xl pl-11 pr-4 min-h-[44px] py-2 text-text tabular-nums w-full font-sans outline-none focus:ring-2 focus:ring-emerald/50"
          />
        </div>

        <p className="mt-3 text-sm text-muted">
          Enter your 30-day gross salary for accurate 24/7 accrual.
        </p>

        <button
          type="button"
          className="mt-8 w-full bg-emerald rounded-xl min-h-[48px] py-3 px-4 text-emerald-text font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!isValid}
        >
          Save Salary
        </button>
      </div>
    </div>
  )
}
