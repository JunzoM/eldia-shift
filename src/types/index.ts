export type DeptId = 'front' | 'kitchen' | 'make'
export type DbStatus = 'init' | 'loading' | 'saving' | 'ok' | 'offline'
export type ViewName = 'grid' | 'summary' | 'settings'
export type ViewMode = 'weekly' | 'monthly'
export type SettingsTab = 'staff' | 'global'
export type StaffSection = 'timeblocks' | 'patterns' | 'periodpatterns'

export interface PaletteEntry {
  color: string
  bg: string
}

export interface Dept {
  id: DeptId
  label: string
  colorIdx: number
}

export interface TimeBlock {
  id: string
  label: string
  short: string
  inH: number | null
  inM: number
  outH: number | null
  outM: number
  colorIdx: number
}

export interface WeeklyPattern {
  id: string
  label: string
  colorIdx: number
  days: string[]  // 7 elements for Sun-Sat (index 0=Sun)
  activeFrom?: string  // YYYY-MM-DD
}

export interface PeriodPattern {
  id: string
  label: string
  startDate: string
  endDate: string
  colorIdx: number
  days: Record<string, string>  // dateStr → blockId
}

export interface Staff {
  id: number
  no: number
  name: string
  deptId: DeptId
  active: boolean
  joinDate: string
  leaveDate: string
  timeBlocks: TimeBlock[]
  patterns: WeeklyPattern[]
  activePatternId: string | null
  periodPatterns: PeriodPattern[]
}

export interface CellEntry {
  inTime?: string
  outTime?: string
  blockId?: string
  isOff?: boolean
}

export type CellData = Record<string, CellEntry>

export interface EffectiveShift {
  inTime: string
  outTime: string
  blockId: string | null
  isOff: boolean
  auto: boolean
  isPeriod?: boolean
  patLabel?: string
}
