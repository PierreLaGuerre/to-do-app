import { expect, test } from '@playwright/test'

test('creates, moves and persists a task', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /no more excuses, just do it/i })).toBeVisible()
  await page.getByLabel('Task title').fill('Prepare junior interview')
  await page.getByRole('button', { name: 'Add task' }).click()

  const card = page.getByLabel(/Prepare junior interview, To do/i)
  await expect(card).toBeVisible()
  await card.getByLabel('Move Prepare junior interview to another status').selectOption('done')
  await expect(page.getByLabel(/Prepare junior interview, Done/i)).toBeVisible()

  await page.reload()
  await expect(page.getByLabel(/Prepare junior interview, Done/i)).toBeVisible()
})
