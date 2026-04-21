<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <!-- スタッフ追加バー -->
    <div v-if="!ui.locked" class="flex items-center gap-2 px-3 py-1.5 bg-brand-surface2 border-b border-brand-border">
      <template v-if="!ui.addingStaff">
        <button
          class="text-xs font-bold text-brand-accent hover:opacity-80 transition-opacity flex items-center gap-1"
          @click="ui.addingStaff = true"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          スタッフを追加
        </button>
        <label class="flex items-center gap-1.5 text-xs text-brand-muted cursor-pointer ml-4">
          <input type="checkbox" v-model="ui.showInactive" class="rounded" />
          退職者を表示
        </label>
      </template>
      <template v-else>
        <input
          v-model="newName"
          placeholder="氏名を入力"
          class="text-xs bg-brand-surface border border-brand-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand-accent w-32"
          @keyup.enter="addStaff"
          @keyup.esc="cancelAdd"
          ref="nameInput"
        />
        <select v-model="newDeptId" class="text-xs bg-brand-surface border border-brand-border rounded-lg px-2 py-1 focus:outline-none">
          <option v-for="d in staffStore.depts" :key="d.id" :value="d.id">{{ d.label }}</option>
        </select>
        <button class="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-accent text-white hover:opacity-90" @click="addStaff">追加</button>
        <button class="text-xs font-bold px-2.5 py-1 rounded-lg border border-brand-border text-brand-muted hover:bg-brand-surface2" @click="cancelAdd">キャンセル</button>
      </template>
    </div>

    <!-- テーブル -->
    <ShiftTable
      :dates="ui.viewMode === 'weekly' ? ui.weekDates : ui.monthDates"
      :globalTemplates="templateStore.globalTemplates"
      :isWeekly="ui.viewMode === 'weekly'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { useStaffStore } from '@/stores/useStaffStore'
import { useTemplateStore } from '@/stores/useTemplateStore'
import ShiftTable from './ShiftTable.vue'

const ui = useUIStore()
const staffStore = useStaffStore()
const templateStore = useTemplateStore()

const newName = ref('')
const newDeptId = ref('front')
const nameInput = ref<HTMLInputElement | null>(null)

async function addStaff() {
  if (!newName.value.trim()) return
  staffStore.addStaff(newName.value, newDeptId.value)
  newName.value = ''
  ui.addingStaff = false
}

function cancelAdd() {
  newName.value = ''
  ui.addingStaff = false
}
</script>
