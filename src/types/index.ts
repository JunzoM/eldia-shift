export interface TimeBlock {
  id: string
  label: string
  short: string
  inH: number | null
  inM: number | null
  outH: number | null
  outM: number | null
  colorIdx: number
}

export interface Pattern {
  id: string
  label: string
  colorIdx: number
  days: [string, string, string, string, string, string, string]
  activeFrom?: string
}

export interface PeriodPattern {
  id: string
  label: string
  startDate: string
  endDate: string
  days: Record<string, string>
  colorIdx: number
}

export interface Staff {
  id: number
  no: number
  name: string
  deptId: string
  active: boolean
  joinDate: string
  leaveDate: string
  timeBlocks: TimeBlock[]
  patterns: Pattern[]
  activePatternId: string | null
  periodPatterns: PeriodPattern[]
}

export interface Department {
  id: string
  label: string
  colorIdx: number
}

export type DbStatus = 'init' | 'loading' | 'ok' | 'offline' | 'saving'

export interface EffectiveCell {
  inTime: string
  outTime: string
  blockId: string
  isOff: boolean
  auto: boolean
  isPeriod?: boolean
  patLabel?: string
}

export type CellData = Record<string, Partial<EffectiveCell>>

export type ViewMode = 'weekly' | 'monthly'
export type MainView = 'grid' | 'summary' | 'settings'
export type SettingsTab = 'staff' | 'global'

export interface PaletteEntry {
  color: string
  bg: string
}
