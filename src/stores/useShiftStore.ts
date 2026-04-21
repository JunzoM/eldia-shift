import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { CellData, DbStatus } from '@/types'
import { dbLoad, dbSave } from '@/lib/supabase'
import { cellKey } from '@/utils/shiftLogic'
import { INIT_STAFF } from '@/constants/initialData'
import { INIT_GLOBAL_TEMPLATES } from '@/constants/initialData'
import { useStaffStore } from './useStaffStore'
import { useTemplateStore } from './useTemplateStore'

export const useShiftStore = defineStore('shift', () => {
  const cellData = ref<CellData>({})
  const dbStatus = ref<DbStatus>('init')

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let watcherReady = false

  async function loadAll() {
    dbStatus.value = 'loading'
    const staffStore = useStaffStore()
    const templateStore = useTemplateStore()

    try {
      const [staffData, templatesData, cellDataData] = await Promise.all([
        dbLoad('staff'),
        dbLoad('globalTemplates'),
        dbLoad('cellData'),
      ])

      if (staffData) staffStore.setStaff(staffData as typeof INIT_STAFF)
      if (templatesData) templateStore.setGlobalTemplates(templatesData as typeof INIT_GLOBAL_TEMPLATES)
      if (cellDataData) cellData.value = cellDataData as CellData

      dbStatus.value = 'ok'
    } catch {
      dbStatus.value = 'offline'
    }

    // 初期ロード完了後にウォッチャーを有効化
    watcherReady = true
  }

  function setupWatcher() {
    const staffStore = useStaffStore()
    const templateStore = useTemplateStore()

    watch(
      [() => staffStore.staff, () => templateStore.globalTemplates, cellData],
      () => {
        if (!watcherReady) return
        if (dbStatus.value === 'loading' || dbStatus.value === 'init' || dbStatus.value === 'offline') return
        if (saveTimer) clearTimeout(saveTimer)
        dbStatus.value = 'saving'
        saveTimer = setTimeout(async () => {
          await Promise.all([
            dbSave('staff', staffStore.staff),
            dbSave('globalTemplates', templateStore.globalTemplates),
            dbSave('cellData', cellData.value),
          ])
          dbStatus.value = 'ok'
        }, 1200)
      },
      { deep: true },
    )
  }

  function setCellData(staffId: number, dateObj: Date, value: Partial<CellData[string]>) {
    const key = cellKey(staffId, dateObj)
    cellData.value = { ...cellData.value, [key]: value }
  }

  function clearCell(staffId: number, dateObj: Date) {
    const key = cellKey(staffId, dateObj)
    const next = { ...cellData.value }
    delete next[key]
    cellData.value = next
  }

  return { cellData, dbStatus, loadAll, setupWatcher, setCellData, clearCell }
})
