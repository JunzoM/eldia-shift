<template>
  <header class="sticky top-0 z-[200] border-b border-brand-border bg-[var(--header-bg)] backdrop-blur-sm">
    <div class="flex items-center gap-2 px-3 py-2 flex-wrap">
      <!-- ロゴ -->
      <div class="flex items-center gap-2 mr-2">
        <span class="text-[11px] font-bold text-brand-muted tracking-widest uppercase hidden sm:block">HOTEL ELDIA</span>
        <span class="text-sm font-bold text-brand-accent">SHIFTMGR</span>
      </div>

      <!-- メインタブ -->
      <div class="flex gap-1">
        <button
          v-for="tab in mainTabs"
          :key="tab.id"
          class="text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
          :class="ui.mainView === tab.id
            ? 'bg-brand-accent text-white'
            : 'text-brand-muted hover:bg-brand-surface2'"
          @click="ui.mainView = tab.id"
        >{{ tab.label }}</button>
      </div>

      <div class="flex-1" />

      <!-- ビュー切替（グリッドのみ表示） -->
      <template v-if="ui.mainView === 'grid'">
        <div class="flex rounded-lg overflow-hidden border border-brand-border text-xs font-bold">
          <button
            class="px-2.5 py-1 transition-colors"
            :class="ui.viewMode === 'weekly' ? 'bg-brand-accent text-white' : 'bg-brand-surface text-brand-muted hover:bg-brand-surface2'"
            @click="ui.viewMode = 'weekly'"
          >週</button>
          <button
            class="px-2.5 py-1 transition-colors"
            :class="ui.viewMode === 'monthly' ? 'bg-brand-accent text-white' : 'bg-brand-surface text-brand-muted hover:bg-brand-surface2'"
            @click="ui.viewMode = 'monthly'"
          >月</button>
        </div>

        <!-- 日付ナビ -->
        <div class="flex items-center gap-1">
          <button class="p-1 rounded hover:bg-brand-surface2 transition-colors text-brand-muted" @click="prev">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="text-xs font-bold text-brand-text min-w-[120px] text-center">{{ ui.viewMode === 'weekly' ? ui.weekLabel : ui.monthLabel }}</span>
          <button class="p-1 rounded hover:bg-brand-surface2 transition-colors text-brand-muted" @click="next">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="text-[10px] font-bold px-2 py-1 rounded border border-brand-border text-brand-muted hover:bg-brand-surface2 transition-colors" @click="ui.goToday()">今日</button>
        </div>
      </template>

      <!-- DbStatus -->
      <DbStatusBadge :status="shift.dbStatus" />

      <!-- ロックボタン -->
      <button
        class="p-1.5 rounded-lg transition-colors"
        :class="ui.locked ? 'text-brand-accent bg-red-50 dark:bg-red-500/10' : 'text-brand-muted hover:bg-brand-surface2'"
        :title="ui.locked ? 'ロック中（クリックで解除）' : 'ロック解除中（クリックでロック）'"
        @click="ui.toggleLock()"
      >
        <svg v-if="ui.locked" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
      </button>

      <!-- マニュアル -->
      <button
        class="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface2 transition-colors"
        title="使い方"
        @click="ui.showManual = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </button>

      <!-- 印刷 -->
      <button
        class="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface2 transition-colors"
        title="印刷"
        @click="ui.showPrint = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
      </button>

      <!-- ダークモード -->
      <button
        class="p-1.5 rounded-lg text-brand-muted hover:bg-brand-surface2 transition-colors"
        @click="toggleTheme()"
      >
        <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/useUIStore'
import { useShiftStore } from '@/stores/useShiftStore'
import { useTheme } from '@/composables/useTheme'
import DbStatusBadge from './DbStatusBadge.vue'

const ui = useUIStore()
const shift = useShiftStore()
const { isDark, toggleTheme } = useTheme()

const mainTabs = [
  { id: 'grid' as const, label: 'シフト表' },
  { id: 'summary' as const, label: '集計' },
  { id: 'settings' as const, label: '設定' },
]

function prev() {
  if (ui.viewMode === 'weekly') ui.prevWeek()
  else ui.prevMonth()
}

function next() {
  if (ui.viewMode === 'weekly') ui.nextWeek()
  else ui.nextMonth()
}
</script>
