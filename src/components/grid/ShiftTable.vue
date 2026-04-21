<template>
  <div class="overflow-auto flex-1 scrollbar-hide">
    <table class="border-collapse text-xs" style="table-layout: fixed; min-width: max-content;">
      <!-- ヘッダー行 -->
      <thead>
        <tr>
          <th class="sticky left-0 z-[102] bg-brand-surface border border-brand-border text-center font-bold text-brand-muted w-6 min-w-[24px]">#</th>
          <th class="sticky z-[101] bg-brand-surface border border-brand-border text-left font-bold text-brand-text px-1.5 w-20 min-w-[80px]" style="left: 24px;">名前</th>
          <th
            v-for="(d, i) in dates"
            :key="i"
            class="border border-brand-border text-center font-bold px-1"
            :class="[
              isWeekly ? 'min-w-[90px]' : 'min-w-[36px]',
              isToday(d) ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' : 'bg-brand-surface text-brand-muted',
              d.getDay() === 0 ? 'text-red-500' : '',
              d.getDay() === 6 ? 'text-blue-500' : '',
            ]"
          >
            <div>{{ d.getMonth() + 1 }}/{{ d.getDate() }}</div>
            <div class="text-[9px]">{{ JP_WD[d.getDay()] }}</div>
          </th>
        </tr>
      </thead>

      <tbody>
        <template v-for="dept in staffByDept" :key="dept.id">
          <!-- 部門ヘッダー -->
          <tr>
            <td
              colspan="2"
              class="sticky left-0 z-[100] bg-brand-surface2 border border-brand-border font-bold text-[10px] text-brand-muted px-2 py-1 tracking-widest"
              :style="{ color: PALETTE[dept.colorIdx].color }"
            >── {{ dept.label }} ──</td>
            <td
              v-for="(d, i) in dates"
              :key="i"
              class="border border-brand-border bg-brand-surface2"
              :class="[isWeekly ? 'min-w-[90px]' : 'min-w-[36px]', 'h-[18px]']"
            />
          </tr>

          <!-- スタッフ行 -->
          <tr
            v-for="s in dept.members"
            :key="s.id"
            :class="ui.dragOverId === s.id ? 'outline outline-2 outline-brand-accent' : ''"
            draggable="true"
            @dragstart="onDragStart(s.id)"
            @dragover.prevent="ui.dragOverId = s.id"
            @dragleave="ui.dragOverId = null"
            @drop="onDrop(s.id)"
          >
            <td class="sticky left-0 z-[5] bg-brand-surface border border-brand-border text-center text-brand-muted font-mono text-[10px] w-6 cursor-grab active:cursor-grabbing">{{ s.no }}</td>
            <td
              class="sticky z-[4] bg-brand-surface border border-brand-border px-1.5 font-bold text-brand-text truncate"
              style="left: 24px;"
            >
              <button
                v-if="!ui.locked"
                class="text-left w-full hover:text-brand-accent transition-colors truncate"
                @click.stop="openStaffSettings(s.id)"
              >{{ s.name }}</button>
              <span v-else class="truncate">{{ s.name }}</span>
            </td>
            <ShiftCell
              v-for="(d, i) in dates"
              :key="i"
              :staff="s"
              :dateObj="d"
              :globalTemplates="globalTemplates"
              :locked="ui.locked"
              :isWeekly="isWeekly"
            />
          </tr>

          <!-- 時間帯別人数行 -->
          <tr v-if="ui.hourlyOpenDepts[dept.id]">
            <td colspan="2" class="sticky left-0 z-[5] bg-brand-surface border border-brand-border text-[9px] text-brand-muted px-1">時間帯</td>
            <td
              v-for="(d, i) in dates"
              :key="i"
              class="border border-brand-border bg-brand-surface p-0"
              :class="isWeekly ? 'min-w-[90px]' : 'min-w-[36px]'"
            >
              <div class="flex flex-wrap gap-px p-0.5">
                <span
                  v-for="h in HOURS"
                  :key="h"
                  class="text-[8px] font-mono px-0.5 rounded"
                  :class="hourlyCount(dept, d, h) > 0 ? 'bg-brand-accent/20 text-brand-accent font-bold' : 'text-brand-muted'"
                >{{ h }}:{{ hourlyCount(dept, d, h) }}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td
              colspan="2"
              class="sticky left-0 z-[4] border border-brand-border bg-brand-surface"
            >
              <button
                class="w-full text-[9px] text-brand-muted hover:text-brand-accent transition-colors py-0.5 px-1"
                @click="ui.hourlyOpenDepts[dept.id] = !ui.hourlyOpenDepts[dept.id]"
              >{{ ui.hourlyOpenDepts[dept.id] ? '▲ 閉じる' : '▼ 時間帯別' }}</button>
            </td>
            <td v-for="(_, i) in dates" :key="i" class="border border-brand-border bg-brand-surface h-[18px]" />
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TimeBlock } from '@/types'
import { useUIStore } from '@/stores/useUIStore'
import { useStaffStore } from '@/stores/useStaffStore'
import { useShiftStore } from '@/stores/useShiftStore'
import { PALETTE } from '@/constants/palette'
import { JP_WD, isToday } from '@/utils/dateHelpers'
import { isWorkingAtHour } from '@/utils/shiftLogic'
import ShiftCell from './ShiftCell.vue'

const props = defineProps<{ dates: Date[]; globalTemplates: TimeBlock[]; isWeekly: boolean }>()

const ui = useUIStore()
const staffStore = useStaffStore()
const shift = useShiftStore()

const staffByDept = computed(() =>
  staffStore.staffByDept(ui.showInactive, ui.year, ui.month)
)

const HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5,6,7,8]

let dragFromId: number | null = null

function onDragStart(id: number) {
  dragFromId = id
}

function onDrop(targetId: number) {
  if (dragFromId && dragFromId !== targetId) {
    staffStore.reorderByDrop(dragFromId, targetId)
  }
  dragFromId = null
  ui.dragOverId = null
}

function openStaffSettings(id: number) {
  ui.openStaffId = id
  ui.mainView = 'settings'
  ui.settingsTab = 'staff'
}

function hourlyCount(dept: { members: typeof staffByDept.value[number]['members'] }, d: Date, hour: number): number {
  return dept.members.filter(s => isWorkingAtHour(s, d, hour, shift.cellData, props.globalTemplates)).length
}
</script>
