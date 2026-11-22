#!/usr/bin/env python3
import os

filepath = r'c:\Users\Danil\Desktop\ИИ\TOLSFTI 2.0\src\store\useGoalStore.ts'

content = """import { create } from "zustand"
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

export type BadgeKind = 'icon' | 'emoji' | 'photo'

export interface GoalBadge {
  kind: BadgeKind
  value: string
}

export const DEFAULT_BADGE: GoalBadge = { kind: 'icon', value: 'Laptop' }

export interface Goal {
  id: string
  title: string
  target: number
  saved: number
  status: GoalStatus
  lastUpdated: number
  createdAt: number
  badge?: GoalBadge
}

interface GoalStoreState {
  monthlySalary: number
  goals: Goal[]
  lastUpdatedTimestamp: number
  tick: number
  completedGoalId: string | null
  settleNow: () => string | null
  setSalary: (amount: number) => void
  addGoal: (title: string, target: number, badge?: GoalBadge) => void
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
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('File rewritten successfully')