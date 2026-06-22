<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
  statuses: { type: Object, required: true },
})

const emit = defineEmits([
  'drag-start',
  'drag-end',
  'drop-before',
  'update',
  'delete',
  'move',
  'nudge',
])
const editing = ref(false)
const draft = ref('')
const editInput = ref(null)

function beginEdit() {
  draft.value = props.task.title
  editing.value = true
  nextTick(() => editInput.value?.select())
}

function saveEdit() {
  const title = draft.value.trim()
  if (title) emit('update', [props.task.id, title])
  editing.value = false
}

function startDrag(event) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', props.task.id)
  emit('drag-start', props.task.id)
}
</script>

<template>
  <article
    class="task-card"
    draggable="true"
    :aria-label="`${task.title}, ${statuses[task.status].label}`"
    @dragstart="startDrag"
    @dragend="emit('drag-end')"
    @dragover.prevent.stop
    @drop.prevent.stop="emit('drop-before', task.id)"
    @dblclick="beginEdit"
  >
    <div class="task-card-topline">
      <span class="task-id">#{{ task.id.slice(0, 4).toUpperCase() }}</span>
      <span class="drag-handle" aria-hidden="true">⠿</span>
    </div>

    <form v-if="editing" class="edit-form" @submit.prevent="saveEdit">
      <label class="sr-only" :for="`edit-${task.id}`">Edit task title</label>
      <textarea
        :id="`edit-${task.id}`"
        ref="editInput"
        v-model="draft"
        maxlength="120"
        rows="2"
        @keydown.escape="editing = false"
        @keydown.meta.enter.prevent="saveEdit"
        @keydown.ctrl.enter.prevent="saveEdit"
      ></textarea>
      <div>
        <button type="submit">Save</button>
        <button type="button" @click="editing = false">Cancel</button>
      </div>
    </form>
    <h3 v-else>{{ task.title }}</h3>

    <div class="task-actions">
      <label class="status-select">
        <span class="sr-only">Move {{ task.title }} to another status</span>
        <select :value="task.status" @change="emit('move', [task.id, $event.target.value])">
          <option v-for="(meta, key) in statuses" :key="key" :value="key">{{ meta.label }}</option>
        </select>
      </label>

      <div class="action-buttons">
        <button
          type="button"
          title="Move one column left"
          aria-label="Move one column left"
          @click="emit('nudge', [task.id, -1])"
        >
          ←
        </button>
        <button
          type="button"
          title="Move one column right"
          aria-label="Move one column right"
          @click="emit('nudge', [task.id, 1])"
        >
          →
        </button>
        <button type="button" title="Edit task" aria-label="Edit task" @click="beginEdit">✎</button>
        <button
          class="delete-action"
          type="button"
          title="Delete task"
          aria-label="Delete task"
          @click="emit('delete', task.id)"
        >
          ×
        </button>
      </div>
    </div>
  </article>
</template>
