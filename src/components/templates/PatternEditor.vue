<template>
  <div class="border-2 border-brand-accent rounded-xl p-3 mb-3 bg-brand-surface">
    <div class="font-bold text-sm text-brand-text mb-3">{{ initial ? 'パターンを編集' : '新しいパターン' }}</div>

    <div class="flex gap-2 mb-3">
      <div class="flex flex-col gap-1 flex-1">
        <label class="text-[11px] font-bold text-brand-muted">名称</label>
        <input
          v-model="form.label"
          placeholder="例：通常週"
          class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold text-brand-muted">開始日</label>
        <input
          v-model="form.activeFrom"
          type="date"
          class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent"
        />
      </div>
    </div>

    <div class="flex items-center gap-1 mb-3">
      <span class="text-[11px] font-bold text-brand-muted mr-1">カラー</span>
      <PaletteSelector v-model="form.colorIdx" />
    </div>

    <!-- 7日間パターン -->
    <div class="flex gap-1.5 mb-4 flex-wrap">
      <div v-for="(dow, idx) in DOW_ORDER" :key="dow" class="flex flex-col items-center gap-1">
        <span class="text-[9px] font-bold" :class="dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-brand-muted'">{{ JP_WD[dow] }}</span>
        <DayBlockChip
          v-model="form.days[dow]"
          :dayLabel="JP_WD[dow]"
          :personalBlocks="personalBlocks"
          :globalTemplates="globalTemplates"
        />
      </div>
    </div>

    <div class="flex gap-2">
      <button
        class="flex-1 text-xs font-bold py-2 rounded-xl bg-brand-accent text-white hover:opacity-90 active:scale-[.98] transition-all"
        @click="save"
      >{{ initial ? '更新' : '追加' }}</button>
      <button
        class="text-xs font-bold px-4 py-2 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface2 transition-colors"
        @click="$emit('cancel')"
      >キャンセル</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { Pattern, TimeBlock } from '@/types'
import { JP_WD, uid } from '@/utils/dateHelpers'
import PaletteSelector from '@/components/shared/PaletteSelector.vue'
import DayBlockChip from './DayBlockChip.vue'

// Mon-first order
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]

const props = defineProps<{
  initial?: Pattern
  personalBlocks: TimeBlock[]
  globalTemplates: TimeBlock[]
}>()
const emit = defineEmits<{ save: [pattern: Pattern]; cancel: [] }>()

const form = reactive({
  label: props.initial?.label ?? '',
  colorIdx: props.initial?.colorIdx ?? 0,
  activeFrom: props.initial?.activeFrom ?? '',
  days: props.initial?.days ? [...props.initial.days] as [string,string,string,string,string,string,string]
    : ['','','','','','',''] as [string,string,string,string,string,string,string],
})

function save() {
  if (!form.label.trim()) return
  emit('save', {
    id: props.initial?.id ?? uid(),
    label: form.label.trim(),
    colorIdx: form.colorIdx,
    activeFrom: form.activeFrom || undefined,
    days: [...form.days] as [string,string,string,string,string,string,string],
  })
}
</script>
