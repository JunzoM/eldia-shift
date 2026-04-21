<template>
  <div
    class="rounded-xl border border-brand-border bg-brand-surface shadow-sm transition-all"
    :class="isDragOver ? 'ring-2 ring-brand-accent' : ''"
    draggable="true"
    @dragstart="$emit('dragStart', staff.id)"
    @dragover.prevent="$emit('dragOver', staff.id)"
    @dragleave="$emit('dragLeave')"
    @drop="$emit('drop', staff.id)"
  >
    <!-- ヘッダー -->
    <div
      class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-brand-surface2 rounded-xl transition-colors"
      @click="toggle"
    >
      <span class="text-[10px] font-mono text-brand-muted w-5">{{ staff.no }}</span>
      <div
        class="w-2 h-2 rounded-full flex-shrink-0"
        :style="{ background: PALETTE[deptColorIdx].color }"
      />
      <span class="font-bold text-sm text-brand-text flex-1">{{ staff.name }}</span>
      <span v-if="!staff.active" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-surface2 text-brand-muted">退職</span>
      <svg
        class="w-4 h-4 text-brand-muted transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
    </div>

    <!-- 展開コンテンツ -->
    <div v-if="isOpen" class="px-3 pb-3 space-y-4 border-t border-brand-border mt-1 pt-3">
      <!-- 基本情報 -->
      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">氏名</label>
          <input :value="staff.name" @input="update('name', ($event.target as HTMLInputElement).value)"
            class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">部門</label>
          <select :value="staff.deptId" @change="update('deptId', ($event.target as HTMLSelectElement).value)"
            class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent">
            <option v-for="d in depts" :key="d.id" :value="d.id">{{ d.label }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">入社日</label>
          <input type="date" :value="staff.joinDate" @change="update('joinDate', ($event.target as HTMLInputElement).value)"
            class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-brand-muted">退職日</label>
          <input type="date" :value="staff.leaveDate" @change="update('leaveDate', ($event.target as HTMLInputElement).value)"
            class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent" />
        </div>
      </div>

      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" :checked="staff.active" @change="update('active', ($event.target as HTMLInputElement).checked)" class="rounded" />
        <span class="text-xs text-brand-text">在籍中</span>
      </label>

      <!-- サブタブ -->
      <div class="flex gap-1 border-b border-brand-border pb-2">
        <button
          v-for="tab in subTabs"
          :key="tab.id"
          class="text-[11px] font-bold px-2 py-1 rounded-lg transition-colors"
          :class="activeTab === tab.id
            ? 'bg-brand-accent text-white'
            : 'text-brand-muted hover:bg-brand-surface2'"
          @click="activeTab = tab.id"
        >{{ tab.label }}</button>
      </div>

      <!-- 個人テンプレート -->
      <template v-if="activeTab === 'timeblocks'">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-bold text-brand-muted">個人テンプレート</div>
          <button v-if="!addingBlock" class="text-xs font-bold px-2 py-1 rounded-lg bg-brand-accent text-white hover:opacity-90" @click="addingBlock = true">+ 追加</button>
        </div>
        <TimeBlockForm v-if="addingBlock" @save="onAddBlock" @cancel="addingBlock = false" />
        <TimeBlockForm v-if="editingBlock" :initial="editingBlock" @save="onUpdateBlock" @cancel="editingBlock = null" />
        <div class="space-y-1.5">
          <TimeBlockCard v-for="b in staff.timeBlocks" :key="b.id" :block="b"
            @edit="editingBlock = b"
            @delete="deleteBlock(b.id)"
          />
        </div>
        <div v-if="!staff.timeBlocks.length" class="text-xs text-brand-muted text-center py-3">個人テンプレートがありません</div>
      </template>

      <!-- 週間パターン -->
      <template v-if="activeTab === 'patterns'">
        <StaffPatternPanel :staff="staff" :globalTemplates="globalTemplates" />
      </template>

      <!-- 期間パターン -->
      <template v-if="activeTab === 'periodpatterns'">
        <PeriodPatternPanel :staff="staff" :globalTemplates="globalTemplates" />
      </template>

      <!-- 削除 -->
      <button
        class="w-full text-xs font-bold py-2 rounded-xl border border-brand-border text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-2"
        @click="confirmDelete"
      >スタッフを削除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Staff, TimeBlock } from '@/types'
import { PALETTE } from '@/constants/palette'
import { useStaffStore } from '@/stores/useStaffStore'
import { useUIStore } from '@/stores/useUIStore'
import TimeBlockForm from '@/components/templates/TimeBlockForm.vue'
import TimeBlockCard from '@/components/templates/TimeBlockCard.vue'
import StaffPatternPanel from './StaffPatternPanel.vue'
import PeriodPatternPanel from './PeriodPatternPanel.vue'

const props = defineProps<{
  staff: Staff
  globalTemplates: TimeBlock[]
  isDragOver?: boolean
}>()
const emit = defineEmits<{
  dragStart: [id: number]
  dragOver: [id: number]
  dragLeave: []
  drop: [id: number]
}>()

const staffStore = useStaffStore()
const ui = useUIStore()

const isOpen = computed({
  get: () => ui.openStaffId === props.staff.id,
  set: (v) => { ui.openStaffId = v ? props.staff.id : null },
})

const depts = staffStore.depts
const deptColorIdx = computed(() => depts.find(d => d.id === props.staff.deptId)?.colorIdx ?? 0)

const activeTab = ref<'timeblocks' | 'patterns' | 'periodpatterns'>('timeblocks')
const subTabs = [
  { id: 'timeblocks' as const, label: '個人ブロック' },
  { id: 'patterns' as const, label: '週間パターン' },
  { id: 'periodpatterns' as const, label: '期間パターン' },
]

const addingBlock = ref(false)
const editingBlock = ref<TimeBlock | null>(null)

import { useTemplateStore } from '@/stores/useTemplateStore'
const templateStore = useTemplateStore()
const globalTemplates = computed(() => templateStore.globalTemplates)

function toggle() {
  isOpen.value = !isOpen.value
}

function update<K extends keyof Staff>(key: K, value: Staff[K]) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, [key]: value }))
}

function onAddBlock(b: TimeBlock) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, timeBlocks: [...s.timeBlocks, b] }))
  addingBlock.value = false
}

function onUpdateBlock(b: TimeBlock) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, timeBlocks: s.timeBlocks.map(x => x.id === b.id ? b : x) }))
  editingBlock.value = null
}

function deleteBlock(id: string) {
  staffStore.updateStaff(props.staff.id, s => ({ ...s, timeBlocks: s.timeBlocks.filter(b => b.id !== id) }))
}

function confirmDelete() {
  if (confirm(`${props.staff.name} を削除しますか？`)) {
    staffStore.deleteStaff(props.staff.id)
    ui.openStaffId = null
  }
}
</script>
