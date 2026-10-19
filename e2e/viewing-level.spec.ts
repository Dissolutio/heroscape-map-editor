import { expect, mapUrl, test, waitForAppReady } from './fixtures'

const multilevelUrl = mapUrl(
  {
    id: 'viewing-level-repro',
    name: 'Viewing Level Repro',
    author: 'test',
    version: 1,
    shape: 'rectangle',
    width: 6,
    length: 6,
  },
  ['0~1~2~0~g1', '1~1~2~0~g1', '2~1~2~0~g1', '3~1~2~0~g1'],
)

const cameraPose = (page: Parameters<typeof waitForAppReady>[0]) =>
  page.evaluate(() => window.__TEST__?.cameraPose())

test('viewing level hotkeys and spinner preserve the camera and map maximum', async ({
  page,
}) => {
  await page.goto(multilevelUrl)
  await waitForAppReady(page)

  const levelInput = page.locator('input[type="number"]')
  const cameraBefore = await cameraPose(page)
  await expect(levelInput).toHaveAttribute('min', '0')
  expect(await levelInput.getAttribute('max')).toBe('4')
  await expect(levelInput).toHaveValue('4')

  for (const level of [3, 2, 1, 0]) {
    await page.keyboard.press('PageDown')
    await expect(levelInput).toHaveValue(String(level))
    expect(await levelInput.getAttribute('max')).toBe('4')
    await waitForAppReady(page)
    expect(await cameraPose(page)).toEqual(cameraBefore)
  }

  await levelInput.focus()
  await levelInput.press('ArrowUp')
  expect(await levelInput.inputValue()).toBe('1')
  expect(await levelInput.getAttribute('max')).toBe('4')
  await waitForAppReady(page)
  expect(await cameraPose(page)).toEqual(cameraBefore)

  await levelInput.press('Tab')
  await page.keyboard.press('PageDown')
  await expect(levelInput).toHaveValue('0')
  await waitForAppReady(page)
  expect(await cameraPose(page)).toEqual(cameraBefore)

  await page.keyboard.press('PageUp')
  expect(await levelInput.inputValue()).toBe('1')
  expect(await levelInput.getAttribute('max')).toBe('4')
  await waitForAppReady(page)
  expect(await cameraPose(page)).toEqual(cameraBefore)
})

test('typing a viewing level preserves the camera and map-derived maximum', async ({
  page,
}) => {
  await page.goto(multilevelUrl)
  await waitForAppReady(page)

  const levelInput = page.locator('input[type="number"]')
  const cameraBefore = await cameraPose(page)

  await levelInput.fill('0')
  await expect(levelInput).toHaveValue('0')
  expect(await levelInput.getAttribute('max')).toBe('4')
  await waitForAppReady(page)
  expect(await cameraPose(page)).toEqual(cameraBefore)

  await levelInput.fill('1')
  await expect(levelInput).toHaveValue('1')
  expect(await levelInput.getAttribute('max')).toBe('4')
  await waitForAppReady(page)
  expect(await cameraPose(page)).toEqual(cameraBefore)
})
