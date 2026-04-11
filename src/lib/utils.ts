import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Staff, TimeBlock, CellData, EffectiveShift } from '@/types'
import { OFF_BLOCKS } from '@/lib/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const uid = () => Math.random().toString(36).slice(2, 8)

export const fmtT = (h: number, m: number) =>
  `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`


export const calcH = (ih: number | null, im: number, oh: number | null, om: number): number => {
  if (ih == null || oh == null) return 0
  let d = (oh * 60 + om) - (ih * 60 + im)
  if (d <= 0) d += 1440
  return +(d / 60).toFixed(1)
}

export const calcNetH = (gross: number): number => {
  if (gross >= 6.5) return +(gross - 1).toFixed(1)
  if (gross >= 4.5) return +(gross - 0.5).toFixed(1)
  return gross
}

export const getDays = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

export const getDow = (y: number, m: number, d: number) => new Date(y, m, d).getDay()

export const getMondayOf = (date: Date): Date => {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  d.setHours(0, 0, 0, 0)
  return d
}

export const getWeekDates = (mon: Date): Date[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(d.getDate() + i)
    return d
  })

export const isToday = (d: Date) => d.toDateString() === new Date().toDateString()

export const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const cellKey = (staffId: number, d: Date): string =>
  `${staffId}|${toDateStr(d)}`

export function findBlock(
  id: string | null | undefined,
  staffTimeBlocks: TimeBlock[] = [],
  globalTemplates: TimeBlock[] = []
): TimeBlock | null {
  if (!id) return null
  return (
    staffTimeBlocks.find(b => b.id === id) ||
    globalTemplates.find(b => b.id === id) ||
    OFF_BLOCKS.find(b => b.id === id) ||
    null
  )
}

export function getEffective(
  s: Staff,
  dateObj: Date,
  cellData: CellData,
  globalTemplates: TimeBlock[]
): EffectiveShift | null {
  const key = cellKey(s.id, dateObj)
  if (cellData[key] !== undefined) {
    const entry = cellData[key]
    return {
      inTime: entry.inTime ?? '',
      outTime: entry.outTime ?? '',
      blockId: entry.blockId ?? null,
      isOff: entry.isOff ?? false,
      auto: false,
    }
  }

  const dStr = toDateStr(dateObj)

  // 期間限定パターンを優先
  const periodPats = s.periodPatterns || []
  const matchPeriod = periodPats.find(pp => {
    if (!pp.startDate || !pp.endDate) return false
    return dStr >= pp.startDate && dStr <= pp.endDate
  })
  if (matchPeriod) {
    const bid = matchPeriod.days[dStr]
    if (bid === undefined) return null
    if (!bid) return null
    const b = findBlock(bid, s.timeBlocks, globalTemplates)
    if (!b) return null
    if (b.inH === null) return { inTime: '', outTime: '', blockId: bid, isOff: true, auto: true, isPeriod: true }
    return { inTime: fmtT(b.inH, b.inM), outTime: fmtT(b.outH!, b.outM), blockId: bid, isOff: false, auto: true, isPeriod: true }
  }

  // 週間パターン: activeFrom が最も新しく dStr 以前のパターンを選ぶ
  let pat: typeof s.patterns[0] | null = null
  let bestFrom: string | null = null

  for (const p of s.patterns) {
    const from = p.activeFrom || null
    if (from && from > dStr) continue
    if (pat === null) { pat = p; bestFrom = from ?? null; continue }
    if (from === null && bestFrom !== null) continue
    if (from !== null && bestFrom === null) { pat = p; bestFrom = from; continue }
    if (from !== null && bestFrom !== null && from > bestFrom) { pat = p; bestFrom = from }
  }

  if (!pat || (!bestFrom && s.patterns.filter(p => !p.activeFrom).length > 1)) {
    if (s.activePatternId) {
      const ap = s.patterns.find(p => p.id === s.activePatternId)
      if (ap && (!ap.activeFrom || ap.activeFrom <= dStr)) pat = ap
    }
  }

  if (!pat) return null
  const bid = pat.days[dateObj.getDay()]
  if (!bid) return null
  const b = findBlock(bid, s.timeBlocks, globalTemplates)
  if (!b) return null
  if (b.inH === null) return { inTime: '', outTime: '', blockId: bid, isOff: true, auto: true, patLabel: pat.label }
  return { inTime: fmtT(b.inH, b.inM), outTime: fmtT(b.outH!, b.outM), blockId: bid, isOff: false, auto: true, patLabel: pat.label }
}
