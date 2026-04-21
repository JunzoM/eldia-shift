<template>
  <td
    class="border border-brand-border text-center align-middle relative select-none"
    :class="[
      isWeekly ? 'min-w-[90px] h-[52px]' : 'min-w-[36px] h-[42px]',
      isAfterLeave ? 'bg-brand-surface2 opacity-40' : 'bg-brand-surface',
      !locked && !isAfterLeave ? 'cursor-pointer hover:brightness-95' : '',
    ]"
    @click="openPicker"
  >
    <!-- セル内容 -->
    <template v-if="eff">
      <div
        v-if="!eff.isOff"
        class="flex flex-col items-center justify-center h-full px-0.5"
        :style="{ background: cellBg, color: cellColor }"
      >
        <span class="font-bold leading-none" :class="isWeekly ? 'text-[11px]' : 'text-[9px]'">{{ blockShort }}</span>
        <span v-if="isWeekly" class="font-mono leading-none text-[9px] mt-0.5">{{ eff.inTime }}</span>
        <span v-if="isWeekly" class="font-mono leading-none text-[9px] opacity-75">{{ eff.outTime }}</span>
      </div>
      <div
        v-else
        class="flex items-center justify-center h-full font-bold"
        :class="isWeekly ? 'text-[11px]' : 'text-[9px]'"
        :style="{ background: cellBg, color: cellColor }"
      >{{ blockShort }}</div>
    </template>
    <!-- 手動上書きインジケーター -->
    <div v-if="isManual" class="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-400 rounded-bl" />

    <!-- ピッカー -->
    <CellPicker
      v-if="pickerOpen"
      :staff="staff"
      :dateObj="dateObj"
      :globalTemplates="globalTemplates"
      :effectiveBlockId="eff?.blockId"
      @select="onSelect"
      @clear="onClear"
      @close="pickerOpen = false"
      @applyTime="onApplyTime"
    />
  </td>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Staff, TimeBlock } from '@/types'
import { useShiftStore } from '@/stores/useShiftStore'
import { getEffective, cellKey, findBlock } from '@/utils/shiftLogic'
import { PALETTE } from '@/constants/palette'
import { OFF_BLOCKS } from '@/constants/offBlocks'
import { fmtT } from '@/utils/dateHelpers'
import CellPicker from './CellPicker.vue'

const props = defineProps<{
  staff: Staff
  dateObj: Date
  globalTemplates: TimeBlock[]
  locked: boolean
  isWeekly: boolean
}>()

const shift = useShiftStore()
const pickerOpen = ref(false)

const key = computed(() => cellKey(props.staff.id, props.dateObj))

const isManual = computed(() => shift.cellData[key.value] !== undefined)

const eff = computed(() => getEffective(props.staff, props.dateObj, shift.cellData, props.globalTemplates))

const block = computed(() => {
  if (!eff.value?.blockId) return null
  return findBlock(eff.value.blockId, props.staff.timeBlocks, props.globalTemplates)
})

const blockShort = computed(() => block.value?.short ?? block.value?.label.slice(0, 3) ?? '')

const cellBg = computed(() => {
  if (!block.value) return 'transparent'
  return PALETTE[block.value.colorIdx].bg
})

const cellColor = computed(() => {
  if (!block.value) return 'inherit'
  return PALETTE[block.value.colorIdx].color
})

const isAfterLeave = computed(() => {
  if (!props.staff.leaveDate) return false
  const d = props.dateObj
  const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return dStr > props.staff.leaveDate
})

function openPicker() {
  if (props.locked || isAfterLeave.value) return
  pickerOpen.value = true
}

function onSelect(b: TimeBlock) {
  if (b.inH === null) {
    shift.setCellData(props.staff.id, props.dateObj, { blockId: b.id, isOff: true, inTime: '', outTime: '' })
  } else {
    shift.setCellData(props.staff.id, props.dateObj, {
      blockId: b.id, isOff: false,
      inTime: fmtT(b.inH, b.inM!),
      outTime: fmtT(b.outH!, b.outM!),
    })
  }
}

function onClear() {
  shift.clearCell(props.staff.id, props.dateObj)
  pickerOpen.value = false
}

function onApplyTime(inTime: string, outTime: string) {
  shift.setCellData(props.staff.id, props.dateObj, { blockId: '', isOff: false, inTime, outTime })
}
</script>
