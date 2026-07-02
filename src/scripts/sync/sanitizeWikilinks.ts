/**
 * Safety net for the content authoring pipeline.
 *
 * Posts are authored in Obsidian, where internal references are written as
 * `[[slug|label]]` wikilinks. The repo's TypeScript link injector emits proper
 * markdown links, but an external authoring step (Obsidian / ad-hoc scripts)
 * could still leave raw wikilinks behind. If those reach Payload they render as
 * literal `[[...]]` text inside hrefs — the root cause of the Ahrefs
 * broken-links / broken-images findings (LINKS-01).
 *
 * This guard runs at sync time and guarantees no `[[...]]` ever reaches the CMS.
 * It cannot resolve a slug to a live URL here, so it degrades safely: the
 * wikilink becomes its plain-text label (never broken bracket syntax).
 *
 * Matching is slug-shaped on purpose (`[a-z0-9]` start, no spaces) so that
 * legitimate code such as a Python 2D array `dp = [[0 for ...]]` is left
 * untouched.
 */

// `[[slug|label]]` or `[[slug]]` — slug has no whitespace.
const WIKILINK = /\[\[([a-z0-9][a-z0-9._/-]*)(?:\|([^\]\n]*))?\]\]/gi
// Half-converted link: `[[Label](url)` -> `[Label](url)` (extra leading bracket).
const MALFORMED_LINK = /\[\[([^\]\n]+?)\]\(/g
// Double-wrapped link from a repeated internal-linking pass:
// `[[Text](url1)](url2)` -> `[Text](url1)`. Keeps the inner (original) link and
// drops the erroneous outer wrapper, instead of leaving a dangling `](url2)`. #86/#99 fallout.
const DOUBLE_WRAPPED = /\[(\[[^\]\n]+\]\([^)\n]+\))\]\([^)\n]+\)/g

export interface SanitizeResult {
  body: string
  stripped: number
}

export function sanitizeWikilinks(body: string): SanitizeResult {
  let stripped = 0

  // Collapse double-wrapped links first so the leftover isn't misread as a
  // half-converted `[[Label](` by the rule below.
  let out = body.replace(DOUBLE_WRAPPED, (_m, inner: string) => {
    stripped++
    return inner
  })

  out = out.replace(MALFORMED_LINK, (_m, inner: string) => {
    stripped++
    return `[${inner}](`
  })

  out = out.replace(WIKILINK, (_m, slug: string, label?: string) => {
    stripped++
    const text = (label ?? '').trim()
    return text.length > 0 ? text : slug.replace(/-/g, ' ')
  })

  return { body: out, stripped }
}
