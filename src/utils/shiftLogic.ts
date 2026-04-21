import type { Staff, TimeBlock, CellData, EffectiveCell } from '@/types'
import { OFF_BLOCKS } from '@/constants/offBlocks'
import { fmtT } from './dateHelpers'

export function calcH(ih: number | null, im: number | null, oh: number | null, om: number | null): number {
  if (ih == null || im == null || oh == null || om == null) return 0
  let d = (oh * 60 + om) - (ih * 60 + im)
  if (d <= 0) d += 1440
  return +(d / 60).toFixed(1)
}

export function calcNetH(ih: number | null, im: number | null, oh: number | null, om: number | null): number {
  const raw = calcH(ih, im, oh, om)
  if (raw >= 6.5) return +(raw - 1).toFixed(1)
  if (raw >= 4.5) return +(raw - 0.5).toFixed(1)
  return raw
}

export function findBlock(
  id: string | null | undefined,
  staffTimeBlocks: TimeBlock[] = [],
  globalTemplates: TimeBlock[] = [],
): TimeBlock | null {
  if (!id) return null
  return (
    staffTimeBlocks.find(b => b.id === id) ??
    globalTemplates.find(b => b.id === id) ??
    OFF_BLOCKS.find(b => b.id === id) ??
    null
  )
}

export function cellKey(staffId: number, dateObj: Date): string {
  return `${staffId}|${dateObj.toISOString().slice(0, 10)}`
}

/**
 * セルの実効シフトを解決する純粋関数。
 * 優先度: 手動上書き > 期間パターン > 週次パターン（最新 activeFrom）> デフォルト activePatternId
 */
export function getEffective(
  s: Staff,
  dateObj: Date,
  cellData: CellData,
  globalTemplates: TimeBlock[],
): EffectiveCell | null {
  const key = cellKey(s.id, dateObj)

  // 手動上書き
  if (cellData[key] !== undefined) {
    return { ...cellData[key], auto: false } as EffectiveCell
  }

  // ローカル日付文字列（タイムゾーンずれ防止）
  const dStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

  // 期間限定パターン
  const periodPats = s.periodPatterns ?? []
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
    return { inTime: fmtT(b.inH, b.inM!), outTime: fmtT(b.outH!, b.outM!), blockId: bid, isOff: false, auto: true, isPeriod: true }
  }

  // 週間パターン: activeFrom が最も新しく dStr 以前のものを選ぶ
  let pat: typeof s.patterns[number] | null = null
  let bestFrom: string | null = null

  for (const p of s.patterns) {
    const from = p.activeFrom ?? null
    if (from && from > dStr) continue
    if (pat === null) { pat = p; bestFrom = from ?? null; continue }
    if (from === null && bestFrom !== null) continue
    if (from !== null && bestFrom === null) { pat = p; bestFrom = from; continue }
    if (from !== null && bestFrom !== null && from > bestFrom) { pat = p; bestFrom = from }
  }

  // activeFrom なしのパターンが複数ある場合は activePatternId で絞る
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
  return { inTime: fmtT(b.inH, b.inM!), outTime: fmtT(b.outH!, b.outM!), blockId: bid, isOff: false, auto: true, patLabel: pat.label }
}

export function isWorkingAtHour(s: Staff, dateObj: Date, hour: number, cellData: CellData, globalTemplates: TimeBlock[]): boolean {
  const eff = getEffective(s, dateObj, cellData, globalTemplates)
  if (!eff || eff.isOff || !eff.inTime || !eff.outTime) return false
  const [ih, im] = eff.inTime.split(':').map(Number)
  const [oh, om] = eff.outTime.split(':').map(Number)
  const startMin = ih * 60 + im
  const endMin = oh * 60 + om
  const hS = hour * 60
  const hE = (hour + 1) * 60
  return endMin > startMin
    ? startMin < hE && endMin > hS
    : startMin < hE || endMin > hS
}
