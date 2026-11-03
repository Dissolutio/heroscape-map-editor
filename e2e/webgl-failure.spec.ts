import { expect, test } from './fixtures'

test('a failed WebGL startup offers diagnostics and keeps 2D available', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: new Proxy(getContext, {
        apply(target, thisArg, args: unknown[]) {
          if (String(args[0]).startsWith('webgl')) {
            throw new Error('forced WebGL context failure')
          }
          return Reflect.apply(target, thisArg, args)
        },
      }),
    })
  })

  await page.reload()

  await expect(page.getByTestId('webgl-failure')).toBeVisible()
  await expect(
    page.getByText(/2D and PDF views are still available/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Copy diagnostics' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Switch to 2D view' }).click()
  await expect(page.locator('[id="2d-svg-view"]')).toBeVisible()

  await page.getByRole('button', { name: '3D', exact: true }).click()
  await expect(page.getByTestId('webgl-failure')).toBeVisible()
})
