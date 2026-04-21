<template>
  <div class="border-t border-brand-border mt-2 pt-2">
    <div class="text-[11px] font-bold text-brand-muted mb-2">時間を直接入力</div>
    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1">
        <span class="text-[11px] font-bold text-green-600">IN</span>
        <select v-model.number="inH" class="text-xs border border-brand-border rounded px-1 py-0.5 bg-brand-surface2 font-mono">
          <option v-for="h in HH24" :key="h" :value="h">{{ String(h).padStart(2, '0') }}</option>
        </select>
        <span class="text-brand-muted text-xs">:</span>
        <select v-model.number="inM" class="text-xs border border-brand-border rounded px-1 py-0.5 bg-brand-surface2 font-mono">
          <option v-for="m in MM30" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-[11px] font-bold text-red-500">OUT</span>
        <select v-model.number="outH" class="text-xs border border-brand-border rounded px-1 py-0.5 bg-brand-surface2 font-mono">
          <option v-for="h in HH24" :key="h" :value="h">{{ String(h).padStart(2, '0') }}</option>
        </select>
        <span class="text-brand-muted text-xs">:</span>
        <select v-model.number="outM" class="text-xs border border-brand-border rounded px-1 py-0.5 bg-brand-surface2 font-mono">
          <option v-for="m in MM30" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
        </select>
      </div>
      <button
        class="text-xs font-bold px-3 py-1 rounded-lg bg-brand-accent text-white hover:opacity-90 active:scale-95 transition-all"
        @click="apply"
      >適用</button>
    </div>
    <div class="text-[10px] text-brand-muted mt-1 font-mono">
      {{ calcH(inH, inM, outH, outM) }}h（翌日: {{ outH < inH || (outH === inH && outM < inM) ? 'あり' : 'なし' }}）
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { calcH, fmtT } from '@/utils/shiftLogic'
import { fmtT as fmtTH } from '@/utils/dateHelpers'

const emit = defineEmits<{ apply: [inTime: string, outTime: string] }>()

const HH24 = Array.from({ length: 25 }, (_, i) => i)
const MM30 = [0, 30]

const inH = ref(9)
const inM = ref(0)
const outH = ref(18)
const outM = ref(0)

function apply() {
  emit('apply', fmtTH(inH.value, inM.value), fmtTH(outH.value, outM.value))
}
</script>
