<template>
  <div class="border-2 border-brand-accent rounded-xl p-4 mb-3 bg-brand-surface">
    <div class="font-bold text-sm text-brand-text mb-3">{{ title }}</div>

    <!-- プレビュー -->
    <div class="flex items-center gap-3 mb-4 p-3 bg-brand-surface2 rounded-lg border border-brand-border">
      <div
        class="flex flex-col items-center rounded-lg px-3 py-1.5 min-w-[52px]"
        :style="{ background: PALETTE[form.colorIdx].bg, color: PALETTE[form.colorIdx].color, border: `2px solid ${PALETTE[form.colorIdx].color}` }"
      >
        <span class="text-xs font-bold">{{ form.short || '略' }}</span>
        <span class="font-mono text-[10px]">{{ fmtT(form.inH ?? 0, form.inM ?? 0) }}</span>
        <span class="font-mono text-[10px] opacity-75">{{ fmtT(form.outH ?? 0, form.outM ?? 0) }}</span>
      </div>
      <div>
        <div class="font-bold text-brand-text text-sm">{{ form.label || '（名称未入力）' }}</div>
        <div class="text-xs text-brand-muted mt-0.5">
          実働 <strong class="text-brand-text">{{ calcH(form.inH, form.inM, form.outH, form.outM) }}h</strong>
        </div>
      </div>
    </div>

    <!-- 名称 -->
    <div class="flex gap-2 mb-3 flex-wrap">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold text-brand-muted">名称</label>
        <input
          v-model="form.label"
          placeholder="例：宮本_日勤"
          class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent w-40"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold text-brand-muted">略称</label>
        <input
          v-model="form.short"
          placeholder="例：日"
          maxlength="4"
          class="text-xs bg-brand-surface2 border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-accent w-20"
        />
      </div>
    </div>

    <!-- 時間 -->
    <div class="flex gap-4 items-center mb-3 flex-wrap">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-green-600">IN</span>
        <select v-model.number="form.inH" class="text-xs bg-brand-surface2 border border-brand-border rounded px-1.5 py-1 font-mono focus:outline-none">
          <option v-for="h in HH24" :key="h" :value="h">{{ String(h).padStart(2, '0') }}</option>
        </select>
        <span class="text-brand-muted">:</span>
        <select v-model.number="form.inM" class="text-xs bg-brand-surface2 border border-brand-border rounded px-1.5 py-1 font-mono focus:outline-none">
          <option v-for="m in MM30" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-red-500">OUT</span>
        <select v-model.number="form.outH" class="text-xs bg-brand-surface2 border border-brand-border rounded px-1.5 py-1 font-mono focus:outline-none">
          <option v-for="h in HH24" :key="h" :value="h">{{ String(h).padStart(2, '0') }}</option>
        </select>
        <span class="text-brand-muted">:</span>
        <select v-model.number="form.outM" class="text-xs bg-brand-surface2 border border-brand-border rounded px-1.5 py-1 font-mono focus:outline-none">
          <option v-for="m in MM30" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
        </select>
      </div>
    </div>

    <!-- カラー -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-[11px] font-bold text-brand-muted">カラー</span>
      <PaletteSelector v-model="form.colorIdx" />
    </div>

    <!-- ボタン -->
    <div class="flex gap-2">
      <button
        class="flex-1 text-xs font-bold py-2 rounded-xl bg-brand-accent text-white hover:opacity-90 active:scale-[.98] transition-all"
        @click="save"
      >{{ initial ? '更新' : '追加' }}</button>
      <button
        class="text-xs font-bold px-4 py-2 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-surface2 transition-colors"
        @click="$emit('cancel')"
      >キャンセル</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { TimeBlock } from '@/types'
import { PALETTE } from '@/constants/palette'
import { calcH } from '@/utils/shiftLogic'
import { fmtT, uid } from '@/utils/dateHelpers'
import PaletteSelector from '@/components/shared/PaletteSelector.vue'

const HH24 = Array.from({ length: 25 }, (_, i) => i)
const MM30 = [0, 30]

const props = defineProps<{ initial?: TimeBlock; title?: string }>()
const emit = defineEmits<{ save: [block: TimeBlock]; cancel: [] }>()

const form = reactive<Omit<TimeBlock, 'id'> & { id: string | null }>({
  id: props.initial?.id ?? null,
  label: props.initial?.label ?? '',
  short: props.initial?.short ?? '',
  inH: props.initial?.inH ?? 9,
  inM: props.initial?.inM ?? 0,
  outH: props.initial?.outH ?? 18,
  outM: props.initial?.outM ?? 0,
  colorIdx: props.initial?.colorIdx ?? 0,
})

function save() {
  if (!form.label.trim()) return
  emit('save', {
    id: form.id ?? uid(),
    label: form.label.trim(),
    short: form.short.trim() || form.label.slice(0, 3),
    inH: form.inH,
    inM: form.inM,
    outH: form.outH,
    outM: form.outM,
    colorIdx: form.colorIdx,
  })
}
</script>
