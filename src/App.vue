<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AddTaskForm from './components/AddTaskForm.vue'
import BoardColumn from './components/BoardColumn.vue'
import { TASK_STATUSES, useTaskStore } from './store/task.js'

const STATUS_META = {
  todo: { label: 'To do', eyebrow: 'QUEUE', tone: 'cyan' },
  progress: { label: 'In progress', eyebrow: 'ACTIVE', tone: 'violet' },
  done: { label: 'Done', eyebrow: 'SHIPPED', tone: 'lime' },
}

const taskStore = useTaskStore()
taskStore.initialize()

const query = ref('')
const statusFilter = ref('all')
const draggedTaskId = ref(null)
const deletedTask = ref(null)
let undoTimer

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const visibleStatuses = computed(() =>
  statusFilter.value === 'all' ? TASK_STATUSES : [statusFilter.value],
)

const filteredTasks = (status) =>
  taskStore
    .tasksByStatus(status)
    .filter((task) => task.title.toLowerCase().includes(normalizedQuery.value))

function startDragging(taskId) {
  draggedTaskId.value = taskId
}

function dropTask(status, beforeTaskId = null) {
  if (!draggedTaskId.value) return
  taskStore.moveTask(draggedTaskId.value, status, beforeTaskId)
  draggedTaskId.value = null
}

function moveTask(taskId, status) {
  taskStore.moveTask(taskId, status)
}

function nudgeTask(taskId, direction) {
  const task = taskStore.tasks.find((item) => item.id === taskId)
  if (!task) return
  const currentIndex = TASK_STATUSES.indexOf(task.status)
  const nextStatus = TASK_STATUSES[currentIndex + direction]
  if (nextStatus) taskStore.moveTask(taskId, nextStatus)
}

function removeTask(taskId) {
  clearTimeout(undoTimer)
  deletedTask.value = taskStore.removeTask(taskId)
  if (deletedTask.value) {
    undoTimer = setTimeout(() => {
      deletedTask.value = null
    }, 6000)
  }
}

function undoDelete() {
  if (!deletedTask.value) return
  taskStore.restoreTask(deletedTask.value)
  deletedTask.value = null
  clearTimeout(undoTimer)
}

function resetDemo() {
  if (window.confirm('Reset the board and restore the demo tasks?')) {
    taskStore.resetDemo()
    query.value = ''
    statusFilter.value = 'all'
  }
}

onBeforeUnmount(() => clearTimeout(undoTimer))
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-[#07090d] text-slate-100">
    <div class="ambient ambient-cyan" aria-hidden="true"></div>
    <div class="ambient ambient-violet" aria-hidden="true"></div>

    <header class="relative z-10 border-b border-white/8">
      <div class="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8">
        <a
          href="#main-content"
          class="group flex items-center gap-3"
          aria-label="Vue Task Board home"
        >
          <span class="brand-mark" aria-hidden="true">
            <span></span>
          </span>
          <span>
            <strong class="block text-sm font-extrabold tracking-tight text-white"
              >TASK/BOARD</strong
            >
            <span class="font-mono text-[10px] tracking-[0.2em] text-cyan-300">BUILT WITH VUE</span>
          </span>
        </a>

        <div class="flex items-center gap-3">
          <div class="hidden items-center gap-2 font-mono text-[11px] text-slate-500 sm:flex">
            <span class="status-pulse"></span>
            LOCAL SYNC ACTIVE
          </div>
          <button
            class="icon-button"
            type="button"
            aria-label="Reset demo board"
            @click="resetDemo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 4v6h6M20 20v-6h-6M5.6 15a7 7 0 0 0 11.7 2.6L20 14M4 10l2.7-3.6A7 7 0 0 1 18.4 9"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main
      id="main-content"
      class="relative z-10 mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:py-14"
    >
      <section class="mb-10 grid items-end gap-8 lg:grid-cols-[1fr_28rem]">
        <div>
          <p class="section-kicker">YOUR WORKSPACE / {{ taskStore.taskCount }} TASKS</p>
          <h1
            class="mt-4 max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl"
          >
            Focus on what<br />
            <span class="text-gradient">moves forward.</span>
          </h1>
          <p class="mt-5 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            A focused Kanban board for turning scattered thoughts into shipped work. Everything
            stays in your browser.
          </p>
        </div>
        <AddTaskForm :statuses="STATUS_META" @add="taskStore.addTask" />
      </section>

      <div
        v-if="taskStore.storageError"
        class="mb-6 rounded-lg border border-amber-300/30 bg-amber-300/8 px-4 py-3 text-sm text-amber-200"
        role="alert"
      >
        {{ taskStore.storageError }}
      </div>

      <section aria-label="Board controls" class="toolbar">
        <label class="search-box">
          <span class="sr-only">Search tasks</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input v-model="query" type="search" placeholder="Search tasks..." />
          <kbd class="hidden sm:inline">/</kbd>
        </label>

        <div class="filter-tabs" aria-label="Filter board by status">
          <button
            v-for="filter in ['all', ...TASK_STATUSES]"
            :key="filter"
            type="button"
            :class="{ active: statusFilter === filter }"
            :aria-pressed="statusFilter === filter"
            @click="statusFilter = filter"
          >
            {{ filter === 'all' ? 'All' : STATUS_META[filter].label }}
            <span>{{
              filter === 'all' ? taskStore.taskCount : taskStore.countByStatus(filter)
            }}</span>
          </button>
        </div>
      </section>

      <section
        class="board-grid"
        :class="{ 'board-grid-single': visibleStatuses.length === 1 }"
        aria-label="Kanban board"
      >
        <BoardColumn
          v-for="status in visibleStatuses"
          :key="status"
          :status="status"
          :meta="STATUS_META[status]"
          :tasks="filteredTasks(status)"
          :all-statuses="STATUS_META"
          :dragging="Boolean(draggedTaskId)"
          @drag-start="startDragging"
          @drag-end="draggedTaskId = null"
          @drop-task="dropTask"
          @update-task="taskStore.updateTask"
          @delete-task="removeTask"
          @move-task="moveTask"
          @nudge-task="nudgeTask"
        />
      </section>

      <p class="mt-8 text-center font-mono text-[10px] tracking-[0.18em] text-slate-600">
        DRAG TO MOVE · DOUBLE-CLICK TO EDIT · STORED LOCALLY
      </p>
    </main>

    <Transition name="toast">
      <div v-if="deletedTask" class="toast" role="status" aria-live="polite">
        <span>Task deleted</span>
        <button type="button" @click="undoDelete">Undo</button>
      </div>
    </Transition>
  </div>
</template>
