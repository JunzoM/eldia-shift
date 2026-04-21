<template>
  <div class="flex gap-1.5 flex-wrap">
    <button
      v-for="(c, i) in PALETTE"
      :key="i"
      type="button"
      class="w-5 h-5 rounded-full transition-all active:scale-90"
      :style="{
        background: c.color,
        border: modelValue === i ? '3px solid #0f2044' : '3px solid transparent',
      }"
      @click="$emit('update:modelValue', i)"
    />
  </div>
</template>

<script setup lang="ts">
import { PALETTE } from '@/constants/palette'

defineProps<{ modelValue: number }>()
defineEmits<{ 'update:modelValue': [val: number] }>()
</script>
