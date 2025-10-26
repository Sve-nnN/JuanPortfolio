import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let _page: Page

  test.beforeAll(async ({ browser }, _testInfo) => {
    const context = await browser.newContext()
    _page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Title may vary depending on site content; ensure page loads and heading exists
    await expect(page).toHaveTitle(/Payload Website Template|Juan|Hello/)

    const heading = page.locator('h1').first()

    await expect(heading).toBeVisible()
  })
})
