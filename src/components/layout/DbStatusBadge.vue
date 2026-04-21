<template>
  <div class="flex items-center gap-1.5 text-[11px] font-bold font-mono">
    <span :class="dotClass" class="w-2 h-2 rounded-full inline-block" />
    <span :class="textClass">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DbStatus } from '@/types'

const props = defineProps<{ status: DbStatus }>()

const dotClass = computed(() => ({
  'bg-green-500': props.status === 'ok',
  'bg-yellow-400 animate-pulse': props.status === 'saving' || props.status === 'loading',
  'bg-red-500': props.status === 'offline',
  'bg-brand-muted': props.status === 'init',
}))

const textClass = computed(() => ({
  'text-green-600 dark:text-green-400': props.status === 'ok',
  'text-yellow-600 dark:text-yellow-400': props.status === 'saving' || props.status === 'loading',
  'text-red-500': props.status === 'offline',
  'text-brand-muted': props.status === 'init',
}))

const label = computed(() => ({
  ok: '保存済',
  saving: '保存中',
  loading: '読込中',
  offline: 'オフライン',
  init: '...',
}[props.status]))
</script>
