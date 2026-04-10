import { create } from 'zustand'
import type { Staff, TimeBlock, CellData, DbStatus, ViewName, ViewMode, SettingsTab, DeptId, EffectiveShift, CellEntry } from '@/types'
import { INIT_STAFF, INIT_GLOBAL_TEMPLATES } from '@/lib/constants'
import { getMondayOf, cellKey, getEffective as getEffectiveUtil } from '@/lib/utils'
import { dbLoad, dbSave } from '@/lib/supabase'

interface ShiftState {
  // ── Data ──
  staff: Staff[]
  globalTemplates: TimeBlock[]
  cellData: CellData
  dbStatus: DbStatus

  // ── UI navigation ──
  view: ViewName
  viewMode: ViewMode
  weekStart: Date
  year: number
  month: number
  settingsTab: SettingsTab
  openStaffId: number | null
  showInactive: boolean
  showPrint: boolean
  showManual: boolean
  addingStaff: boolean
  loadFailed: boolean
  newStaff: { name: string; deptId: DeptId }
  dragOverId: number | null

  // ── Actions: data ──
  setStaff: (staff: Staff[]) => void
  updateStaff: (id: number, fn: (s: Staff) => Staff) => void
  addStaff: () => void
  deleteStaff: (id: number) => void
  moveStaff: (id: number, dir: 1 | -1) => void
  handleDrop: (targetId: number, fromId: number) => void

  setGlobalTemplates: (templates: TimeBlock[]) => void

  setCellEntry: (staffId: number, dateObj: Date, entry: CellEntry) => void
  clearCell: (staffId: number, dateObj: Date) => void

  // ── Actions: UI ──
  setDbStatus: (s: DbStatus) => void
  setView: (v: ViewName) => void
  setViewMode: (v: ViewMode) => void
  prevWeek: () => void
  nextWeek: () => void
  prevMonth: () => void
  nextMonth: () => void
  setSettingsTab: (t: SettingsTab) => void
  setOpenStaffId: (id: number | null) => void
  setShowInactive: (v: boolean) => void
  setShowPrint: (v: boolean) => void
  setShowManual: (v: boolean) => void
  setAddingStaff: (v: boolean) => void
  setNewStaff: (s: { name: string; deptId: DeptId }) => void
  setDragOverId: (id: number | null) => void

  // ── DB ──
  loadFromDb: () => Promise<void>
  saveToDb: () => Promise<void>

  // ── Selector ──
  getEffective: (s: Staff, dateObj: Date) => EffectiveShift | null
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  // ── Initial state ──
  staff: INIT_STAFF,
  globalTemplates: INIT_GLOBAL_TEMPLATES,
  cellData: {},
  dbStatus: 'init',

  view: 'grid',
  viewMode: 'weekly',
  weekStart: getMondayOf(new Date()),
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  settingsTab: 'staff',
  openStaffId: null,
  showInactive: false,
  showPrint: false,
  showManual: false,
  addingStaff: false,
  loadFailed: false,
  newStaff: { name: '', deptId: 'front' },
  dragOverId: null,

  // ── Data actions ──
  setStaff: staff => set({ staff }),
  updateStaff: (id, fn) =>
    set(state => ({ staff: state.staff.map(s => s.id === id ? fn(s) : s) })),

  addStaff: () => {
    const { newStaff, staff } = get()
    if (!newStaff.name.trim()) return
    const maxId = staff.reduce((m, s) => Math.max(m, s.id), 400)
    const maxNo = staff.filter(s => s.deptId === newStaff.deptId).reduce((m, s) => Math.max(m, s.no), 0)
    const ns: Staff = {
      id: maxId + 1, no: maxNo + 1,
      name: newStaff.name.trim(), deptId: newStaff.deptId,
      active: true, joinDate: '', leaveDate: '',
      timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [],
    }
    set(state => ({
      staff: [...state.staff, ns],
      newStaff: { name: '', deptId: 'front' },
      addingStaff: false,
    }))
  },

  deleteStaff: id =>
    set(state => ({ staff: state.staff.filter(s => s.id !== id) })),

  moveStaff: (id, dir) =>
    set(state => {
      const s = state.staff.find(x => x.id === id)
      if (!s) return state
      const deptStaff = state.staff.filter(x => x.deptId === s.deptId).sort((a, b) => a.no - b.no)
      const idx = deptStaff.findIndex(x => x.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= deptStaff.length) return state
      const newOrder = [...deptStaff];
      [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
      const noMap: Record<number, number> = {}
      newOrder.forEach((x, i) => noMap[x.id] = i + 1)
      return { staff: state.staff.map(x => x.deptId === s.deptId ? { ...x, no: noMap[x.id] } : x) }
    }),

  handleDrop: (targetId, fromId) => {
    if (!fromId || fromId === targetId) { set({ dragOverId: null }); return }
    set(state => {
      const from = state.staff.find(x => x.id === fromId)
      const to = state.staff.find(x => x.id === targetId)
      if (!from || !to || from.deptId !== to.deptId) return { dragOverId: null }
      const deptStaff = state.staff.filter(x => x.deptId === from.deptId).sort((a, b) => a.no - b.no)
      const fromIdx = deptStaff.findIndex(x => x.id === fromId)
      const toIdx = deptStaff.findIndex(x => x.id === targetId)
      const newOrder = [...deptStaff]
      newOrder.splice(fromIdx, 1)
      newOrder.splice(toIdx, 0, from)
      const noMap: Record<number, number> = {}
      newOrder.forEach((x, i) => noMap[x.id] = i + 1)
      return {
        staff: state.staff.map(x => x.deptId === from.deptId ? { ...x, no: noMap[x.id] } : x),
        dragOverId: null,
      }
    })
  },

  setGlobalTemplates: globalTemplates => set({ globalTemplates }),

  setCellEntry: (staffId, dateObj, entry) =>
    set(state => ({
      cellData: { ...state.cellData, [cellKey(staffId, dateObj)]: entry },
    })),

  clearCell: (staffId, dateObj) =>
    set(state => {
      const n = { ...state.cellData }
      delete n[cellKey(staffId, dateObj)]
      return { cellData: n }
    }),

  // ── UI actions ──
  setDbStatus: dbStatus => set({ dbStatus }),
  setView: view => set({ view, addingStaff: false }),
  setViewMode: viewMode => set({ viewMode }),

  prevWeek: () => set(state => {
    const d = new Date(state.weekStart); d.setDate(d.getDate() - 7); return { weekStart: d }
  }),
  nextWeek: () => set(state => {
    const d = new Date(state.weekStart); d.setDate(d.getDate() + 7); return { weekStart: d }
  }),
  prevMonth: () => set(state => {
    if (state.month === 0) return { year: state.year - 1, month: 11 }
    return { month: state.month - 1 }
  }),
  nextMonth: () => set(state => {
    if (state.month === 11) return { year: state.year + 1, month: 0 }
    return { month: state.month + 1 }
  }),

  setSettingsTab: settingsTab => set({ settingsTab }),
  setOpenStaffId: openStaffId => set({ openStaffId }),
  setShowInactive: showInactive => set({ showInactive }),
  setShowPrint: showPrint => set({ showPrint }),
  setShowManual: showManual => set({ showManual }),
  setAddingStaff: addingStaff => set({ addingStaff }),
  setNewStaff: newStaff => set({ newStaff }),
  setDragOverId: dragOverId => set({ dragOverId }),

  // ── DB ──
  loadFromDb: async () => {
    set({ dbStatus: 'loading' })
    try {
      const [staffData, templatesData, cellDataData] = await Promise.all([
        dbLoad<Staff[]>('staff'),
        dbLoad<TimeBlock[]>('globalTemplates'),
        dbLoad<CellData>('cellData'),
      ])
      set({
        staff: staffData ?? INIT_STAFF,
        globalTemplates: templatesData ?? INIT_GLOBAL_TEMPLATES,
        cellData: cellDataData ?? {},
        dbStatus: 'ok',
      })
    } catch {
      // loadFailed フラグで auto-save による初期データ上書きを防止
      set({ dbStatus: 'offline', loadFailed: true })
    }
  },

  saveToDb: async () => {
    const { staff, globalTemplates, cellData, loadFailed } = get()
    if (loadFailed) return  // ロード失敗時は保存しない
    set({ dbStatus: 'saving' })
    try {
      await Promise.all([
        dbSave('staff', staff),
        dbSave('globalTemplates', globalTemplates),
        dbSave('cellData', cellData),
      ])
      set({ dbStatus: 'ok' })
    } catch {
      set({ dbStatus: 'offline' })
    }
  },

  // ── Selector ──
  getEffective: (s, dateObj) => {
    const { cellData, globalTemplates } = get()
    return getEffectiveUtil(s, dateObj, cellData, globalTemplates)
  },
}))
