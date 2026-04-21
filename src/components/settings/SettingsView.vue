<template>
  <div class="flex-1 overflow-y-auto p-4">
    <!-- タブ -->
    <div class="flex gap-1 mb-4 border-b border-brand-border pb-3">
      <button
        class="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
        :class="ui.settingsTab === 'staff' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:bg-brand-surface2'"
        @click="ui.settingsTab = 'staff'"
      >スタッフ設定</button>
      <button
        class="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
        :class="ui.settingsTab === 'global' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:bg-brand-surface2'"
        @click="ui.settingsTab = 'global'"
      >共通テンプレート</button>
    </div>

    <!-- スタッフ設定 -->
    <template v-if="ui.settingsTab === 'staff'">
      <template v-for="dept in staffByDept" :key="dept.id">
        <div class="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" :style="{ color: PALETTE[dept.colorIdx].color }">
          ── {{ dept.label }} ──
        </div>
        <div class="space-y-2 mb-4">
          <StaffCard
            v-for="s in dept.members"
            :key="s.id"
            :staff="s"
            :globalTemplates="templateStore.globalTemplates"
            :isDragOver="ui.dragOverId === s.id"
            @dragStart="dragFromId = $event"
            @dragOver="ui.dragOverId = $event"
            @dragLeave="ui.dragOverId = null"
            @drop="onDrop($event)"
          />
        </div>
      </template>
    </template>

    <!-- 共通テンプレート -->
    <template v-else>
      <GlobalTemplateManager />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { useStaffStore } from '@/stores/useStaffStore'
import { useTemplateStore } from '@/stores/useTemplateStore'
import { PALETTE } from '@/constants/palette'
import StaffCard from './StaffCard.vue'
import GlobalTemplateManager from '@/components/templates/GlobalTemplateManager.vue'

const ui = useUIStore()
const staffStore = useStaffStore()
const templateStore = useTemplateStore()

const staffByDept = computed(() =>
  staffStore.staffByDept(ui.showInactive, ui.year, ui.month)
)

let dragFromId: number | null = null

function onDrop(targetId: number) {
  if (dragFromId && dragFromId !== targetId) {
    staffStore.reorderByDrop(dragFromId, targetId)
  }
  dragFromId = null
  ui.dragOverId = null
}
</script>
