import { readFile } from 'node:fs/promises'
import { FIXTURE_HEX_MAP, FIXTURE_PIECE_IDS } from './fixture-map'
import {
  clickHex,
  expect,
  mapUrl,
  setPen,
  test,
  waitForAppReady,
} from './fixtures'

test('places a Generic piece with the Generic pen', async ({ page }) => {
  await waitForAppReady(page)
  await setPen(page, 'gn', 1)
  await clickHex(page, { q: 0, r: 0, altitude: 0 })

  await page.waitForFunction(() =>
    window.__TEST__?.listPieces().some((piece) => piece.inventoryID === 'gn1'),
  )
  expect(
    await page.evaluate(() =>
      window.__TEST__
        ?.listPieces()
        .some((piece) => piece.inventoryID === 'gn1'),
    ),
  ).toBe(true)
})

test('downloads a PDF with a buried Generic tile and its marks', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'settings',
      JSON.stringify({
        v: 1,
        values: {
          isShowPdfTileLetters: true,
          isShowPdfBuriedMarks: true,
          isShowPDFInventory: false,
          pdfRenderFormat: 'shortHeader',
        },
      }),
    )
  })
  await page.setViewportSize({ width: 500, height: 900 })
  await page.goto(
    mapUrl(FIXTURE_HEX_MAP, [
      ...FIXTURE_PIECE_IDS,
      '0~4~0~0~gn1',
      '1~4~0~0~g1',
    ]),
  )
  await waitForAppReady(page)

  const downloadLink = page.locator('a[download]')
  await expect
    .poll(() => downloadLink.getAttribute('href'), { timeout: 120_000 })
    .toMatch(/^blob:/)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    downloadLink.click(),
  ])

  const pdf = await readFile(await download.path())
  expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-')
})
