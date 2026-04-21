import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimeBlock } from '@/types'
import { INIT_GLOBAL_TEMPLATES } from '@/constants/initialData'

export const useTemplateStore = defineStore('templates', () => {
  const globalTemplates = ref<TimeBlock[]>([...INIT_GLOBAL_TEMPLATES])

  function setGlobalTemplates(templates: TimeBlock[]) {
    globalTemplates.value = templates
  }

  function addTemplate(block: TimeBlock) {
    globalTemplates.value = [...globalTemplates.value, block]
  }

  function updateTemplate(block: TimeBlock) {
    globalTemplates.value = globalTemplates.value.map(b => b.id === block.id ? block : b)
  }

  function deleteTemplate(id: string) {
    globalTemplates.value = globalTemplates.value.filter(b => b.id !== id)
  }

  return { globalTemplates, setGlobalTemplates, addTemplate, updateTemplate, deleteTemplate }
})
