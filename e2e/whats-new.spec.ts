import { readFile } from 'node:fs/promises'
import { parseReleaseNotes } from '../src/data/releaseNotes'
import { expect, test } from './fixtures'

const getReleaseIds = async () => {
  const releaseNotes = await readFile(
    new URL('../release-notes.md', import.meta.url),
    'utf8',
  )
  const entries = parseReleaseNotes(releaseNotes)

  if (entries.length < 2) {
    throw new Error(
      `What's New tests require at least two release-note entries; found ${entries.length}`,
    )
  }

  return {
    newestId: entries[0].id,
    previousId: entries[1].id,
  }
}

test('first visit stores the release id without opening the dialog', async ({
  page,
}) => {
  const { newestId } = await getReleaseIds()
  await page.goto('/hs?e2e=1')
  await page.waitForFunction(() => window.__APP_READY__ === true)

  await expect(page.getByRole('dialog', { name: "What's new" })).toHaveCount(0)
  const storedId = await page.evaluate(() => {
    const raw = localStorage.getItem('whatsNewLastSeen')
    return raw ? JSON.parse(raw) : null
  })
  expect(storedId).toBe(newestId)
})

test('shows unseen releases and the button reopens the latest entries', async ({
  page,
}) => {
  const { newestId, previousId } = await getReleaseIds()
  await page.addInitScript((id) => {
    localStorage.setItem('whatsNewLastSeen', JSON.stringify(id))
  }, previousId)
  await page.goto('/hs?e2e=1&whats-new=1')
  await page.waitForFunction(() => window.__APP_READY__ === true)

  const dialog = page.getByRole('dialog', { name: "What's new" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: newestId })).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toBeHidden()

  const storedId = await page.evaluate(() => {
    const raw = localStorage.getItem('whatsNewLastSeen')
    return raw ? JSON.parse(raw) : null
  })
  expect(storedId).toBe(newestId)

  await page.getByRole('button', { name: "What's new" }).click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: newestId })).toBeVisible()
})
