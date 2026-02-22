import { test, expect } from '@playwright/test'

test.describe('Navbar Search Bar', () => {
  test('should display search input and allow typing', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Locate the desktop search bar
    const searchInput = page.locator('header input[type="text"]').first()
    await expect(searchInput).toBeVisible()

    // Type into it
    await searchInput.fill('something')
    await expect(searchInput).toHaveValue('something')
  })

  test('should clear input when clicking the X button', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const searchInput = page.locator('header input[type="text"]').first()

    await searchInput.fill('test query')
    const clearButton = page.locator('header form button[type="button"]').first()
    await expect(clearButton).toBeVisible()

    await clearButton.click()
    await expect(searchInput).toHaveValue('')
    await expect(clearButton).not.toBeVisible()
  })

  test('should perform full search when hitting enter', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    const searchInput = page.locator('header input[type="text"]').first()

    await searchInput.fill('playwright')
    await searchInput.press('Enter')

    // Should navigate to /search?q=playwright
    await expect(page).toHaveURL(/.*\/search\?q=playwright/)
  })
})
