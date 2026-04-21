<template>
  <div class="relative">
    <button
      type="button"
      class="w-9 h-9 rounded-lg text-[10px] font-bold border-2 transition-all flex flex-col items-center justify-center"
      :style="currentBlock ? {
        background: PALETTE[currentBlock.colorIdx].bg,
        color: PALETTE[currentBlock.colorIdx].color,
        borderColor: PALETTE[currentBlock.colorIdx].color,
      } : {}"
      :class="!currentBlock ? 'border-brand-border text-brand-muted hover:bg-brand-surface2' : ''"
      @click="open = !open"
    >
      <span>{{ currentBlock?.short ?? '─' }}</span>
      <span v-if="dayLabel" class="text-[8px] opacity-70">{{ dayLabel }}</span>
    </button>

    <!-- ブロック選択ポップアップ -->
    <div
      v-if="open"
      class="absolute z-50 bg-brand-surface border border-brand-border rounded-xl shadow-xl p-2 w-56 top-full left-0 mt-1"
    >
      <div class="text-[9px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest">{{ dayLabel }}のブロックを選択</div>

      <!-- 個人 -->
      <div v-if="personalBlocks.length" class="mb-2">
        <div class="text-[9px] text-brand-muted mb-1">個人</div>
        <div class="flex flex-wrap gap-1">
          <MiniChip v-for="b in personalBlocks" :key="b.id" :block="b" :selected="modelValue === b.id" @click="select(b.id)" />
        </div>
      </div>

      <!-- 共通 -->
      <div v-if="globalTemplates.length" class="mb-2">
        <div class="text-[9px] text-brand-muted mb-1">共通</div>
        <div class="flex flex-wrap gap-1">
          <MiniChip v-for="b in globalTemplates" :key="b.id" :block="b" :selected="modelValue === b.id" @click="select(b.id)" />
        </div>
      </div>

      <!-- 休暇 -->
      <div class="mb-2">
        <div class="text-[9px] text-brand-muted mb-1">休暇</div>
        <div class="flex flex-wrap gap-1">
          <MiniChip v-for="b in OFF_BLOCKS" :key="b.id" :block="b" :selected="modelValue === b.id" @click="select(b.id)" />
        </div>
      </div>

      <button class="text-[10px] text-brand-muted hover:text-brand-text mt-1" @click="select(''); open = false">クリア</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TimeBlock } from '@/types'
import { PALETTE } from '@/constants/palette'
import { OFF_BLOCKS } from '@/constants/offBlocks'
import { findBlock } from '@/utils/shiftLogic'
import { fmtT } from '@/utils/dateHelpers'
import { defineComponent, h } from 'vue'

const MiniChip = defineComponent({
  props: { block: Object as () => TimeBlock, selected: Boolean },
  emits: ['click'],
  setup(props, { emit }) {
    return () => {
      const b = props.block!
      const c = PALETTE[b.colorIdx]
      return h('button', {
        type: 'button',
        onClick: () => emit('click'),
        style: {
          background: c.bg,
          color: c.color,
          border: `1.5px solid ${props.selected ? c.color : 'transparent'}`,
          borderRadius: '6px',
          padding: '2px 6px',
          fontSize: '10px',
          fontWeight: 700,
          cursor: 'pointer',
        },
      }, b.short || b.label.slice(0, 3))
    }
  },
})

const props = defineProps<{
  modelValue: string
  dayLabel?: string
  personalBlocks: TimeBlock[]
  globalTemplates: TimeBlock[]
}>()

const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const open = ref(false)

const currentBlock = computed(() =>
  findBlock(props.modelValue, props.personalBlocks, props.globalTemplates)
)

function select(id: string) {
  emit('update:modelValue', id)
  open.value = false
}
</script>
