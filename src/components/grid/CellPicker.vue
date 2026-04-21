<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden border border-brand-border">
        <!-- ヘッダー -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-brand-border">
          <div class="text-sm font-bold text-brand-text">{{ staff.name }} — {{ dateLabel }}</div>
          <button class="text-brand-muted hover:text-brand-text transition-colors" @click="$emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- 検索 -->
        <div class="px-3 pt-2">
          <input
            v-model="query"
            placeholder="ブロックを検索..."
            class="w-full text-xs bg-brand-surface2 border border-brand-border rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        <!-- ブロック一覧 -->
        <div class="overflow-y-auto flex-1 p-3 space-y-3">
          <!-- 個人テンプレート -->
          <div v-if="personalFiltered.length">
            <div class="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">個人テンプレート</div>
            <div class="flex flex-wrap gap-1.5">
              <BlockChip v-for="b in personalFiltered" :key="b.id" :block="b" :selected="effectiveBlockId === b.id" @click="selectBlock(b)" />
            </div>
          </div>

          <!-- 共通テンプレート -->
          <div v-if="globalFiltered.length">
            <div class="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">共通テンプレート</div>
            <div class="flex flex-wrap gap-1.5">
              <BlockChip v-for="b in globalFiltered" :key="b.id" :block="b" :selected="effectiveBlockId === b.id" @click="selectBlock(b)" />
            </div>
          </div>

          <!-- 休暇 -->
          <div v-if="offFiltered.length">
            <div class="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">休暇</div>
            <div class="flex flex-wrap gap-1.5">
              <BlockChip v-for="b in offFiltered" :key="b.id" :block="b" :selected="effectiveBlockId === b.id" @click="selectBlock(b)" />
            </div>
          </div>

          <!-- 直接入力 -->
          <DirectTimeInput @apply="applyTime" />
        </div>

        <!-- フッター -->
        <div class="px-3 py-2 border-t border-brand-border flex gap-2">
          <button
            class="flex-1 text-xs font-bold py-1.5 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface2 transition-colors"
            @click="$emit('clear')"
          >クリア</button>
          <button
            class="text-xs font-bold py-1.5 px-4 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface2 transition-colors"
            @click="$emit('close')"
          >閉じる</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Staff, TimeBlock } from '@/types'
import { PALETTE } from '@/constants/palette'
import { OFF_BLOCKS } from '@/constants/offBlocks'
import { JP_WD } from '@/utils/dateHelpers'
import DirectTimeInput from './DirectTimeInput.vue'

const props = defineProps<{
  staff: Staff
  dateObj: Date
  globalTemplates: TimeBlock[]
  effectiveBlockId?: string
}>()

const emit = defineEmits<{
  select: [block: TimeBlock]
  clear: []
  close: []
  applyTime: [inTime: string, outTime: string]
}>()

const query = ref('')

const dateLabel = computed(() => {
  const d = props.dateObj
  return `${d.getMonth() + 1}/${d.getDate()}(${JP_WD[d.getDay()]})`
})

function filterBlocks(blocks: TimeBlock[]) {
  if (!query.value) return blocks
  const q = query.value.toLowerCase()
  return blocks.filter(b => b.label.toLowerCase().includes(q) || b.short.toLowerCase().includes(q))
}

const personalFiltered = computed(() => filterBlocks(props.staff.timeBlocks))
const globalFiltered = computed(() => filterBlocks(props.globalTemplates))
const offFiltered = computed(() => filterBlocks(OFF_BLOCKS))

function selectBlock(b: TimeBlock) {
  emit('select', b)
  emit('close')
}

function applyTime(inTime: string, outTime: string) {
  emit('applyTime', inTime, outTime)
  emit('close')
}
</script>

<script lang="ts">
// BlockChip インラインコンポーネント
import { defineComponent, h } from 'vue'
import { PALETTE as P } from '@/constants/palette'
import type { TimeBlock as TB } from '@/types'
import { fmtT } from '@/utils/dateHelpers'

const BlockChip = defineComponent({
  props: { block: Object as () => TB, selected: Boolean },
  emits: ['click'],
  setup(props, { emit }) {
    return () => {
      const b = props.block!
      const c = P[b.colorIdx]
      return h('button', {
        type: 'button',
        onClick: () => emit('click'),
        style: {
          background: c.bg,
          color: c.color,
          border: `2px solid ${props.selected ? c.color : 'transparent'}`,
          borderRadius: '8px',
          padding: '4px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '48px',
          cursor: 'pointer',
          transition: 'all 0.1s',
        },
      }, [
        h('span', { style: { fontSize: '11px', fontWeight: 700 } }, b.short || b.label.slice(0, 3)),
        b.inH != null
          ? h('span', { style: { fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' } }, fmtT(b.inH!, b.inM!))
          : null,
        b.outH != null
          ? h('span', { style: { fontSize: '9px', opacity: 0.75, fontFamily: 'JetBrains Mono, monospace' } }, fmtT(b.outH!, b.outM!))
          : null,
      ])
    }
  },
})

export { BlockChip }
</script>
