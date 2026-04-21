<template>
  <BaseModal v-model="ui.showPrint" widthClass="md:max-w-lg">
    <div class="flex items-center justify-between px-4 py-3 border-b border-brand-border">
      <div class="text-sm font-bold text-brand-text">印刷</div>
      <button class="text-brand-muted hover:text-brand-text transition-colors" @click="ui.showPrint = false">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="p-4 space-y-4">
      <!-- フォーマット選択 -->
      <div>
        <div class="text-xs font-bold text-brand-muted mb-2">印刷フォーマット</div>
        <div class="space-y-2">
          <label v-for="opt in formatOptions" :key="opt.id" class="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" v-model="format" :value="opt.id" class="accent-brand-accent" />
            <span class="text-sm text-brand-text">{{ opt.label }}</span>
            <span class="text-xs text-brand-muted">{{ opt.desc }}</span>
          </label>
        </div>
      </div>

      <!-- 対象期間 -->
      <div>
        <div class="text-xs font-bold text-brand-muted mb-2">対象期間</div>
        <div class="text-sm text-brand-text">
          {{ format === 'weekly-portrait' ? ui.weekLabel : ui.monthLabel }}
        </div>
      </div>
    </div>

    <div class="px-4 py-3 border-t border-brand-border flex gap-2">
      <button
        class="flex-1 text-sm font-bold py-2 rounded-xl bg-brand-accent text-white hover:opacity-90 active:scale-[.98] transition-all"
        @click="print"
      >印刷する</button>
      <button
        class="text-sm font-bold px-4 py-2 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface2 transition-colors"
        @click="ui.showPrint = false"
      >閉じる</button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { useStaffStore } from '@/stores/useStaffStore'
import { useTemplateStore } from '@/stores/useTemplateStore'
import { useShiftStore } from '@/stores/useShiftStore'
import { buildPrintHTML, doPrint, type PrintFormat } from '@/utils/printHelper'
import BaseModal from '@/components/shared/BaseModal.vue'

const ui = useUIStore()
const staffStore = useStaffStore()
const templateStore = useTemplateStore()
const shift = useShiftStore()

const format = ref<PrintFormat>('weekly-portrait')

const formatOptions = [
  { id: 'weekly-portrait' as const,   label: '週次（縦）',   desc: 'A4 縦 / 1週間' },
  { id: 'monthly-portrait' as const,  label: '月次（縦）',   desc: 'A4 縦 / 1ヶ月' },
  { id: 'monthly-landscape' as const, label: '月次（横）',   desc: 'A4 横 / 1ヶ月' },
]

function print() {
  const dates = format.value === 'weekly-portrait' ? ui.weekDates : ui.monthDates
  const staffByDept = staffStore.staffByDept(ui.showInactive, ui.year, ui.month)

  const html = buildPrintHTML({
    format: format.value,
    year: ui.year,
    month: ui.month,
    dates,
    staffByDept,
    globalTemplates: templateStore.globalTemplates,
    cellData: shift.cellData,
    showInactive: ui.showInactive,
  })

  doPrint(html)
}
</script>
