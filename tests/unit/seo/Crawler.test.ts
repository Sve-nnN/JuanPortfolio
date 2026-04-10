import { describe, it, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'

/**
 * Mocking the crawler logic locally for verification
 */
async function mockExtract(html: string) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const title = doc.querySelector('title')?.textContent?.trim() || 'No Title';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || 
                      doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || 
                      'No Description';

    const h2s = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(t => t);
    const h3s = Array.from(doc.querySelectorAll('h3')).map(h => h.textContent?.trim()).filter(t => t);

    return { title, description, h2s, h3s };
}

describe('Competitor Crawler Extraction', () => {
    it('should extract title and meta description correctly', async () => {
        const html = `
            <html>
                <head>
                    <title>Test Page Title</title>
                    <meta name="description" content="This is a test description for SEO">
                </head>
                <body></body>
            </html>
        `;
        const result = await mockExtract(html);
        expect(result.title).toBe('Test Page Title');
        expect(result.description).toBe('This is a test description for SEO');
    });

    it('should fallback to og:description if meta description is missing', async () => {
        const html = `
            <html>
                <head>
                    <title>Title</title>
                    <meta property="og:description" content="Social description">
                </head>
                <body></body>
            </html>
        `;
        const result = await mockExtract(html);
        expect(result.description).toBe('Social description');
    });

    it('should extract h2 and h3 headings', async () => {
        const html = `
            <html>
                <body>
                    <h2>Heading 2.1</h2>
                    <h3>Heading 3.1</h3>
                    <h2>Heading 2.2</h2>
                    <div>
                        <h3>Heading 3.2</h3>
                    </div>
                </body>
            </html>
        `;
        const result = await mockExtract(html);
        expect(result.h2s).toEqual(['Heading 2.1', 'Heading 2.2']);
        expect(result.h3s).toEqual(['Heading 3.1', 'Heading 3.2']);
    });

    it('should clean HTML tags inside headings', async () => {
        const html = `
            <html>
                <body>
                    <h2>Heading with <span>Span</span></h2>
                </body>
            </html>
        `;
        const result = await mockExtract(html);
        expect(result.h2s).toEqual(['Heading with Span']);
    });
});
