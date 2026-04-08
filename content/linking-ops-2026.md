# Internal Linking System — Operations Runbook 2026

## Overview

The internal linker scans blog posts for keyword mentions and injects markdown links between related content within the same topic cluster and locale. It operates in two modes: structural cluster links (pillar↔satellite relationships defined in frontmatter) and keyword-based links (natural mentions of a target post's primary or semantic keywords). When you run the CLI without `--dry-run`, it modifies the source `.md` files in `content/posts/` and automatically writes an audit report to `content/linking-run-YYYY-MM-DD.md`. Run the linker after publishing new posts or after editing keywords in existing content.

## Commands

```bash
# Preview all changes (no files written, no audit report)
npx tsx src/scripts/build-internal-links.ts --dry-run

# Tag unclassified posts with contentRole first (preview, then apply)
npx tsx src/scripts/build-internal-links.ts --classify --dry-run
npx tsx src/scripts/build-internal-links.ts --classify

# Full apply — ES posts only (writes audit to content/linking-run-YYYY-MM-DD.md)
npx tsx src/scripts/build-internal-links.ts --locale es --yes

# Full apply — EN posts only
npx tsx src/scripts/build-internal-links.ts --locale en --yes

# Structural cluster links only (skip keyword scan)
npx tsx src/scripts/build-internal-links.ts --cluster-only --yes

# Single category only
npx tsx src/scripts/build-internal-links.ts --category tech-seo --yes

# Verbose output for debugging
npx tsx src/scripts/build-internal-links.ts --locale es --dry-run --verbose
```

## Audit Report

Every non-dry-run apply writes `content/linking-run-YYYY-MM-DD.md` automatically. No flag required — the file is always written when the CLI applies changes.

The audit file contains five sections:

**Summary**
Single-line totals: keyword links added, posts modified, cluster links applied, and the locale scope if one was specified.

**Changed Posts**
A table listing each modified post by slug and the total keyword links added. This confirms which files were touched during the run.

**Skipped Matches**
A table of opportunities that were evaluated but not applied, with the reason for each skip. Common reasons:
- Already linked: a link to the target post already exists in the source post body
- Different category: cross-category linking is disabled by default
- Cross-locale: the source and target posts are in different locales
- Link limit reached: `maxLinksPerKeyword` cap was hit for this keyword

**Locale Summary**
Counts of ES and EN posts modified plus the count of cluster links applied. Use this to confirm that locale isolation is working — ES and EN totals should not mix in the same run unless you ran without `--locale`.

**Errors**
Any file write failures encountered during the apply. If no errors occurred, this section shows "No errors."

## Locale Isolation

The linker enforces locale isolation via `ContentScanner.isDifferentLocale()`. An ES post will never receive a link pointing to an EN post, and vice versa. Locale is read from the `idioma` frontmatter field. If `idioma` is absent, the locale falls back to `es` (the site default), matching the same resolution order used by the sync system (filename suffix takes precedence in the sync system, but the linker reads the parsed `PostMetadata.idioma` field directly).

The Locale Summary section in every audit report confirms isolation per run: if you ran with `--locale es`, the EN count should be 0.

Integration test covering this guarantee:

```bash
pnpm test:int -- tests/int/internal-linking-bulk-locale.int.test.ts
```

Four cases are tested: ES→EN (rejected), ES→ES (accepted), EN→ES (rejected), EN→EN (accepted).

## When to Re-Run

- **After publishing a new post:** re-run for that post's locale and category to wire it into the cluster.
- **After changing `primary_keywords` or `semantic_keywords`:** run `--classify --dry-run` first to review, then apply.
- **After adding a new pillar or satellite relationship:** run `--cluster-only --yes` first to apply the structural links before the keyword scan.
- **Monthly full pass:** run `--locale es --yes` followed by `--locale en --yes` to catch any new organic keyword matches that emerged from recently published content.

## Verifying the Run

```bash
# Confirm locale isolation test passes
pnpm test:int -- tests/int/internal-linking-bulk-locale.int.test.ts

# Check the audit file was created today
ls content/linking-run-*.md

# Review the most recent audit
cat content/linking-run-$(date +%Y-%m-%d).md
```

## Troubleshooting

**Audit file not written after apply**
Check the console for a yellow warning line starting with "Could not write audit report". This means `writeAuditReport()` caught an exception — usually a permissions issue on the `content/` directory or a full disk.

**Unexpected cross-locale links in audit**
This should not occur. If the Locale Summary shows both ES and EN counts after a scoped run, check that the `idioma` field is set correctly in the affected posts' frontmatter. Run `--verbose` to see per-link locale checks in the console.

**Zero opportunities found but you expect matches**
Run `--dry-run --verbose` to see which keywords are in the index and whether category filtering is suppressing matches. Verify that `primary_keywords` values match the exact text appearing in the source post body (case-insensitive, word-boundary matched).
