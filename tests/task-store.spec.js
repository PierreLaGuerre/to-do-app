import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { STORAGE_KEY, useTaskStore } from '../src/store/task.js'

describe('task store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with demo tasks and persists them', () => {
    const store = useTaskStore()
    store.initialize()

    expect(store.tasks).toHaveLength(3)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toMatchObject({ version: 1 })
  })

  it('restores valid persisted tasks', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        tasks: [
          {
            id: 'saved',
            title: 'Persisted task',
            status: 'todo',
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    )

    const store = useTaskStore()
    store.initialize()
    expect(store.tasks.map((task) => task.title)).toEqual(['Persisted task'])
  })

  it('recovers from malformed local data', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    const store = useTaskStore()
    store.initialize()

    expect(store.tasks).toHaveLength(3)
    expect(store.storageError).toContain('could not be read')
  })

  it('creates, edits and deletes a task', () => {
    const store = useTaskStore()
    store.initialize()
    const task = store.addTask('  Ship portfolio  ', 'progress')

    expect(task.title).toBe('Ship portfolio')
    expect(store.updateTask(task.id, 'Ship it')).toBe(true)
    expect(store.tasks.find((item) => item.id === task.id).title).toBe('Ship it')
    expect(store.removeTask(task.id)).toMatchObject({ id: task.id })
    expect(store.tasks.some((item) => item.id === task.id)).toBe(false)
  })

  it('moves and reorders tasks between columns', () => {
    const store = useTaskStore()
    store.initialize()
    const first = store.addTask('First', 'todo')
    const second = store.addTask('Second', 'done')

    store.moveTask(first.id, 'done', second.id)

    expect(store.tasksByStatus('done').map((task) => task.id)).toEqual([
      'demo-coffee',
      first.id,
      second.id,
    ])
    expect(store.tasks.find((task) => task.id === first.id).status).toBe('done')
  })

  it('reports storage failures without losing in-memory changes', () => {
    const store = useTaskStore()
    store.initialize()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    store.addTask('Still in memory')

    expect(store.tasks.some((task) => task.title === 'Still in memory')).toBe(true)
    expect(store.storageError).toContain('cannot be saved')
    vi.restoreAllMocks()
  })
})
