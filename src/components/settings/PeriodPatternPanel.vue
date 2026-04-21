<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-bold text-brand-muted">期間限定パターン</div>
      <button
        v-if="!adding"
        class="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-accent text-white hover:opacity-90 active:scale-95"
        @click="startAdd"
      >+ 追加</button>
    </div>

    <!-- 追加フォーム -->
    <div v-if="adding || editingId" class="border-2 border-brand-accent rounded-xl p-3 bg-brand-surface">
      <div class="font-bold text-sm text-brand-text mb-3">{{ editingId ? '期間パターンを編集' : '新しい期間パターン' }}</div>

      <div class="flex gap-2 mb-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">名称</label>
          <input v-model="form.label" placeholder="例：GW" class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent w-28" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">開始日</label>
          <input v-model="form.startDate" type="date" class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent" @change="rebuildDates" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">終了日</label>
          <input v-model="form.endDate" type="date" class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent" @change="rebuildDates" />
        </div>
      </div>

      <PaletteSelector v-model="form.colorIdx" class="mb-3" />

      <!-- 日別ブロック設定 -->
      <div v-if="rangeDates.length" class="space-y-1 mb-3 max-h-48 overflow-y-auto">
        <div v-for="d in rangeDates" :key="d" class="flex items-center gap-2">
          <span class="text-[10px] font-mono text-brand-muted w-20">{{ d }}</span>
          <DayBlockChip
            :modelValue="form.days[d] ?? ''"
            :personalBlocks="staff.timeBlocks"
            :globalTemplates="globalTemplates"
            @update:modelValue="(v: string) => setDay(d, v)"
          />
          <span class="text-[10px] text-brand-muted">{{ getShort(form.days[d]) }}</span>
        </div>
      </div>

      <div class="flex gap-2">
        <button class="flex-1 text-xs font-bold py-2 rounded-xl bg-brand-accent text-white hover:opacity-90" @click="save">{{ editingId ? '更新' : '追加' }}</button>
        <button class="text-xs font-bold px-4 py-2 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface2" @click="cancelEdit">キャンセル</button>
      </div>
    </div>

    <!-- 一覧 -->
    <div
      v-for="pp in staff.periodPatterns"
      :key="pp.id"
      class="rounded-lg border border-brand-border p-2 bg-brand-surface"
    >
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" :style="{ background: PALETTE[pp.colorIdx ?? 0].color }" />
          <span class="text-xs font-bold text-brand-text">{{ pp.label }}</span>
          <span class="text-[10px] font-mono text-brand-muted">{{ pp.startDate }} 〜 {{ pp.endDate }}</span>
        </div>
        <div class="flex gap-1">
          <button class="text-[10px] px-1.5 py-0.5 rounded border border-brand-border text-brand-muted hover:bg-brand-surface2" @click="startEdit(pp)">編集</button>
          <button class="text-[10px] px-1.5 py-0.5 rounded border border-brand-border text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" @click="deletePeriod(pp.id)">削除</button>
        </div>
      </div>
    </div>

    <div v-if="!staff.periodPatterns?.length" class="text-xs text-brand-muted text-center py-3">期間パターンがありません</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { Staff, TimeBlock, PeriodPattern } from '@/types'
import { PALETTE } from '@/constants/palette'
import { getDatesInRange, uid } from '@/utils/dateHelpers'
import { findBlock } from '@/utils/shiftLogic'
import { useStaffStore } from '@/stores/useStaffStore'
import DayBlockChip from '@/components/templates/DayBlockChip.vue'
import PaletteSelector from '@/components/shared/PaletteSelector.vue'

const props = defineProps<{ staff: Staff; globalTemplates: TimeBlock[] }>()
const staffStore = useStaffStore()

const adding = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ label: '', startDate: '', endDate: '', colorIdx: 0, days: {} as Record<string, string> })

const rangeDates = computed(() => {
  if (!form.startDate || !form.endDate || form.startDate > form.endDate) return []
  return getDatesInRange(form.startDate, form.endDate)
})

function rebuildDates() {
  const next: Record<string, string> = {}
  for (const d of rangeDates.value) next[d] = form.days[d] ?? ''
  form.days = next
}

function setDay(d: string, v: string) {
  form.days = { ...form.days, [d]: v }
}

function getShort(id: string): string {
  const b = findBlock(id, props.staff.timeBlocks, props.globalTemplates)
  return b?.short ?? ''
}

function startAdd() {
  Object.assign(form, { label: '', startDate: '', endDate: '', colorIdx: 0, days: {} })
  editingId.value = null
  adding.value = true
}

function startEdit(pp: PeriodPattern) {
  Object.assign(form, { label: pp.label, startDate: pp.startDate, endDate: pp.endDate, colorIdx: pp.colorIdx ?? 0, days: { ...pp.days } })
  editingId.value = pp.id
  adding.value = false
}

function cancelEdit() {
  adding.value = false
  editingId.value = null
}

function save() {
  if (!form.label.trim() || !form.startDate || !form.endDate) return
  const pp: PeriodPattern = {
    id: editingId.value ?? uid(),
    label: form.label.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    colorIdx: form.colorIdx,
    days: { ...form.days },
  }
  if (editingId.value) {
    staffStore.updateStaff(props.staff.id, s => ({ ...s, periodPatterns: (s.periodPatterns ?? []).map(x => x.id === pp.id ? pp : x) }))
  } else {
    staffStore.updateStaff(props.staff.id, s => ({ ...s, periodPatterns: [...(s.periodPatterns ?? []), pp] }))
  }
  cancelEdit()
}

function deletePeriod(id: string) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, periodPatterns: (s.periodPatterns ?? []).filter(p => p.id !== id) }))
}
</script>
