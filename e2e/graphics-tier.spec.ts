import {
  clickHex,
  clickPiece,
  dragPiece,
  expect,
  findPieceUid,
  FIXTURE_URL,
  hoverHex,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

test('graphics tier loads Medium textures and returns to the classic Low renderer', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  await expect
    .poll(async () =>
      page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
    )
    .toBe('legacy')
  await page.locator('#simple-tab-3').click()

  const graphics = page.getByTestId('graphics-tier-select')
  const lookSettings = page.getByRole('button', { name: '3D look...' })
  await expect(graphics).toBeVisible()
  await expect(lookSettings).toHaveCount(0)
  await page.getByText('Graphics', { exact: true }).hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Low uses the classic look with no textures. Medium uses diffuse textures. High adds PBR normal and ORM maps, enables lights and shadows, and uses alternate cap images.',
  )
  await page.mouse.move(0, 0)
  await expect(page.getByRole('tooltip')).toBeHidden()
  await graphics.click()
  await page.getByRole('option', { name: 'Medium (diffuse textures)' }).click()
  await expect(page.getByTestId('graphics-texture-status')).toHaveText(
    'Textures ready',
  )
  await expect(lookSettings).toBeVisible()
  await expect
    .poll(async () =>
      page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
    )
    .toBe('per-hex')
  await lookSettings.click()
  const lookDialog = page.getByRole('dialog', { name: '3D look settings' })
  await expect(lookDialog).toBeVisible()

  await graphics.click()
  await page.getByRole('option', { name: 'Low (classic look)' }).click()
  await expect(graphics).toContainText('Low (classic look)')
  await expect(lookSettings).toHaveCount(0)
  await expect(lookDialog).toBeHidden()
  await expect
    .poll(async () =>
      page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
    )
    .toBe('legacy')
  await expect(page.getByTestId('graphics-texture-status')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('hover, paint, select, and drag work in every graphics tier', async ({
  page,
}) => {
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  const graphics = page.getByTestId('graphics-tier-select')
  const rockUID = await findPieceUid(page, { inventoryID: 'r1' })
  let rockHex = { q: 1, r: 2, altitude: 1 }

  const tiers = [
    {
      label: 'Low (classic look)',
      renderer: 'legacy',
      paintHex: { q: 0, r: 0, altitude: 0 },
      dragHex: { q: 2, r: 2, altitude: 1 },
    },
    {
      label: 'Medium (diffuse textures)',
      renderer: 'per-hex',
      paintHex: { q: 1, r: 0, altitude: 0 },
      dragHex: { q: 1, r: 2, altitude: 1 },
    },
    {
      label: 'High (PBR textures)',
      renderer: 'per-hex',
      paintHex: { q: 2, r: 0, altitude: 0 },
      dragHex: { q: 2, r: 2, altitude: 1 },
    },
  ] as const

  for (const [index, tier] of tiers.entries()) {
    if (index > 0) {
      await graphics.click()
      await page.getByRole('option', { name: tier.label }).click()
      await expect(page.getByTestId('graphics-texture-status')).toHaveText(
        'Textures ready',
      )
    }

    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
      )
      .toBe(tier.renderer)
    if (index > 0) {
      await expect
        .poll(async () =>
          page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
        )
        .toEqual([])
    }

    await hoverHex(page, rockHex)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().hoveredPieceID),
      )
      .toBe(rockUID)
    await clickPiece(page, rockUID)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
      )
      .toEqual([rockUID])

    await dragPiece(page, rockUID, tier.dragHex)
    await expect
      .poll(async () =>
        page.evaluate(
          (uid) =>
            window.__TEST__?.listPieces().find((piece) => piece.uid === uid)
              ?.pieceCoords,
          rockUID,
        ),
      )
      .toMatchObject({ q: tier.dragHex.q, r: tier.dragHex.r })
    rockHex = tier.dragHex

    await setPen(page, 'gn', 1)
    await clickHex(page, tier.paintHex)
    await expect
      .poll(async () =>
        page.evaluate(
          ({ paintHex }) =>
            window.__TEST__
              ?.listPieces()
              .some(
                (piece) =>
                  piece.inventoryID === 'gn1' &&
                  piece.pieceCoords.q === paintHex.q &&
                  piece.pieceCoords.r === paintHex.r,
              ),
          { paintHex: tier.paintHex },
        ),
      )
      .toBe(true)
    await setPen(page, 'select', 1)
  }
})

test('picture-only High restores the previous graphics and lighting settings', async ({
  page,
}) => {
  await page.goto(FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  await page.getByRole('button', { name: 'Take map picture' }).click()

  const pictureHigh = page.getByRole('checkbox', {
    name: 'High Quality graphics by default',
  })
  await expect(pictureHigh).toBeVisible()
  await pictureHigh.check()
  await page.getByRole('button', { name: 'Take picture', exact: true }).click()

  const cropDialog = page.getByRole('dialog', { name: 'Crop map picture' })
  await expect(cropDialog).toBeVisible({ timeout: 60_000 })
  await cropDialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(cropDialog).toBeHidden()
  await expect(page.getByTestId('graphics-tier-select')).toContainText(
    'Low (classic look)',
  )
  await expect
    .poll(async () =>
      page.evaluate(() => window.__TEST__?.snapshot().landRenderer),
    )
    .toBe('legacy')
  await expect(
    page.getByRole('checkbox', { name: 'Render Lights and Shadows' }),
  ).not.toBeChecked()
  await expect(pictureHigh).toBeChecked()
})
