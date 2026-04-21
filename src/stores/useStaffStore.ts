import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Staff } from '@/types'
import { INIT_STAFF } from '@/constants/initialData'
import { INIT_DEPTS } from '@/constants/departments'
import { uid } from '@/utils/dateHelpers'

let nextId = 400

export const useStaffStore = defineStore('staff', () => {
  const staff = ref<Staff[]>(INIT_STAFF.map(s => ({ ...s })))
  const depts = ref([...INIT_DEPTS])

  function setStaff(newStaff: Staff[]) {
    staff.value = newStaff
    const maxId = newStaff.reduce((m, s) => Math.max(m, s.id), 0)
    if (maxId >= nextId) nextId = maxId + 1
  }

  function visibleStaff(showInactive: boolean, year: number, month: number): Staff[] {
    return staff.value.filter(s => {
      if (showInactive) return true
      if (!s.leaveDate) return s.active
      const ld = new Date(s.leaveDate)
      const leaveYear = ld.getFullYear()
      const leaveMonth = ld.getMonth()
      if (year < leaveYear) return true
      if (year === leaveYear && month <= leaveMonth) return true
      return false
    })
  }

  function staffByDept(showInactive: boolean, year: number, month: number) {
    const visible = visibleStaff(showInactive, year, month)
    return depts.value.map(d => ({
      ...d,
      members: [...visible.filter(s => s.deptId === d.id)].sort((a, b) => a.no - b.no),
    }))
  }

  function addStaff(name: string, deptId: string) {
    const maxNo = staff.value.filter(s => s.deptId === deptId).reduce((m, s) => Math.max(m, s.no), 0)
    staff.value = [
      ...staff.value,
      {
        id: nextId++, no: maxNo + 1, name: name.trim(), deptId,
        active: true, joinDate: '', leaveDate: '',
        timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [],
      },
    ]
  }

  function updateStaff(id: number, updater: (s: Staff) => Staff) {
    staff.value = staff.value.map(s => s.id === id ? updater(s) : s)
  }

  function deleteStaff(id: number) {
    const s = staff.value.find(x => x.id === id)
    if (!s) return
    const deptStaff = staff.value.filter(x => x.deptId === s.deptId && x.id !== id).sort((a, b) => a.no - b.no)
    const noMap: Record<number, number> = {}
    deptStaff.forEach((x, i) => { noMap[x.id] = i + 1 })
    staff.value = staff.value.filter(x => x.id !== id).map(x => x.deptId === s.deptId ? { ...x, no: noMap[x.id] ?? x.no } : x)
  }

  function moveStaff(id: number, dir: 1 | -1) {
    const s = staff.value.find(x => x.id === id)
    if (!s) return
    const deptStaff = staff.value.filter(x => x.deptId === s.deptId).sort((a, b) => a.no - b.no)
    const idx = deptStaff.findIndex(x => x.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= deptStaff.length) return
    const newOrder = [...deptStaff];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
    const noMap: Record<number, number> = {}
    newOrder.forEach((x, i) => { noMap[x.id] = i + 1 })
    staff.value = staff.value.map(x => x.deptId === s.deptId ? { ...x, no: noMap[x.id] } : x)
  }

  function reorderByDrop(fromId: number, targetId: number) {
    const from = staff.value.find(x => x.id === fromId)
    const to = staff.value.find(x => x.id === targetId)
    if (!from || !to || from.deptId !== to.deptId) return
    const deptStaff = staff.value.filter(x => x.deptId === from.deptId).sort((a, b) => a.no - b.no)
    const fromIdx = deptStaff.findIndex(x => x.id === fromId)
    const toIdx = deptStaff.findIndex(x => x.id === targetId)
    const newOrder = [...deptStaff]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, from)
    const noMap: Record<number, number> = {}
    newOrder.forEach((x, i) => { noMap[x.id] = i + 1 })
    staff.value = staff.value.map(x => x.deptId === from.deptId ? { ...x, no: noMap[x.id] } : x)
  }

  return {
    staff, depts,
    setStaff, visibleStaff, staffByDept,
    addStaff, updateStaff, deleteStaff, moveStaff, reorderByDrop,
  }
})
