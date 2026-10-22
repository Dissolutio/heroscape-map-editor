import { expect, test } from './fixtures'

test('first visit stores the release id without opening the dialog', async ({
  page,
}) => {
  await page.goto('/hs?e2e=1')
  await page.waitForFunction(() => window.__APP_READY__ === true)

  await expect(page.getByRole('dialog', { name: "What's new" })).toHaveCount(0)
  const storedId = await page.evaluate(() => {
    const raw = localStorage.getItem('whatsNewLastSeen')
    return raw ? JSON.parse(raw) : null
  })
  expect(storedId).toBe('Oct-18-2026')
})

test('shows unseen releases and the button reopens the latest entries', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('whatsNewLastSeen', JSON.stringify('Oct-17-2026'))
  })
  await page.goto('/hs?e2e=1&whats-new=1')
  await page.waitForFunction(() => window.__APP_READY__ === true)

  const dialog = page.getByRole('dialog', { name: "What's new" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Oct-18-2026' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()

  const storedId = await page.evaluate(() => {
    const raw = localStorage.getItem('whatsNewLastSeen')
    return raw ? JSON.parse(raw) : null
  })
  expect(storedId).toBe('Oct-18-2026')

  await page.getByRole('button', { name: "What's new" }).click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Oct-18-2026' })).toBeVisible()
})
