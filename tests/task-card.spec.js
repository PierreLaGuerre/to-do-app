import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from '../src/components/TaskCard.vue'

const task = {
  id: 'task-1234',
  title: 'Polish the portfolio',
  status: 'todo',
  order: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const statuses = {
  todo: { label: 'To do' },
  progress: { label: 'In progress' },
  done: { label: 'Done' },
}

describe('TaskCard', () => {
  it('allows editing a task without dragging', async () => {
    const wrapper = mount(TaskCard, { props: { task, statuses } })
    await wrapper.get('[aria-label="Edit task"]').trigger('click')
    await wrapper.get('textarea').setValue('Portfolio ready')
    await wrapper.get('.edit-form').trigger('submit')

    expect(wrapper.emitted('update')[0]).toEqual([['task-1234', 'Portfolio ready']])
  })

  it('offers keyboard-friendly movement controls', async () => {
    const wrapper = mount(TaskCard, { props: { task, statuses } })
    await wrapper.get('[aria-label="Move one column right"]').trigger('click')
    await wrapper.get('.status-select select').setValue('done')

    expect(wrapper.emitted('nudge')[0]).toEqual([['task-1234', 1]])
    expect(wrapper.emitted('move')[0]).toEqual([['task-1234', 'done']])
  })
})
