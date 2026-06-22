<script setup>
import { nextTick, ref } from 'vue'

defineProps({
  statuses: { type: Object, required: true },
})

const emit = defineEmits(['add'])
const title = ref('')
const status = ref('todo')
const error = ref('')
const input = ref(null)

function submit() {
  const cleanTitle = title.value.trim()
  if (!cleanTitle) {
    error.value = 'Give your task a short title.'
    input.value?.focus()
    return
  }
  emit('add', cleanTitle, status.value)
  title.value = ''
  error.value = ''
  nextTick(() => input.value?.focus())
}
</script>

<template>
  <form class="composer" @submit.prevent="submit">
    <div class="composer-header">
      <span>Quick add</span>
      <span class="font-mono text-[10px] text-slate-600">⌘ + ENTER</span>
    </div>
    <label for="new-task" class="sr-only">Task title</label>
    <textarea
      id="new-task"
      ref="input"
      v-model="title"
      maxlength="120"
      rows="2"
      placeholder="What needs to happen?"
      @input="error = ''"
      @keydown.meta.enter.prevent="submit"
      @keydown.ctrl.enter.prevent="submit"
    ></textarea>
    <p v-if="error" class="mt-2 text-xs text-rose-300" role="alert">{{ error }}</p>
    <div class="composer-footer">
      <label>
        <span class="sr-only">Initial status</span>
        <select v-model="status">
          <option v-for="(meta, key) in statuses" :key="key" :value="key">
            {{ meta.label }}
          </option>
        </select>
      </label>
      <button type="submit" class="add-button">
        Add task
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </div>
  </form>
</template>
