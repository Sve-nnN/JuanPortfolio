# Performance & Core Web Vitals Audit

**Site:** JuanPortfolio (juan-tech.com)
**Stack:** Next.js 15.2.8, React 19.2, Payload CMS 3, Tailwind CSS 3.4, Framer Motion 12.x
**Date:** 2026-04-09

---

## 1. Estimated Core Web Vitals Status

| Metric | Assessment | Risk Level |
|--------|-----------|------------|
| **LCP** (Largest Contentful Paint) | AT RISK - Multiple bottlenecks identified | MEDIUM-HIGH |
| **INP** (Interaction to Next Paint) | AT RISK - Heavy client-side JS, Lenis rAF loop | MEDIUM |
| **CLS** (Cumulative Layout Shift) | LIKELY GOOD - font-display:swap, placeholder blur images | LOW |
| **FCP** (First Contentful Paint) | AT RISK - 6 font files loaded at root, 4 analytics scripts | MEDIUM |
| **TTFB** | AT RISK - Root layout fetches Payload CMS global on every request | MEDIUM |

> **Note:** These are code-based assessments. Live field data (CrUX) should be checked at https://cruxvis.withgoogle.com for juan-tech.com.

---

## 2. Performance Metrics Summary

### JavaScript Bundle Size
- **Total JS chunks:** ~6.8 MB (uncompressed, across all routes)
- **Largest chunks:**
  - `f4f38_next_dist_compiled_*` — 1,092 KB (Next.js internals)
  - `f4f38_next_dist_client_*` — 1,060 KB (Next.js client runtime)
  - Chunk `3847-*` — 1,036 KB (likely framer-motion or Payload CMS)
  - Chunk `6ee78591-*` — 712 KB
  - Chunk `6f9e4089-*` — 332 KB
  - Framework chunk — 188 KB
- **framer-motion** used in 15+ files (entire layout wraps children in motion.div via template.tsx)

### Font Loading
- **6 woff2 files** loaded at root layout level: 3 Array + 3 Khand = ~115 KB total
- `font-display: swap` correctly set (good for CLS)
- Also loads **Geist Sans** and **Geist Mono** from npm package
- Total: **4 font families / 8+ font files** on initial load
- Legacy .eot and .ttf files present in font directories (not served but add repo bloat)

### Third-Party Scripts (loaded on every page)
1. **Vercel Analytics** (`@vercel/analytics/next`)
2. **Vercel Speed Insights** (`@vercel/speed-insights/next`)
3. **Google Tag Manager** (conditional on env var)
4. **Google Analytics** (conditional on env var)
5. **Ahrefs Analytics** (`strategy="afterInteractive"`)

### Cache Headers
- `/_next/static/*` — `public, max-age=31536000, immutable` (GOOD)
- `/fonts/*` — `public, max-age=31536000, immutable` (GOOD)
- CSP and security headers properly configured

### Image Optimization
- Next.js Image component with `sharp` installed (GOOD)
- AVIF + WebP formats enabled (GOOD)
- `quality: 80` default (GOOD)
- Cloudinary integration with optimization transforms (GOOD)
- `placeholder: "blur"` with base64 data URI (GOOD for CLS)
- **Issue:** Cloudinary images served with `unoptimized={true}` — bypasses Next.js image optimization pipeline

---

## 3. Specific Bottlenecks Identified

### CRITICAL: Lenis Smooth Scroll rAF Loop (INP Impact)
**File:** `src/providers/ScrollProvider.tsx`
- Runs `requestAnimationFrame` loop continuously from mount, even when user is not scrolling
- This keeps the main thread occupied and will degrade INP scores
- The Lenis library adds ~15KB to client bundle
- **Impact:** HIGH on INP. Continuous rAF loops prevent the browser from being idle

### CRITICAL: Page Transition Animation Wraps All Content (LCP + INP Impact)
**File:** `src/app/(frontend)/template.tsx`
- Every page navigation wraps the ENTIRE page content in `motion.div` with opacity/y animation
- This imports full `framer-motion` (not LazyMotion) at the template level
- Forces a 500ms delay on content visibility (`initial: { opacity: 0 }`)
- **Impact:** HIGH on LCP. Content starts invisible and animates in, delaying LCP measurement by 400-500ms

### HIGH: Root Layout CMS Query on Every Request
**File:** `src/app/(frontend)/layout.tsx:83-84`
- `await getPayload({ config: configPromise })` + `findGlobal({ slug: 'site-settings' })` runs on every single request
- This blocks the entire page render until Payload CMS responds
- **Impact:** MEDIUM-HIGH on TTFB. Adds database query latency to every page load

### HIGH: Excessive Framer Motion Usage
- 15+ files import framer-motion
- Some use `LazyMotion` with `domAnimation` (good), but many import directly from `framer-motion` (bad)
- `DynamicBackground.tsx` runs infinite CSS-in-JS animations via framer-motion (scale, rotate, opacity loops)
- Header has scroll-linked framer-motion spring animations
- **Impact:** MEDIUM on INP, MEDIUM on bundle size

### MEDIUM: 4 Font Families on Initial Load
- Array (display), Khand (body), Geist Sans, Geist Mono all loaded at root layout
- Geist Mono likely only needed in code blocks but loaded globally
- **Impact:** MEDIUM on FCP. Browsers must download and parse all font files before rendering text with correct fonts

### MEDIUM: PostHero Fallback Uses Raw `<img>` Tag
**File:** `src/heros/PostHero/index.tsx`
- When no hero image exists, uses native `<img>` tag with `fetchPriority="high"` pointing to fallback images
- These bypass Next.js image optimization (no responsive sizes, no format negotiation, no CDN optimization)
- **Impact:** MEDIUM on LCP for blog posts without hero images

### LOW: Unused Font Files in Repository
- `.eot` and `.ttf` variants for all fonts (~6MB+ of unused font files)
- Not referenced anywhere but add to clone/deploy size
- Array-Wide and Array-BoldWide variants loaded but not used in CSS

---

## 4. Pages with Performance Issues

### Homepage (`/` and `/en`)
- **LCP risk:** HeroHome is a `'use client'` component that wraps content in framer-motion animations. The hero image uses `priority` (good) but the entire section starts with `opacity: 0` and animates in
- **INP risk:** Scroll-linked parallax transforms on hero elements (`useScroll`, `useTransform`) + Lenis rAF loop + DynamicBackground infinite animations
- **CLS risk:** LOW — images have dimensions, fonts use swap

### Blog Post Pages (`/blog/[category]/[slug]`)
- **LCP risk:** PostHero with full-viewport background image. Fallback images use raw `<img>` without optimization
- **INP risk:** AnimateOnScroll components throughout content, Lenis rAF loop
- **CLS risk:** LOW — blur placeholders used

### Blog Archive Pages (`/blog`, `/blog/[category]`)
- **LCP risk:** PostsGrid uses AnimatedCard with framer-motion entry animations
- **INP risk:** Multiple animated cards triggering on scroll

---

## 5. Top Recommendations (Quick Wins First)

### Quick Wins (High Impact, Low Effort)

1. **Remove or replace the page transition animation in `template.tsx`** (LCP: -400ms estimated)
   - The `motion.div` wrapper with `initial: { opacity: 0 }` delays LCP for every page
   - Replace with CSS-only fade-in using `@starting-style` or remove entirely
   - Or at minimum, remove `initial: { opacity: 0 }` so content is immediately visible

2. **Replace Lenis rAF loop with event-driven approach** (INP improvement)
   - Use `lenis.on('scroll', callback)` instead of continuous rAF
   - Or remove Lenis entirely — `scroll-behavior: smooth` in CSS already set in globals.css
   - Current implementation: every frame runs Lenis.raf() even when no scrolling occurs

3. **Use `LazyMotion` + `m` consistently instead of importing `motion` directly** (Bundle: -30-50KB)
   - `template.tsx`, `DynamicBackground.tsx`, `FeaturedClients/Component.tsx` import `motion` from `framer-motion` directly
   - Switch all to `LazyMotion features={domAnimation}` + `m` (already done in some components)

4. **Defer Geist Mono font loading** (FCP improvement)
   - Only load Geist Mono on pages that actually render code blocks
   - Move it from root layout to a component-level dynamic import

### Medium-Term Optimizations

5. **Cache the Payload `site-settings` global** (TTFB: -50-200ms)
   - Use `next.revalidate` or `unstable_cache` to avoid hitting the database on every request
   - Site settings rarely change — a 60-300s cache is safe

6. **Convert DynamicBackground infinite animations to CSS keyframes** (INP improvement)
   - The blurred blob animations (scale, rotate, opacity) don't need JS — pure CSS `@keyframes` with `animation` property works identically
   - Removes framer-motion runtime cost for purely decorative animation

7. **Optimize Cloudinary image handling** (LCP improvement)
   - Currently `unoptimized={true}` for Cloudinary images in ImageMedia component
   - This skips Next.js image optimization. Either configure Next.js `remotePatterns` for Cloudinary properly, or ensure Cloudinary transformations include responsive sizing

8. **Reduce font family count** (FCP: -20-40ms)
   - Remove unused Array-Wide / Array-BoldWide woff2 files from the build
   - Consider loading Geist Sans only where needed, or subsetting Array/Khand fonts

### Long-Term Optimizations

9. **Add `@next/bundle-analyzer` to identify largest client-side dependencies**
   - The 1MB+ unnamed chunk (3847-*) should be investigated
   - May reveal opportunities to tree-shake or lazy-load heavy dependencies

10. **Implement route-level code splitting for Payload CMS admin**
    - The `.next` build is 1.6GB which suggests potential admin/frontend code mixing

11. **Add resource hints for critical assets**
    - `<link rel="preconnect" href="https://res.cloudinary.com">` for Cloudinary images
    - `<link rel="preconnect" href="https://cdn.juanes.xyz">` if used for media

12. **Consider removing Lenis entirely**
    - Native CSS `scroll-behavior: smooth` already declared in globals.css line 89
    - Lenis adds ~15KB JS + continuous rAF overhead for marginal UX improvement

---

## 6. Technical Optimization Opportunities

### Server-Side Rendering Path
- Root layout is async SSR (good) but blocks on CMS query
- Blocks are lazy-loaded via `next/dynamic` in RenderBlocks.tsx (good code splitting)
- `AdminBar` is dynamically imported with `ssr: true` (should be `ssr: false` since it's only for admin preview)

### CSS Delivery
- `optimizeCss: true` in experimental config (good — enables CSS optimization)
- Tailwind CSS with `@tailwind` directives (standard, works well with Next.js)
- Only one `.scss` import for admin-side (good — no heavy SCSS on frontend)

### Image Delivery
- Proper `deviceSizes` and `imageSizes` arrays configured
- `minimumCacheTTL: 60` — could be increased to 3600+ for better CDN caching
- Responsive `sizes` attribute defaults to reasonable breakpoints

### Compression
- `compress: true` in next.config.js (gzip enabled)
- Vercel deployment would add Brotli on top

### Package Optimization Already in Place
- `optimizePackageImports: ['framer-motion', 'lucide-react']` (good)
- `modularizeImports` for lucide-react (good — prevents full import)
- `serverExternalPackages: ['natural']` (good — keeps NLP library server-only)

---

## Summary

| Area | Score | Priority |
|------|-------|----------|
| Image optimization | 7/10 | Low — already well configured |
| Font strategy | 5/10 | Medium — too many families loaded globally |
| JavaScript bundle | 4/10 | High — template.tsx and Lenis dominate perf |
| Cache strategy | 7/10 | Low — static assets well cached |
| Third-party scripts | 6/10 | Medium — 5 scripts but mostly deferred |
| Animation overhead | 3/10 | **Critical** — continuous rAF + page fade-in |
| Server response | 5/10 | Medium — uncached CMS query in layout |
| Code splitting | 7/10 | Low — blocks already lazy-loaded |

**Estimated overall Lighthouse Performance score: 55-70** (primarily held back by LCP delay from template.tsx opacity animation and JavaScript execution time from Lenis/framer-motion).

**Top 3 actions to improve Core Web Vitals:**
1. Fix template.tsx page transition (LCP)
2. Remove or fix Lenis rAF loop (INP)
3. Cache site-settings CMS query (TTFB)
