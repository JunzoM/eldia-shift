<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center justify-between mb-2">
      <div class="text-sm font-bold text-brand-text">共通テンプレート</div>
      <button
        v-if="!adding"
        class="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-accent text-white hover:opacity-90 active:scale-95 transition-all"
        @click="adding = true"
      >+ 追加</button>
    </div>

    <TimeBlockForm v-if="adding" title="新しい共通テンプレート" @save="onAdd" @cancel="adding = false" />

    <TimeBlockForm v-if="editingBlock" :initial="editingBlock" title="テンプレートを編集" @save="onUpdate" @cancel="editingBlock = null" />

    <div class="space-y-2">
      <TimeBlockCard
        v-for="b in templateStore.globalTemplates"
        :key="b.id"
        :block="b"
        @edit="editingBlock = b"
        @delete="templateStore.deleteTemplate(b.id)"
      />
    </div>

    <div v-if="!templateStore.globalTemplates.length" class="text-xs text-brand-muted text-center py-4">
      共通テンプレートがありません
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TimeBlock } from '@/types'
import { useTemplateStore } from '@/stores/useTemplateStore'
import TimeBlockForm from './TimeBlockForm.vue'
import TimeBlockCard from './TimeBlockCard.vue'

const templateStore = useTemplateStore()
const adding = ref(false)
const editingBlock = ref<TimeBlock | null>(null)

function onAdd(block: TimeBlock) {
  templateStore.addTemplate(block)
  adding.value = false
}

function onUpdate(block: TimeBlock) {
  templateStore.updateTemplate(block)
  editingBlock.value = null
}
</script>
