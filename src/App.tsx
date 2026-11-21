import { useEffect, useState } from "react"
import { useGoalStore } from "./store/useGoalStore.ts"
import confetti from "canvas-confetti"
import OnboardingScreen from "./components/OnboardingScreen.tsx"
import SalaryModal from "./components/SalaryModal.tsx"
import DashboardScreen from "./components/DashboardScreen.tsx"
import GoalDetailScreen from "./components/GoalDetailScreen.tsx"
import GoalAchievedModal from "./components/GoalAchievedModal.tsx"
import CreateGoalModal from "./components/CreateGoalModal.tsx"

export const APP_VERSION = "1.0"

function App() {
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [showCreateGoal, setShowCreateGoal] = useState(false)

  const monthlySalary = useGoalStore((s) => s.monthlySalary)
  const completedGoalId = useGoalStore((s) => s.completedGoalId)
  const goals = useGoalStore((s) => s.goals)

  // Offline catch-up on mount + 1-second UI ticker (refresh only, never financial truth).
  useEffect(() => {
    const store = useGoalStore.getState()
    store.settleNow()
    store.startTicker()
    return () => store.stopTicker()
  }, [])

  // Fire celebration confetti once when a goal transitions to completed.
  useEffect(() => {
    if (!completedGoalId) return
    // canvas-confetti exports its main function as the default export. Guard the call
    // so environments without a usable confetti implementation (e.g. no canvas)
    // never throw "confetti is not a function".
    if (typeof confetti === "function") {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#30D158", "#FFFFFF", "#121212"],
      })
    }
  }, [completedGoalId])

  const store = useGoalStore.getState()
  const selectedGoal = goals.find((g) => g.id === selectedGoalId)
  const achievedGoal = completedGoalId ? goals.find((g) => g.id === completedGoalId) : null

  if (monthlySalary === 0) {
    return (
      <>
        <OnboardingScreen onSetSalary={() => setShowSalaryModal(true)} />
        <SalaryModal
          isOpen={showSalaryModal}
          onClose={() => setShowSalaryModal(false)}
          onSave={(amount) => {
            store.setSalary(amount)
            setShowSalaryModal(false)
          }}
        />
      </>
    )
  }

  return (
    <>
      {selectedGoal ? (
        <GoalDetailScreen goalId={selectedGoal.id} onBack={() => setSelectedGoalId(null)} />
      ) : (
        <DashboardScreen
          onGoalSelect={(id) => setSelectedGoalId(id)}
          onSetSalary={() => setShowSalaryModal(true)}
          onCreateGoal={() => setShowCreateGoal(true)}
        />
      )}
      {achievedGoal && (
        <GoalAchievedModal
          isOpen
          onClose={() => store.acknowledgeCompleted()}
          onStartNewGoal={() => {
            store.acknowledgeCompleted()
            setShowCreateGoal(true)
          }}
          goal={{ title: achievedGoal.title, saved: achievedGoal.saved, target: achievedGoal.target }}
        />
      )}
      <CreateGoalModal
        isOpen={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onCreate={(name, target) => {
          store.addGoal(name, target)
          setShowCreateGoal(false)
        }}
      />
    </>
  )
}

export default App
