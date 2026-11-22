/// <reference types="vitest" />
import { describe, expect, it, beforeEach } from "vitest"
import { renderToString } from "react-dom/server"
import React from "react"
import { useGoalStore } from "../store/useGoalStore.ts"
import DashboardScreen from "./DashboardScreen.tsx"
import GoalDetailScreen from "./GoalDetailScreen.tsx"

const baseGoal = (overrides: Record<string, unknown>) => ({
  id: "g1",
  title: "Test Goal",
  target: 1000,
  saved: 200,
  status: "active" as const,
  lastUpdated: Date.now(),
  createdAt: Date.now(),
  ...overrides,
})

function setStore(goals: unknown[]): void {
  useGoalStore.setState({
    monthlySalary: 3000,
    goals: goals as any,
    lastUpdatedTimestamp: Date.now(),
    tick: 0,
    completedGoalId: null,
  } as any)
}

describe("render guard (corrupted status)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders DashboardScreen with a valid status without throwing", () => {
    setStore([baseGoal({ status: "active" })])
    expect(() =>
      renderToString(
        React.createElement(DashboardScreen, {
          onGoalSelect: () => {},
          onSetSalary: () => {},
          onCreateGoal: () => {},
        })
      )
    ).not.toThrow()
  })

  it("renders DashboardScreen with a corrupted status without throwing", () => {
    setStore([baseGoal({ status: "corrupted_status" })])
    expect(() =>
      renderToString(
        React.createElement(DashboardScreen, {
          onGoalSelect: () => {},
          onSetSalary: () => {},
          onCreateGoal: () => {},
        })
      )
    ).not.toThrow()
  })

  it("renders GoalDetailScreen with a corrupted/null status without throwing", () => {
    setStore([baseGoal({ status: null })])
    expect(() =>
      renderToString(React.createElement(GoalDetailScreen, { goalId: "g1", onBack: () => {} }))
    ).not.toThrow()
  })
})

describe("render guard (goal badges)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const badgeGoal = (badge: { kind: "icon" | "emoji" | "photo"; value: string }) =>
    baseGoal({ title: "Badge Goal", badge })

  it("renders DashboardScreen with a preset icon badge without throwing", () => {
    setStore([badgeGoal({ kind: "icon", value: "Laptop" })])
    expect(() =>
      renderToString(
        React.createElement(DashboardScreen, {
          onGoalSelect: () => {},
          onSetSalary: () => {},
          onCreateGoal: () => {},
        })
      )
    ).not.toThrow()
  })

  it("renders DashboardScreen with an emoji badge without throwing", () => {
    setStore([badgeGoal({ kind: "emoji", value: "💻" })])
    expect(() =>
      renderToString(
        React.createElement(DashboardScreen, {
          onGoalSelect: () => {},
          onSetSalary: () => {},
          onCreateGoal: () => {},
        })
      )
    ).not.toThrow()
  })

  it("renders DashboardScreen with a photo badge without throwing", () => {
    setStore([badgeGoal({ kind: "photo", value: "data:image/jpeg;base64,abc" })])
    expect(() =>
      renderToString(
        React.createElement(DashboardScreen, {
          onGoalSelect: () => {},
          onSetSalary: () => {},
          onCreateGoal: () => {},
        })
      )
    ).not.toThrow()
  })

  it("renders DashboardScreen with a legacy goal missing the badge field without throwing", () => {
    setStore([{ ...baseGoal({}), badge: undefined } as any])
    expect(() =>
      renderToString(
        React.createElement(DashboardScreen, {
          onGoalSelect: () => {},
          onSetSalary: () => {},
          onCreateGoal: () => {},
        })
      )
    ).not.toThrow()
  })
})
