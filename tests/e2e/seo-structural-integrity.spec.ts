import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('SEO Structural Integrity & Routing', () => {
    test.beforeEach(async ({ page }) => {
        // Go to home page (Spanish default)
        await page.goto(BASE_URL)
    })

    test('DOM Structural Integrity: No stray tags in <head>', async ({ page }) => {
        // Evaluate the head content in the browser
        const headAnalysis = await page.evaluate(() => {
            const head = document.head
            const body = document.body
            
            // Check for common culprits that force-close <head> (inline scripts, divs, etc)
            // If they are rendered by Next.js correctly, they should be in head or body
            // But if they are rendered INCORRECTLY (e.g. <div> inside <head>), 
            // the browser will move them and everything after them into the <body>.
            
            // Critical metadata should be in document.head
            const title = head.querySelector('title')
            const description = head.querySelector('meta[name="description"]')
            const canonical = head.querySelector('link[rel="canonical"]')
            
            return {
                titleInHead: !!title,
                descriptionInHead: !!description,
                canonicalInHead: !!canonical,
                // Check if any typical body elements are accidentally in head (rarely happens with browser parser)
                divInHead: !!head.querySelector('div'),
                // Check if title or meta was forced into body
                titleInBody: !!body.querySelector('title'),
                metaInBody: !!body.querySelector('meta[name="description"]'),
            }
        })

        expect(headAnalysis.titleInHead).toBe(true)
        expect(headAnalysis.descriptionInHead).toBe(true)
        expect(headAnalysis.canonicalInHead).toBe(true)
        expect(headAnalysis.divInHead).toBe(false)
        expect(headAnalysis.titleInBody).toBe(false)
        expect(headAnalysis.metaInBody).toBe(false)
    })

    test('URL Logic: Spanish (es) canonical should NOT have locale prefix', async ({ page }) => {
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
        // Canonical should follow the site URL. We check the suffix.
        // On homepage, it should be just the domain or domain + /
        expect(canonical).not.toContain('/es')
        expect(canonical).toMatch(/https?:\/\/[^\/]+\/?$/)
    })

    test('URL Logic: English (en) canonical SHOULD have /en prefix', async ({ page }) => {
        await page.goto(`${BASE_URL}/en`)
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
        expect(canonical).toContain('/en')
        // Ensure no double slash or missing slash
        expect(canonical).toMatch(/https?:\/\/[^\/]+\/en\/?$/)
    })

    test('Breadcrumbs & Schema: JSON-LD should be present in <body> for performance', async ({ page }) => {
        // We moved JsonLd to body in layout.tsx. Verify it's there.
        const bodyScriptCount = await page.locator('body script[type="application/ld+json"]').count()
        expect(bodyScriptCount).toBeGreaterThan(0)
        
        // Ensure it's NOT in head (optional, but good for verification of our specific change)
        const headScriptCount = await page.locator('head script[type="application/ld+json"]').count()
        expect(headScriptCount).toBe(0)
    })
})
