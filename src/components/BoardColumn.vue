<script setup>
import { ref } from 'vue'
import TaskCard from './TaskCard.vue'

defineProps({
  status: { type: String, required: true },
  meta: { type: Object, required: true },
  tasks: { type: Array, required: true },
  allStatuses: { type: Object, required: true },
  dragging: Boolean,
})

const emit = defineEmits([
  'drag-start',
  'drag-end',
  'drop-task',
  'update-task',
  'delete-task',
  'move-task',
  'nudge-task',
])

const dragOver = ref(false)

function drop(status) {
  dragOver.value = false
  emit('drop-task', status)
}
</script>

<template>
  <article
    class="board-column"
    :class="[`tone-${meta.tone}`, { 'is-drag-over': dragOver && dragging }]"
    @dragenter.prevent="dragOver = true"
    @dragover.prevent
    @dragleave.self="dragOver = false"
    @drop.prevent="drop(status)"
  >
    <header class="column-header">
      <div>
        <p>{{ meta.eyebrow }}</p>
        <h2>{{ meta.label }}</h2>
      </div>
      <span class="column-count">{{ tasks.length.toString().padStart(2, '0') }}</span>
    </header>

    <div class="task-list">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :statuses="allStatuses"
        @drag-start="emit('drag-start', $event)"
        @drag-end="emit('drag-end')"
        @drop-before="emit('drop-task', status, $event)"
        @update="emit('update-task', ...$event)"
        @delete="emit('delete-task', $event)"
        @move="emit('move-task', ...$event)"
        @nudge="emit('nudge-task', ...$event)"
      />

      <div v-if="!tasks.length" class="empty-state">
        <span aria-hidden="true">+</span>
        <p>No tasks here yet.</p>
        <small>Drop one or add something new.</small>
      </div>
    </div>
  </article>
</template>
