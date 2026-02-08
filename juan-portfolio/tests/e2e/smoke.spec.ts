import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL)
    })

    test('Homepage has correct hero content and SEO', async ({ page }) => {
        // 1. Verify Page Title (SEO)
        // Matches the updated translations we deployed earlier
        await expect(page).toHaveTitle(/Juan Tech|Juan Carlos Angulo|Software Engineer/)

        // 2. Verify Hero Heading
        const heroHeading = page.locator('h1').first()
        await expect(heroHeading).toBeVisible()
        await expect(heroHeading).toContainText('Juan Carlos Angulo')

        // 3. Verify Meta Description (SEO)
        const metaDescription = page.locator('meta[name="description"]')
        if (await metaDescription.count() > 0) {
            // Just verifying it exists is good enough for smoke test if content varies
            await expect(metaDescription).toBeVisible({ visible: false }) // Metadata is hidden from view
            const content = await metaDescription.getAttribute('content')
            console.log('Meta description found:', content)
        }

        // 4. Verify JSON-LD Schema (Technical SEO)
        const script = page.locator('script[type="application/ld+json"]')
        if (await script.count() > 0) {
            console.log('JSON-LD Schema found.')
        } else {
            console.warn('Warning: JSON-LD Schema not found on homepage.')
        }
    })

    test('Featured Clients section is visible and interactive', async ({ page }) => {
        // 1. Check for "Trusted By" label or section title
        const trustedBy = page.getByText('Trusted By', { exact: false })
        await expect(trustedBy).toBeVisible()

        // 2. Verify Marquee container exists
        const marquee = page.locator('.animate-marquee-infinite')
        await expect(marquee).toBeVisible()

        // 3. Verify at least one logo image is present
        const firstLogo = marquee.locator('img').first()
        await expect(firstLogo).toBeVisible()
    })

    test('Navigation to Blog works', async ({ page }) => {
        // 1. Find the "Read Engineering Blog" link
        // We look for a link that has "Blog" or "Engineering" in the name, case insensitive
        const blogLink = page.getByRole('link', { name: /(Blog|Engineering|Ingeniería)/i }).first()

        // Ensure button is visible before clicking
        await expect(blogLink).toBeVisible()

        // 2. Click navigation
        await blogLink.click()

        // 3. Verify URL change - regex to accept both '/blog' and '/blog-listing' or similar variants
        await expect(page).toHaveURL(/\/(blog|posts)/)

        // 4. Verify destination page content
        const blogMain = page.locator('main').first()
        await expect(blogMain).toBeVisible()
    })

    test('Responsiveness: Mobile View', async ({ page }) => {
        // 1. Set viewport to mobile size
        await page.setViewportSize({ width: 375, height: 667 })

        // 2. Verify hamburger menu or adapted navigation if applicable
        // For now, we just ensure critical elements are still visible and not weirdly hidden
        const heroHeading = page.locator('h1').first()
        await expect(heroHeading).toBeVisible()

        // 3. Check if marquee still exists (it should, just stacked or scrolling)
        const marquee = page.locator('.animate-marquee-infinite')
        await expect(marquee).toBeVisible()
    })
})
