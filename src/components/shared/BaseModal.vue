<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[9000] flex items-end md:items-center justify-center"
        @click.self="$emit('update:modelValue', false)"
      >
        <div
          class="w-full md:max-w-xl bg-brand-surface rounded-t-2xl md:rounded-2xl flex flex-col max-h-[88vh] overflow-hidden shadow-2xl"
          :class="widthClass"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; widthClass?: string }>()
defineEmits<{ 'update:modelValue': [val: boolean] }>()
</script>
