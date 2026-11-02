import {
  clickHex,
  clickPiece,
  expect,
  findPieceUid,
  saveEvidence,
  setPen,
  startDrag,
  test,
  waitForAppReady,
} from './fixtures'

const snapshot = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__TEST__?.snapshot())

test('logs placement, drag, and undo without blocking the editor', async ({
  page,
}) => {
  await setPen(page, 'g', 1)
  await clickHex(page, { q: 3, r: 2, altitude: 0 })

  const uid = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 3,
    r: 2,
  })
  const log = page.getByRole('log')
  await expect(log).toContainText('Placed 1-hex Grass')
  await expect(page.locator('.action-log')).toHaveCSS('pointer-events', 'none')

  await setPen(page, 'select', 0)
  await clickPiece(page, uid)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([uid])
  await startDrag(page, uid, { q: 4, r: 2, altitude: 0 })
  await expect
    .poll(async () => (await snapshot(page))?.drag?.state)
    .toBe('dragging')
  await page.mouse.up()
  await expect(log).toContainText('Moved 1-hex Grass')

  await page.getByRole('button', { name: /^Undo \(/ }).click()
  await expect(log).toContainText('Undid: Moved 1-hex Grass')

  const expand = page.getByRole('button', { name: 'Expand action log' })
  await expand.hover()
  const collapse = page.getByRole('button', { name: 'Collapse action log' })
  await expect(collapse).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.action-log')).toHaveCSS('pointer-events', 'auto')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() =>
      page
        .locator('.action-log__row')
        .last()
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe('action-log-reduced-fade')

  await page.getByRole('tab', { name: /taking a map picture/ }).click()
  const actionLogSwitch = page.getByRole('checkbox', {
    name: 'Show action log',
  })
  await expect(actionLogSwitch).toBeChecked()
  await actionLogSwitch.uncheck()
  await expect(page.getByRole('log')).toHaveCount(0)
  await actionLogSwitch.check()
  await expect(page.getByRole('log')).toBeVisible()

  const beforeOrbit = await page.evaluate(() => window.__TEST__?.cameraPose())
  const canvas = page.locator('canvas').first()
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Canvas is not visible')
  const start = {
    x: bounds.x + bounds.width * 0.25,
    y: bounds.y + bounds.height * 0.8,
  }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(start.x + step * 15, start.y - step * 6)
  }
  await page.mouse.up()
  await expect
    .poll(async () => page.evaluate(() => window.__TEST__?.cameraPose()))
    .not.toEqual(beforeOrbit)
  await clickPiece(page, uid)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([uid])

  await page.evaluate(() => window.__TEST__?.seedActionLog(12))
  await expect(log.locator('.action-log__row')).toHaveCount(5)
  await expect(
    log.locator('.action-log__row').first().locator('.action-log__age'),
  ).toHaveText('just now')

  const expandAgain = page.getByRole('button', {
    name: 'Expand action log',
  })
  await expandAgain.hover()
  await expect(
    page.getByRole('button', { name: 'Collapse action log' }),
  ).toHaveAttribute('aria-expanded', 'true')
  const list = page.locator('.action-log__list')
  await expect(list.locator('.action-log__row')).toHaveCount(12)
  const listBounds = await list.boundingBox()
  if (!listBounds) throw new Error('Expanded action log is not visible')
  const cameraBeforeWheel = await page.evaluate(() =>
    window.__TEST__?.cameraPose(),
  )
  await expect
    .poll(async () => list.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  const scrollTopBefore = await list.evaluate((element) => element.scrollTop)
  expect(scrollTopBefore).toBeGreaterThan(0)
  await page.mouse.move(
    listBounds.x + listBounds.width / 2,
    listBounds.y + listBounds.height / 2,
  )
  await page.mouse.wheel(0, -160)
  await expect
    .poll(async () => list.evaluate((element) => element.scrollTop))
    .toBeLessThan(scrollTopBefore)
  await expect
    .poll(async () => page.evaluate(() => window.__TEST__?.cameraPose()))
    .toEqual(cameraBeforeWheel)

  await page.evaluate(() => window.__TEST__?.setLookBackgroundColor('#222222'))
  await waitForAppReady(page)
  await saveEvidence(page, 'action-log-dark-expanded', {
    animations: 'disabled',
  })
  await page.evaluate(() => window.__TEST__?.setLookBackgroundColor('#f7edf0'))
  await waitForAppReady(page)
  await saveEvidence(page, 'action-log-light-expanded', {
    animations: 'disabled',
  })

  await page.getByRole('button', { name: 'Collapse action log' }).click()
  await expect(page.locator('.action-log')).toHaveCSS('pointer-events', 'none')
  await saveEvidence(page, 'action-log-light-collapsed', {
    animations: 'disabled',
  })
  await page.evaluate(() => window.__TEST__?.setLookBackgroundColor('#222222'))
  await waitForAppReady(page)
  await saveEvidence(page, 'action-log-dark-collapsed', {
    animations: 'disabled',
  })
})

test('shows relative ages and keeps expanded history after the collapsed timeout', async ({
  page,
}) => {
  const startTime = new Date()
  await page.clock.install({ time: startTime })
  await page.clock.pauseAt(new Date(startTime.getTime() + 1_000))
  await page.evaluate(() => window.__TEST__?.seedActionLog(1))

  const log = page.getByRole('log')
  const row = log.locator('.action-log__row')
  await expect(row.locator('.action-log__age')).toHaveText('just now')

  await page.clock.runFor(5_000)
  await expect(row.locator('.action-log__age')).toHaveText('5s ago')

  await page.getByRole('button', { name: 'Expand action log' }).hover()
  await page.clock.runFor(4_000)
  await expect(row.locator('.action-log__age')).toHaveText(/^[89]s ago$/)
  await expect(row).toHaveCount(1)

  await page.getByRole('button', { name: 'Collapse action log' }).click()
  await expect(row).toHaveCount(0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.__TEST__?.seedActionLog(1))
  const reducedMotionRow = log.locator('.action-log__row')
  await page.clock.runFor(8_000)
  await expect(reducedMotionRow).toHaveCount(0)
})
