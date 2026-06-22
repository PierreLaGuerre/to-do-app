import { defineStore } from 'pinia'

export const STORAGE_KEY = 'vue-task-board:v1'
export const TASK_STATUSES = ['todo', 'progress', 'done']

const now = () => new Date().toISOString()
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`

const seedTasks = () => [
  {
    id: 'demo-brief',
    title: 'Shape the product brief',
    status: 'todo',
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'demo-components',
    title: 'Build the Vue components',
    status: 'progress',
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'demo-coffee',
    title: 'Make excellent coffee',
    status: 'done',
    order: 0,
    createdAt: now(),
    updatedAt: now(),
  },
]

const isValidTask = (task) =>
  task &&
  typeof task.id === 'string' &&
  typeof task.title === 'string' &&
  TASK_STATUSES.includes(task.status) &&
  Number.isFinite(task.order)

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    initialized: false,
    storageError: '',
  }),

  getters: {
    taskCount: (state) => state.tasks.length,
    countByStatus: (state) => (status) =>
      state.tasks.filter((task) => task.status === status).length,
    tasksByStatus: (state) => (status) =>
      state.tasks.filter((task) => task.status === status).sort((a, b) => a.order - b.order),
  },

  actions: {
    initialize() {
      if (this.initialized) return

      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) {
          this.tasks = seedTasks()
          this.persist()
        } else {
          const parsed = JSON.parse(stored)
          if (
            parsed.version !== 1 ||
            !Array.isArray(parsed.tasks) ||
            !parsed.tasks.every(isValidTask)
          ) {
            throw new Error('Unsupported task data')
          }
          this.tasks = parsed.tasks
        }
      } catch {
        this.tasks = seedTasks()
        this.storageError = 'Saved data could not be read. The demo board was restored.'
      } finally {
        this.initialized = true
      }
    },

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: this.tasks }))
        this.storageError = ''
      } catch {
        this.storageError = 'Changes cannot be saved in this browser.'
      }
    },

    addTask(title, status = 'todo') {
      const cleanTitle = title.trim().slice(0, 120)
      if (!cleanTitle || !TASK_STATUSES.includes(status)) return null

      const timestamp = now()
      const task = {
        id: makeId(),
        title: cleanTitle,
        status,
        order: this.tasks.filter((item) => item.status === status).length,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      this.tasks.push(task)
      this.persist()
      return task
    },

    updateTask(id, title) {
      const task = this.tasks.find((item) => item.id === id)
      const cleanTitle = title.trim().slice(0, 120)
      if (!task || !cleanTitle) return false
      task.title = cleanTitle
      task.updatedAt = now()
      this.persist()
      return true
    },

    removeTask(id) {
      const index = this.tasks.findIndex((task) => task.id === id)
      if (index === -1) return null
      const [removed] = this.tasks.splice(index, 1)
      this.normalizeOrders(removed.status)
      this.persist()
      return { ...removed }
    },

    restoreTask(task) {
      if (!isValidTask(task) || this.tasks.some((item) => item.id === task.id)) return
      this.tasks.push({ ...task, updatedAt: now() })
      this.normalizeOrders(task.status)
      this.persist()
    },

    moveTask(id, status, beforeTaskId = null) {
      const task = this.tasks.find((item) => item.id === id)
      if (!task || !TASK_STATUSES.includes(status) || id === beforeTaskId) return

      const previousStatus = task.status
      const destination = this.tasksByStatus(status).filter((item) => item.id !== id)
      const destinationIndex = beforeTaskId
        ? Math.max(
            0,
            destination.findIndex((item) => item.id === beforeTaskId),
          )
        : destination.length

      task.status = status
      task.updatedAt = now()
      destination.splice(destinationIndex, 0, task)
      destination.forEach((item, index) => {
        item.order = index
      })
      this.normalizeOrders(previousStatus)
      this.persist()
    },

    normalizeOrders(status) {
      this.tasksByStatus(status).forEach((task, index) => {
        task.order = index
      })
    },

    resetDemo() {
      this.tasks = seedTasks()
      this.persist()
    },
  },
})
