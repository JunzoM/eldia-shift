<template>
  <div
    class="flex items-center gap-2 rounded-lg px-2 py-1.5 border-2 cursor-pointer group"
    :style="{ background: PALETTE[block.colorIdx].bg, color: PALETTE[block.colorIdx].color, borderColor: PALETTE[block.colorIdx].color }"
  >
    <div class="flex flex-col items-center min-w-[40px]">
      <span class="text-[11px] font-bold">{{ block.short }}</span>
      <span v-if="block.inH != null" class="font-mono text-[9px]">{{ fmtT(block.inH!, block.inM!) }}</span>
      <span v-if="block.outH != null" class="font-mono text-[9px] opacity-75">{{ fmtT(block.outH!, block.outM!) }}</span>
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-xs font-bold truncate">{{ block.label }}</div>
      <div v-if="block.inH != null" class="text-[10px] opacity-75">{{ calcH(block.inH, block.inM, block.outH, block.outM) }}h</div>
    </div>
    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="text-[10px] px-1.5 py-0.5 rounded bg-white/60 hover:bg-white/80 font-bold" @click.stop="$emit('edit')">編集</button>
      <button class="text-[10px] px-1.5 py-0.5 rounded bg-white/60 hover:bg-red-100 text-red-600 font-bold" @click.stop="$emit('delete')">削除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimeBlock } from '@/types'
import { PALETTE } from '@/constants/palette'
import { calcH } from '@/utils/shiftLogic'
import { fmtT } from '@/utils/dateHelpers'

defineProps<{ block: TimeBlock }>()
defineEmits<{ edit: []; delete: [] }>()
</script>
