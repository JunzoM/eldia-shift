<template>
  <div class="flex-1 overflow-y-auto p-4">
    <div class="text-sm font-bold text-brand-text mb-3">{{ ui.monthLabel }} 集計</div>

    <template v-for="dept in deptSummaries" :key="dept.id">
      <div class="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" :style="{ color: PALETTE[dept.colorIdx].color }">
        ── {{ dept.label }} ──
      </div>
      <div class="overflow-x-auto mb-4">
        <table class="text-xs w-full border-collapse">
          <thead>
            <tr>
              <th class="border border-brand-border bg-brand-surface2 px-2 py-1 text-left font-bold text-brand-muted">名前</th>
              <th class="border border-brand-border bg-brand-surface2 px-2 py-1 text-center font-bold text-brand-muted w-14">勤務日数</th>
              <th class="border border-brand-border bg-brand-surface2 px-2 py-1 text-center font-bold text-brand-muted w-14">総時間</th>
              <th class="border border-brand-border bg-brand-surface2 px-2 py-1 text-center font-bold text-brand-muted w-16">実働(控除)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in dept.rows" :key="row.id" class="hover:bg-brand-surface2 transition-colors">
              <td class="border border-brand-border px-2 py-1 font-medium text-brand-text">{{ row.name }}</td>
              <td class="border border-brand-border px-2 py-1 text-center font-mono text-brand-text">{{ row.workDays }}</td>
              <td class="border border-brand-border px-2 py-1 text-center font-mono text-brand-text">{{ row.totalH }}h</td>
              <td class="border border-brand-border px-2 py-1 text-center font-mono text-brand-text">{{ row.netH }}h</td>
            </tr>
            <tr class="bg-brand-surface2 font-bold">
              <td class="border border-brand-border px-2 py-1 text-brand-muted">合計</td>
              <td class="border border-brand-border px-2 py-1 text-center font-mono text-brand-text">{{ dept.totalDays }}</td>
              <td class="border border-brand-border px-2 py-1 text-center font-mono text-brand-text">{{ dept.totalH }}h</td>
              <td class="border border-brand-border px-2 py-1 text-center font-mono text-brand-text">{{ dept.totalNetH }}h</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { useStaffStore } from '@/stores/useStaffStore'
import { useTemplateStore } from '@/stores/useTemplateStore'
import { useShiftStore } from '@/stores/useShiftStore'
import { PALETTE } from '@/constants/palette'
import { getEffective, calcNetH } from '@/utils/shiftLogic'

const ui = useUIStore()
const staffStore = useStaffStore()
const templateStore = useTemplateStore()
const shift = useShiftStore()

const deptSummaries = computed(() => {
  const dates = ui.monthDates

  return staffStore.depts.map(dept => {
    const members = staffStore.staffByDept(ui.showInactive, ui.year, ui.month)
      .find(d => d.id === dept.id)?.members ?? []

    const rows = members.map(s => {
      let workDays = 0
      let totalH = 0
      let netH = 0

      for (const d of dates) {
        const eff = getEffective(s, d, shift.cellData, templateStore.globalTemplates)
        if (!eff || eff.isOff) continue
        if (!eff.inTime || !eff.outTime) continue

        workDays++
        const [ih, im] = eff.inTime.split(':').map(Number)
        const [oh, om] = eff.outTime.split(':').map(Number)

        const raw = (oh * 60 + om - (ih * 60 + im) + 1440) % 1440 / 60
        totalH += raw
        netH += calcNetH(ih, im, oh, om)
      }

      return {
        id: s.id,
        name: s.name,
        workDays,
        totalH: +totalH.toFixed(1),
        netH: +netH.toFixed(1),
      }
    })

    return {
      ...dept,
      rows,
      totalDays: rows.reduce((s, r) => s + r.workDays, 0),
      totalH: +rows.reduce((s, r) => s + r.totalH, 0).toFixed(1),
      totalNetH: +rows.reduce((s, r) => s + r.netH, 0).toFixed(1),
    }
  })
})
</script>
