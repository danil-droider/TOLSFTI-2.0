import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { useGoalStore } from "./useGoalStore.ts"

const monthlySalary = 3000
const msPer30Days = 30 * 24 * 60 * 60 * 1000

const store = () => useGoalStore.getState()

beforeEach(() => {
  localStorage.clear()
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z").getTime())
  useGoalStore.setState({
    monthlySalary: 0,
    goals: [],
    lastUpdatedTimestamp: Date.now(),
    tick: 0,
    completedGoalId: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useGoalStore persistence & settlement", () => {
  it("stores monthlySalary and goals in localStorage via persist", () => {
    store().setSalary(monthlySalary)
    expect(store().monthlySalary).toBe(monthlySalary)
    expect(localStorage.getItem("goal-ticker-storage")).not.toBeNull()
  })

  it("setSalary settles earned progress under the old rate before changing salary", () => {
    store().setSalary(monthlySalary)
    const id = crypto.randomUUID()
    const now = Date.now()
    useGoalStore.setState({
      goals: [{ id, title: "A", target: 10000, saved: 0, status: "active", lastUpdated: now, createdAt: now }],
      lastUpdatedTimestamp: now,
    })
    vi.setSystemTime(now + msPer30Days) // +30 days
    store().setSalary(monthlySalary) // settles 30 days under salary -> ~3000 earned
    const g = store().getGoal(id)
    expect(g?.saved).toBeCloseTo(3000, 0)
    expect(store().monthlySalary).toBe(monthlySalary)
  })

  it("addGoal creates an idle goal; startGoal activates it", () => {
    store().setSalary(monthlySalary)
    store().addGoal("Vacation Fund", 5000)
    const created = store().goals.find((g) => g.title === "Vacation Fund")
    expect(created?.status).toBe("idle")
    expect(created?.saved).toBe(0)
    expect(created?.createdAt).toBe(Date.now())

    store().startGoal(created!.id)
    expect(store().getGoal(created!.id)?.status).toBe("active")
  })

  it("pauseGoal freezes progress; toggleSaving resumes then pauses", () => {
    store().setSalary(monthlySalary)
    store().addGoal("A", 1000)
    const id = store().goals[0].id
    store().startGoal(id)
    expect(store().getGoal(id)?.status).toBe("active")

    store().pauseGoal(id)
    expect(store().getGoal(id)?.status).toBe("paused")

    store().toggleSaving(id)
    expect(store().getGoal(id)?.status).toBe("active")

    store().toggleSaving(id)
    expect(store().getGoal(id)?.status).toBe("paused")
  })

  it("deleteGoal removes a goal", () => {
    store().setSalary(monthlySalary)
    store().addGoal("A", 1000)
    const created = store().goals[0]
    expect(created).toBeDefined()
    store().deleteGoal(created.id)
    expect(store().getGoal(created.id)).toBeUndefined()
  })

  it("equal splitting: two active goals each earn half over 30 days", () => {
    store().setSalary(monthlySalary)
    store().addGoal("A", 10000)
    store().addGoal("B", 10000)
    const goals = store().goals
    const a = goals[0]
    const b = goals[1]
    store().startGoal(a.id)
    store().startGoal(b.id)

    vi.setSystemTime(Date.now() + msPer30Days)
    store().setSalary(monthlySalary) // settle +30 days

    const sa = store().getGoal(a.id)?.saved ?? 0
    const sb = store().getGoal(b.id)?.saved ?? 0
    expect(sa).toBeCloseTo(monthlySalary / 2, 0)
    expect(sb).toBeCloseTo(monthlySalary / 2, 0)
  })

  it("cascade completion sets completedGoalId when a goal reaches target", () => {
    store().setSalary(monthlySalary)
    const id = crypto.randomUUID()
    const now = Date.now()
    useGoalStore.setState({
      goals: [{ id, title: "Small", target: 50, saved: 0, status: "active", lastUpdated: now, createdAt: now }],
      lastUpdatedTimestamp: now,
    })
    vi.setSystemTime(now + 86400000) // +1 day earns ~100 > 50 target
    store().setSalary(monthlySalary)
    expect(store().getGoal(id)?.status).toBe("completed")
    expect(store().completedGoalId).toBe(id)
  })

  it("acknowledgeCompleted clears completedGoalId", () => {
    useGoalStore.setState({ completedGoalId: "some-id" })
    store().acknowledgeCompleted()
    expect(store().completedGoalId).toBeNull()
  })

  it("settleNow commits offline catch-up earnings", () => {
    store().setSalary(monthlySalary)
    const id = crypto.randomUUID()
    const now = Date.now()
    useGoalStore.setState({
      goals: [{ id, title: "A", target: 10000, saved: 0, status: "active", lastUpdated: now, createdAt: now }],
      lastUpdatedTimestamp: now,
    })
    vi.setSystemTime(now + msPer30Days)
    store().settleNow()
    expect(store().getGoal(id)?.saved).toBeCloseTo(monthlySalary, 0)
  })
  it("addGoal adds exactly one goal per submission", () => {
    store().setSalary(monthlySalary)
    const beforeCount = store().goals.length
    store().addGoal("Vacation Fund", 5000)
    const goals = store().goals
    expect(goals.length).toBe(beforeCount + 1)
    const created = goals.find((g) => g.title === "Vacation Fund")
    expect(created).toBeDefined()
    expect(created?.target).toBe(5000)
    expect(created?.saved).toBe(0)
    expect(created?.status).toBe("idle")
    expect(created?.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(goals.filter((g) => g.title === "Vacation Fund")).toHaveLength(1)
  })

  it("addGoal creates distinct ids across submissions (one card per submission)", () => {
    store().setSalary(monthlySalary)
    store().addGoal("Goal A", 1000)
    store().addGoal("Goal B", 2000)
    const goals = store().goals
    expect(goals.length).toBe(2)
    const ids = goals.map((g) => g.id)
    expect(ids.filter((id, i) => ids.indexOf(id) === i).length).toBe(2)
    expect(goals.find((g) => g.title === "Goal A")?.status).toBe("idle")
    expect(goals.find((g) => g.title === "Goal B")?.status).toBe("idle")
  })
})

describe("useGoalStore derived reads", () => {
  it("goalRate returns 0 when goal is idle or paused", () => {
    store().setSalary(monthlySalary)
    store().addGoal("A", 1000)
    const id = store().goals[0].id
    expect(store().goalRate(id)).toBe(0)

    store().startGoal(id)
    expect(store().goalRate(id)).toBeGreaterThan(0)

    store().pauseGoal(id)
    expect(store().goalRate(id)).toBe(0)
  })

  it("goalDailyRate is rate * 24h and 0 when not active", () => {
    store().setSalary(monthlySalary)
    store().addGoal("A", 1000)
    const id = store().goals[0].id
    expect(store().goalDailyRate(id)).toBe(0)

    store().startGoal(id)
    expect(store().goalDailyRate(id)).toBeGreaterThan(0)

    store().pauseGoal(id)
    expect(store().goalDailyRate(id)).toBe(0)
  })

  it("goalPct and goalEtaLine reflect stored progress", () => {
    store().setSalary(monthlySalary)
    const id = crypto.randomUUID()
    const now = Date.now()
    useGoalStore.setState({
      goals: [{ id, title: "A", target: 200, saved: 100, status: "active", lastUpdated: now, createdAt: now }],
      lastUpdatedTimestamp: now,
    })
    expect(store().goalPct(id)).toBe(50)
    expect(typeof store().goalEtaLine(id)).toBe("string")
  })
})

describe("status normalization (defensive render guard)", () => {
  it("settleNow coerces a corrupted status to idle instead of leaving it invalid", () => {
    store().setSalary(monthlySalary)
    const id = crypto.randomUUID()
    const now = Date.now()
    // Simulate corrupted persisted state with an unrecognized status.
    useGoalStore.setState({
      goals: [{ id, title: "Bad", target: 1000, saved: 0, status: "corrupted_status" as any, lastUpdated: now, createdAt: now }],
      lastUpdatedTimestamp: now,
    })
    store().settleNow()
    expect(store().getGoal(id)?.status).toBe("idle")
  })

  it("settleNow coerces a null status to idle", () => {
    store().setSalary(monthlySalary)
    const id = crypto.randomUUID()
    const now = Date.now()
    useGoalStore.setState({
      goals: [{ id, title: "Null", target: 1000, saved: 0, status: null as any, lastUpdated: now, createdAt: now }],
      lastUpdatedTimestamp: now,
    })
    store().settleNow()
    expect(store().getGoal(id)?.status).toBe("idle")
  })
})

describe("goal badges (preset / emoji / photo)", () => {
  it("addGoal stores the selected badge and defaults to the preset Laptop icon", () => {
    store().setSalary(monthlySalary)
    const photoBadge = { kind: "photo" as const, value: "data:image/jpeg;base64,abc" }
    store().addGoal("Photo Goal", 1000, photoBadge)
    expect(store().goals[0]?.badge).toEqual(photoBadge)

    store().addGoal("No Badge Goal", 1000)
    expect(store().goals[1]?.badge).toEqual({ kind: "icon", value: "Laptop" })
  })

  it("badge round-trips through persisted localStorage", () => {
    store().setSalary(monthlySalary)
    const emojiBadge = { kind: "emoji" as const, value: "💻" }
    store().addGoal("Emoji Goal", 5000, emojiBadge)
    const raw = localStorage.getItem("goal-ticker-storage")
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw ?? "{}")
    // zustand persist may store the state directly or wrapped under `state`.
    const goals = parsed.goals ?? parsed.state?.goals ?? []
    expect(goals.length).toBeGreaterThan(0)
    expect(goals[0].badge).toEqual(emojiBadge)
  })
})

