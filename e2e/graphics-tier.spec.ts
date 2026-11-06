import {
  clickHex,
  clickPiece,
  dragPiece,
  expect,
  findPieceUid,
  FIXTURE_URL,
  hoverHex,
  mapUrl,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'

const HIVE_FIXTURE_URL = mapUrl(FIXTURE_HEX_MAP, [
  ...FIXTURE_PIECE_IDS,
  '0~0~0~0~h',
])
const EVERGREEN_FIXTURE_URL = mapUrl(FIXTURE_HEX_MAP, [
  ...FIXTURE_PIECE_IDS,
  '0~0~0~0~tr10',
  '0~5~0~0~tr11',
  '0~-3~5~0~tr12',
  '0~2~5~0~tr15',
])
const ROAD_WALL_FIXTURE_URL = mapUrl(FIXTURE_HEX_MAP, [
  ...FIXTURE_PIECE_IDS,
  '0~2~4~0~rw',
])

const RUINS_FIXTURE_URL = mapUrl(FIXTURE_HEX_MAP, [
  ...FIXTURE_PIECE_IDS,
  '0~3~0~0~rs2',
  '0~0~5~0~rs3',
])

const EVERGREEN_PIECES = [
  { inventoryID: 'tr10', q: 0, r: 0 },
  { inventoryID: 'tr11', q: 5, r: 0 },
  { inventoryID: 'tr12', q: -3, r: 5 },
  { inventoryID: 'tr15', q: 2, r: 5 },
]

const MARVEL_RUIN_PIECES = [
  {
    inventoryID: 'rm',
    q: 0,
    r: 0,
    parts: [
      'MarvelRuinLeft',
      'MarvelRuinFront',
      'MarvelRuinBack',
      'MarvelRuinUpperFloor',
    ],
  },
  {
    inventoryID: 'rmb',
    q: 4,
    r: 0,
    parts: [
      'MarvelRuinLeft',
      'MarvelRuinFrontBroken',
      'MarvelRuinBackBroken',
      'MarvelRuinUpperFloor',
    ],
  },
  {
    inventoryID: 'rmn',
    q: -2,
    r: 5,
    parts: ['MarvelRuinLeft', 'MarvelRuinFront', 'MarvelRuinBack'],
  },
  {
    inventoryID: 'rmnb',
    q: 3,
    r: 5,
    parts: ['MarvelRuinLeft', 'MarvelRuinFrontBroken', 'MarvelRuinBackBroken'],
  },
] as const
const MARVEL_RUIN_FIXTURE_URL = mapUrl(FIXTURE_HEX_MAP, [
  ...FIXTURE_PIECE_IDS,
  ...MARVEL_RUIN_PIECES.map(
    ({ inventoryID, q, r }) => `0~${q}~${r}~0~${inventoryID}`,
  ),
])

test('Marvel Ruins render their parts and stay selectable by graphics tier', async ({
  page,
}) => {
  await page.goto(MARVEL_RUIN_FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const graphics = page.getByTestId('graphics-tier-select')
  await graphics.click()
  await page.getByRole('option', { name: 'Low (classic look)' }).click()
  const ruinUIDs = await Promise.all(
    MARVEL_RUIN_PIECES.map((piece) => findPieceUid(page, piece)),
  )
  const tiers = [
    { label: 'Low (classic look)', hasMap: false },
    { label: 'Medium (diffuse textures)', hasMap: true },
    { label: 'High (PBR textures)', hasMap: true },
  ]

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
        page.evaluate(() => window.__TEST__?.snapshot().marvelRuinMaterials),
      )
      .toEqual(
        expect.arrayContaining(
          MARVEL_RUIN_PIECES.flatMap(({ parts }, index) =>
            parts.map((part) =>
              expect.objectContaining({
                uid: ruinUIDs[index],
                part,
                hasMap: tier.hasMap,
              }),
            ),
          ),
        ),
      )

    for (const uid of ruinUIDs) {
      await page.mouse.move(0, 0)
      const alreadySelected = await page.evaluate(
        (id) =>
          window.__TEST__?.snapshot().selectedPieceIDs.includes(id) ?? false,
        uid,
      )
      if (alreadySelected) await clickPiece(page, uid)
      await clickPiece(page, uid)
      await expect
        .poll(async () =>
          page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
        )
        .toContain(uid)
    }
  }
})

test('the Marro Hive stays selectable and uses texture maps by graphics tier', async ({
  page,
}) => {
  await page.goto(HIVE_FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const graphics = page.getByTestId('graphics-tier-select')
  const hiveUID = await findPieceUid(page, {
    inventoryID: 'h',
    q: 0,
    r: 0,
  })
  const tiers = [
    { label: 'Low (classic look)', hasMap: false },
    { label: 'Medium (diffuse textures)', hasMap: true },
    { label: 'High (PBR textures)', hasMap: true },
  ]

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
        page.evaluate(
          (uid) =>
            window.__TEST__
              ?.snapshot()
              .marroHiveMaterials.find((material) => material.uid === uid) ??
            null,
          hiveUID,
        ),
      )
      .toMatchObject({ hasMap: tier.hasMap })

    await page.mouse.move(10, 700)
    const selected = await page.evaluate(
      (uid) =>
        window.__TEST__?.snapshot().selectedPieceIDs.includes(uid) ?? false,
      hiveUID,
    )
    if (selected) await clickPiece(page, hiveUID)
    await clickPiece(page, hiveUID)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
      )
      .toContain(hiveUID)
  }
})

test('evergreen trees stay selectable and use texture maps by graphics tier', async ({
  page,
}) => {
  await page.goto(EVERGREEN_FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const graphics = page.getByTestId('graphics-tier-select')
  await graphics.click()
  await page.getByRole('option', { name: 'Low (classic look)' }).click()
  const treeUIDs = await Promise.all(
    EVERGREEN_PIECES.map((piece) => findPieceUid(page, piece)),
  )
  const tiers = [
    { label: 'Low (classic look)', hasTreeMaps: false },
    { label: 'Medium (diffuse textures)', hasTreeMaps: true },
    { label: 'High (PBR textures)', hasTreeMaps: true },
  ]

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
        page.evaluate(() => window.__TEST__?.snapshot().evergreenTreeMaterials),
      )
      .toEqual(
        expect.arrayContaining(
          treeUIDs.flatMap((uid, index) =>
            (index === treeUIDs.length - 1
              ? ['tree', 'boulders', 'base']
              : ['tree']
            ).map((part) =>
              expect.objectContaining({
                uid,
                part,
                hasMap:
                  tier.hasTreeMaps && (part === 'tree' || part === 'boulders'),
              }),
            ),
          ),
        ),
      )

    for (const uid of treeUIDs) {
      await page.mouse.move(0, 0)
      const alreadySelected = await page.evaluate(
        (id) =>
          window.__TEST__?.snapshot().selectedPieceIDs.includes(id) ?? false,
        uid,
      )
      if (alreadySelected) await clickPiece(page, uid)
      await clickPiece(page, uid)
      await expect
        .poll(async () =>
          page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
        )
        .toContain(uid)
    }
  }
})

test('the Stone Wall stays selectable and uses texture maps by graphics tier', async ({
  page,
}) => {
  await page.goto(ROAD_WALL_FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()

  const graphics = page.getByTestId('graphics-tier-select')
  await graphics.click()
  await page.getByRole('option', { name: 'Low (classic look)' }).click()
  const roadWallUID = await findPieceUid(page, {
    inventoryID: 'rw',
    q: 2,
    r: 4,
  })
  const tiers = [
    { label: 'Low (classic look)', hasMap: false },
    { label: 'Medium (diffuse textures)', hasMap: true },
    { label: 'High (PBR textures)', hasMap: true },
  ]

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
        page.evaluate(() => window.__TEST__?.snapshot().roadWallMaterials),
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            uid: roadWallUID,
            part: 'wall',
            hasMap: tier.hasMap,
          }),
          expect.objectContaining({
            uid: roadWallUID,
            part: 'road',
            hasMap: tier.hasMap,
          }),
        ]),
      )

    await page.mouse.move(0, 0)
    const alreadySelected = await page.evaluate(
      (uid) =>
        window.__TEST__?.snapshot().selectedPieceIDs.includes(uid) ?? false,
      roadWallUID,
    )
    if (alreadySelected) await clickPiece(page, roadWallUID)
    await clickPiece(page, roadWallUID)
    await expect
      .poll(async () =>
        page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
      )
      .toContain(roadWallUID)
  }
})

test('Ruins 2 and 3 stay selectable and use texture maps by graphics tier', async ({
  page,
}) => {
  await page.goto(RUINS_FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  const cameraTarget = await page.evaluate(
    () => window.__TEST__?.cameraPose()?.target ?? null,
  )
  if (cameraTarget) {
    await page.evaluate(
      async (target) =>
        window.__TEST__?.setCamera(
          [target[0] + 6, target[1] + 8, target[2] + 8],
          target,
        ),
      cameraTarget,
    )
    await waitForAppReady(page)
  }

  const graphics = page.getByTestId('graphics-tier-select')
  await graphics.click()
  await page.getByRole('option', { name: 'Low (classic look)' }).click()
  const ruins = [
    { inventoryID: 'rs2', q: 3, r: 0 },
    { inventoryID: 'rs3', q: 0, r: 5 },
  ]
  const ruinUIDs = await Promise.all(
    ruins.map((piece) => findPieceUid(page, piece)),
  )
  const tiers = [
    { label: 'Low (classic look)', hasMaps: false },
    { label: 'Medium (diffuse textures)', hasMaps: true },
    { label: 'High (PBR textures)', hasMaps: true },
  ]

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
        page.evaluate(() => window.__TEST__?.snapshot().ruinsMaterials),
      )
      .toEqual(
        expect.arrayContaining(
          ruinUIDs.flatMap((uid) =>
            (['face', 'columns'] as const).map((part) =>
              expect.objectContaining({
                uid,
                part,
                hasMap: tier.hasMaps,
              }),
            ),
          ),
        ),
      )

    for (const uid of ruinUIDs) {
      await page.mouse.move(0, 0)
      const alreadySelected = await page.evaluate(
        (id) =>
          window.__TEST__?.snapshot().selectedPieceIDs.includes(id) ?? false,
        uid,
      )
      if (alreadySelected) await clickPiece(page, uid)
      await clickPiece(page, uid)
      await expect
        .poll(async () =>
          page.evaluate(() => window.__TEST__?.snapshot().selectedPieceIDs),
        )
        .toContain(uid)
    }
  }
})

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
  const shadowWarnings: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (
      text.includes('Cannot update a component') ||
      text.includes('PCFSoftShadowMap')
    ) {
      shadowWarnings.push(text)
    }
  })

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

  expect(shadowWarnings).toEqual([])
})

test('picture-only High restores the previous graphics and lighting settings', async ({
  page,
}) => {
  await page.goto(HIVE_FIXTURE_URL)
  await waitForAppReady(page)
  await page.locator('#simple-tab-3').click()
  const hiveUID = await findPieceUid(page, {
    inventoryID: 'h',
    q: 0,
    r: 0,
  })
  await expect
    .poll(async () =>
      page.evaluate(
        (uid) =>
          window.__TEST__
            ?.snapshot()
            .marroHiveMaterials.find((material) => material.uid === uid) ??
          null,
        hiveUID,
      ),
    )
    .toMatchObject({ hasMap: false })
  await page.getByRole('button', { name: 'Take map picture' }).click()

  const pictureHigh = page.getByRole('checkbox', {
    name: 'High Quality graphics by default',
  })
  await expect(pictureHigh).toBeVisible()
  await pictureHigh.check()
  // Move the pointer off the checkbox so its tooltip cannot cover the button.
  await page.mouse.move(0, 0)
  await expect(page.getByRole('tooltip')).toHaveCount(0)
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
