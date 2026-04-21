<template>
  <div class="min-h-screen bg-brand-bg flex flex-col font-sans text-brand-text">
    <AppHeader />

    <!-- メインコンテンツ -->
    <main class="flex flex-col flex-1 overflow-hidden">
      <!-- ロック解除バナー -->
      <div
        v-if="!ui.locked"
        class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 border-b border-orange-200 dark:border-orange-500/30 text-xs font-bold text-orange-600 dark:text-orange-400"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
        編集モード — セルをクリックしてシフトを変更できます
      </div>

      <!-- ビュー切替 -->
      <Transition name="panel-in" mode="out-in">
        <ShiftGrid v-if="ui.mainView === 'grid'" key="grid" />
        <SummaryView v-else-if="ui.mainView === 'summary'" key="summary" />
        <SettingsView v-else-if="ui.mainView === 'settings'" key="settings" />
      </Transition>
    </main>

    <!-- モーダル -->
    <PrintModal />
    <ManualModal />

    <!-- 初期ローディング -->
    <Transition name="overlay">
      <div
        v-if="shift.dbStatus === 'loading' || shift.dbStatus === 'init'"
        class="fixed inset-0 bg-brand-bg/80 z-[9999] flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
          <div class="text-sm font-bold text-brand-muted">データを読み込み中...</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { useShiftStore } from '@/stores/useShiftStore'
import { useTheme } from '@/composables/useTheme'
import AppHeader from '@/components/layout/AppHeader.vue'
import ShiftGrid from '@/components/grid/ShiftGrid.vue'
import SummaryView from '@/components/summary/SummaryView.vue'
import SettingsView from '@/components/settings/SettingsView.vue'
import PrintModal from '@/components/print/PrintModal.vue'
import ManualModal from '@/components/manual/ManualModal.vue'

const ui = useUIStore()
const shift = useShiftStore()

useTheme()

onMounted(async () => {
  shift.setupWatcher()
  await shift.loadAll()
})
</script>
