---
phase: 06-dinobrain-http-api-integration-for-post-creation
plan: 02
subsystem: scripts/dinorank
tags: [adapter, generation, markdown]
key_files:
  created:
    - src/scripts/dinorank/DinoBrainApiAdapter.ts
    - tests/unit/scripts/DinoBrainApiAdapter.test.ts
metrics:
  completed: "2026-04-01"
  tasks: 2
  files: 2
---

# Phase 6 Plan 2 Summary

Implemented DinoBrain orchestration over HTTP with account scoring and HTML to Markdown extraction.

## Delivered

- Added `DinoBrainApiAdapter.generate()` to:
  - select accounts by profile score (language/country/domain/site type)
  - skip active cooldowns
  - login via HTTP client and validate credits
  - create generation requests and parse both numeric and JSON IDs
  - poll `controlIA.php` until completion
  - fetch generated HTML and convert to Markdown using JSDOM + Turndown
  - set `cooldownUntil` for used account
  - logout in `finally`
- Added unit tests for all major branches, fallback paths, polling behavior, and cooldown behavior.

## Result

Content generation can now run without browser automation and is resilient to DinoRank response variants.