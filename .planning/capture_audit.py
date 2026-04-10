#!/usr/bin/env python3
"""Capture screenshots for visual audit across viewports."""
from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:3000"
OUT = "/Users/juan/Documents/GitHub/juantech/JuanPortfolio/.planning/screenshots"

PAGES = {
    "homepage": "/",
    "blog-index": "/blog",
    "post-seo": "/blog/seo/mejores-cursos-seo-espanol",
    "post-cs": "/blog/cs-fundamentals/tablas-hash",
    "post-techseo": "/blog/tech-seo/technical-seo-checklist",
    "en-homepage": "/en",
}

VIEWPORTS = {
    "mobile-375": {"width": 375, "height": 812},
    "tablet-768": {"width": 768, "height": 1024},
    "laptop-1366": {"width": 1366, "height": 768},
    "desktop-1920": {"width": 1920, "height": 1080},
}

def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for vp_name, vp in VIEWPORTS.items():
            for page_name, path in PAGES.items():
                ctx = browser.new_context(viewport=vp)
                page = ctx.new_page()
                url = BASE + path
                fname = f"{page_name}_{vp_name}.png"
                fpath = os.path.join(OUT, fname)

                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    # Above-the-fold screenshot
                    page.screenshot(path=fpath, full_page=False)
                    print(f"OK: {fname}")

                    # Full page for key combos
                    if vp_name in ("mobile-375", "desktop-1920"):
                        full_fname = f"{page_name}_{vp_name}_full.png"
                        full_fpath = os.path.join(OUT, full_fname)
                        page.screenshot(path=full_fpath, full_page=True)
                        print(f"OK: {full_fname}")
                except Exception as e:
                    print(f"FAIL: {fname} - {e}")
                finally:
                    ctx.close()

        browser.close()

if __name__ == "__main__":
    main()
