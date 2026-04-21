<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-bold text-brand-muted">週間パターン</div>
      <button
        v-if="!adding"
        class="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-accent text-white hover:opacity-90 active:scale-95 transition-all"
        @click="adding = true"
      >+ 追加</button>
    </div>

    <PatternEditor
      v-if="adding"
      :personalBlocks="staff.timeBlocks"
      :globalTemplates="globalTemplates"
      @save="onAdd"
      @cancel="adding = false"
    />
    <PatternEditor
      v-if="editingPattern"
      :initial="editingPattern"
      :personalBlocks="staff.timeBlocks"
      :globalTemplates="globalTemplates"
      @save="onUpdate"
      @cancel="editingPattern = null"
    />

    <div class="space-y-2">
      <div
        v-for="p in staff.patterns"
        :key="p.id"
        class="rounded-lg border border-brand-border p-2 bg-brand-surface"
        :class="staff.activePatternId === p.id ? 'ring-2 ring-brand-accent' : ''"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :style="{ background: PALETTE[p.colorIdx].color }" />
            <span class="text-xs font-bold text-brand-text">{{ p.label }}</span>
            <span v-if="p.activeFrom" class="text-[10px] text-brand-muted">{{ p.activeFrom }}〜</span>
          </div>
          <div class="flex gap-1">
            <button
              v-if="!p.activeFrom"
              class="text-[10px] font-bold px-1.5 py-0.5 rounded border"
              :class="staff.activePatternId === p.id
                ? 'bg-brand-accent text-white border-brand-accent'
                : 'border-brand-border text-brand-muted hover:bg-brand-surface2'"
              @click="setActive(p.id)"
            >{{ staff.activePatternId === p.id ? '✓ 適用中' : '適用' }}</button>
            <button class="text-[10px] px-1.5 py-0.5 rounded border border-brand-border text-brand-muted hover:bg-brand-surface2" @click="editingPattern = p">編集</button>
            <button class="text-[10px] px-1.5 py-0.5 rounded border border-brand-border text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" @click="deletePattern(p.id)">削除</button>
          </div>
        </div>
        <!-- 7日表示 -->
        <div class="flex gap-1">
          <div v-for="dow in DOW_ORDER" :key="dow" class="flex flex-col items-center">
            <span class="text-[8px]" :class="dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-brand-muted'">{{ JP_WD[dow] }}</span>
            <span
              class="text-[9px] font-bold rounded px-1"
              :style="getBlockStyle(p.days[dow])"
            >{{ getShort(p.days[dow]) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!staff.patterns.length" class="text-xs text-brand-muted text-center py-3">パターンがありません</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Staff, TimeBlock, Pattern } from '@/types'
import { PALETTE } from '@/constants/palette'
import { JP_WD } from '@/utils/dateHelpers'
import { findBlock } from '@/utils/shiftLogic'
import { useStaffStore } from '@/stores/useStaffStore'
import PatternEditor from '@/components/templates/PatternEditor.vue'

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]

const props = defineProps<{ staff: Staff; globalTemplates: TimeBlock[] }>()
const staffStore = useStaffStore()
const adding = ref(false)
const editingPattern = ref<Pattern | null>(null)

function getShort(id: string): string {
  const b = findBlock(id, props.staff.timeBlocks, props.globalTemplates)
  return b?.short ?? '─'
}

function getBlockStyle(id: string) {
  const b = findBlock(id, props.staff.timeBlocks, props.globalTemplates)
  if (!b) return {}
  return { background: PALETTE[b.colorIdx].bg, color: PALETTE[b.colorIdx].color }
}

function onAdd(p: Pattern) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, patterns: [...s.patterns, p] }))
  adding.value = false
}

function onUpdate(p: Pattern) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, patterns: s.patterns.map(x => x.id === p.id ? p : x) }))
  editingPattern.value = null
}

function deletePattern(id: string) {
  staffStore.updateStaff(props.staff.id, s => ({
    ...s,
    patterns: s.patterns.filter(p => p.id !== id),
    activePatternId: s.activePatternId === id ? null : s.activePatternId,
  }))
}

function setActive(id: string) {
  staffStore.updateStaff(props.staff.id, s => ({
    ...s,
    activePatternId: s.activePatternId === id ? null : id,
  }))
}
</script>
