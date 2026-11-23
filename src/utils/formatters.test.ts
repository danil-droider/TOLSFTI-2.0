/// <reference types="vitest" />

import { describe, expect, it } from 'vitest'
import { formatDate, formatFinishDate } from './formatters.ts'

describe('formatDate / formatFinishDate', () => {
  const dayMonthTime = /^\d{1,2} [A-Za-z]+, \d{2}:\d{2}$/

  it('formats a timestamp without year as "day Month, HH:mm"', () => {
    // Fixed local time: 2026-11-22 14:30 local
    const ts = new Date('2026-11-22T14:30:00').getTime()
    expect(formatDate(ts)).toMatch(dayMonthTime)
    expect(formatDate(ts)).not.toMatch(/\d{4}/)
    expect(formatFinishDate(ts)).toMatch(dayMonthTime)
    expect(formatFinishDate(ts)).not.toMatch(/\d{4}/)
  })

  it('formats both Started and Expected Finish identically (with time)', () => {
    const ts = new Date('2026-01-05T09:05:00').getTime()
    expect(formatDate(ts)).toBe(formatFinishDate(ts))
    expect(formatDate(ts)).toContain(', 09:05')
  })

  it('returns "--" for invalid timestamps', () => {
    expect(formatDate(NaN)).toBe('--')
    expect(formatDate(Infinity)).toBe('--')
    expect(formatFinishDate(NaN)).toBe('--')
    expect(formatFinishDate(Infinity)).toBe('--')
  })
})
