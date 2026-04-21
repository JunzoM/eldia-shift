import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ViewMode, MainView, SettingsTab } from '@/types'
import { getMondayOf, getWeekDates, getDays, toLocalDateStr, parseLocalDate } from '@/utils/dateHelpers'

export const useUIStore = defineStore('ui', () => {
  const now = new Date()

  const viewMode = ref<ViewMode>('weekly')
  const mainView = ref<MainView>('grid')
  const settingsTab = ref<SettingsTab>('staff')
  const openStaffId = ref<number | null>(null)
  const staffSettingSection = ref<'timeblocks' | 'patterns' | 'periodpatterns'>('timeblocks')
  const showInactive = ref(false)
  const locked = ref(true)
  const showPrint = ref(false)
  const showManual = ref(false)
  const addingStaff = ref(false)
  const hourlyOpenDepts = ref<Record<string, boolean>>({})
  const dragOverId = ref<number | null>(null)

  const weekStart = ref<Date>(getMondayOf(now))
  const year = ref(now.getFullYear())
  const month = ref(now.getMonth())

  const weekDates = computed(() => getWeekDates(weekStart.value))

  const monthDates = computed(() => {
    const days = getDays(year.value, month.value)
    return Array.from({ length: days }, (_, i) => {
      return parseLocalDate(`${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)
    })
  })

  const weekLabel = computed(() => {
    const dates = weekDates.value
    const s = dates[0]
    const e = dates[6]
    return `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日〜${e.getMonth() + 1}月${e.getDate()}日`
  })

  const monthLabel = computed(() => `${year.value}年${month.value + 1}月`)

  function prevWeek() {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() - 7)
    weekStart.value = d
  }

  function nextWeek() {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + 7)
    weekStart.value = d
  }

  function prevMonth() {
    if (month.value === 0) { year.value--; month.value = 11 }
    else month.value--
  }

  function nextMonth() {
    if (month.value === 11) { year.value++; month.value = 0 }
    else month.value++
  }

  function toggleLock() {
    locked.value = !locked.value
  }

  function goToday() {
    const t = new Date()
    weekStart.value = getMondayOf(t)
    year.value = t.getFullYear()
    month.value = t.getMonth()
  }

  return {
    viewMode, mainView, settingsTab, openStaffId, staffSettingSection,
    showInactive, locked, showPrint, showManual, addingStaff,
    hourlyOpenDepts, dragOverId,
    weekStart, year, month,
    weekDates, monthDates, weekLabel, monthLabel,
    prevWeek, nextWeek, prevMonth, nextMonth, toggleLock, goToday,
  }
})
