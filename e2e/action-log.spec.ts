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

test('keeps expanded history after the collapsed timeout', async ({ page }) => {
  const startTime = new Date()
  await page.clock.install({ time: startTime })
  await page.clock.pauseAt(new Date(startTime.getTime() + 1_000))
  await page.evaluate(() => window.__TEST__?.seedActionLog(1))

  const log = page.getByRole('log')
  const row = log.locator('.action-log__row')
  await expect(row).toHaveCount(1)

  await page.clock.runFor(5_000)
  await expect(row).toHaveCount(1)

  await page.getByRole('button', { name: 'Expand action log' }).hover()
  await page.clock.runFor(4_000)
  await expect(row).toHaveCount(1)

  await page.getByRole('button', { name: 'Collapse action log' }).click()
  await expect(row).toHaveCount(0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.__TEST__?.seedActionLog(1))
  const reducedMotionRow = log.locator('.action-log__row')
  await page.clock.runFor(8_000)
  await expect(reducedMotionRow).toHaveCount(0)
})

test('disables selection recall links while their action row fades', async ({
  page,
}) => {
  await page.clock.install()
  await waitForAppReady(page)
  await setPen(page, 'g', 1)
  await clickHex(page, { q: 3, r: 2, altitude: 0 })

  const recall = page.getByRole('button', {
    name: 'Recall selection: 1-hex Grass',
  })
  await expect(recall).toBeEnabled()

  await page.clock.runFor(8_000)
  const row = page.locator('.action-log__row').last()
  await expect(row).toHaveClass(/action-log__row--idle/)
  await expect(recall).toBeDisabled()
  await recall.focus()
  await expect(recall).not.toBeFocused()
})

test('placement hotkeys rotate the preview and the action log restores selection', async ({
  page,
}) => {
  const uid = await findPieceUid(page, {
    inventoryID: 'g1',
    q: 0,
    r: 2,
  })
  await clickPiece(page, uid)
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([uid])

  await page.keyboard.press('g')
  await expect.poll(async () => (await snapshot(page))?.penMode).toBe('g')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([])
  const beforeRotation = await snapshot(page)
  const pieceBefore = await page.evaluate(
    (pieceUID) =>
      window.__TEST__?.listPieces().find((piece) => piece.uid === pieceUID)
        ?.rotation,
    uid,
  )

  await page.keyboard.press('q')

  await expect
    .poll(async () =>
      page.evaluate(
        () => window.__TEST__?.snapshot().placementPreview?.rotation,
      ),
    )
    .not.toBe(beforeRotation?.placementPreview?.rotation)
  await expect
    .poll(async () =>
      page.evaluate(
        (pieceUID) =>
          window.__TEST__?.listPieces().find((piece) => piece.uid === pieceUID)
            ?.rotation,
        uid,
      ),
    )
    .toBe(pieceBefore)

  const recall = page.getByRole('button', {
    name: 'Recall selection: 1 piece',
  })
  await expect(recall).toBeEnabled()
  await page.mouse.move(0, 0)
  await recall.click()

  await expect.poll(async () => (await snapshot(page))?.penMode).toBe('select')
  await expect
    .poll(async () => (await snapshot(page))?.selectedPieceIDs)
    .toEqual([uid])
})
