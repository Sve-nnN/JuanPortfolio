# GTM → GA4 setup (one-time, in the GTM UI)

The site pushes all custom events to the **dataLayer** (`trackEvent` / the
`AnalyticsProvider` click delegation). To get them into GA4, create **one**
GA4-Event tag that forwards every dataLayer event. Container: `NEXT_PUBLIC_GTM_ID`.

## 1. GA4 Configuration tag (if not already present)

- Tag type: **Google Tag** (or "GA4 Configuration" in older GTM).
- Measurement ID: your GA4 ID (`NEXT_PUBLIC_GA_ID`, `G-XXXXXXX`).
- Trigger: **Initialization - All Pages** (or All Pages).
- This handles `page_view`. Do **not** also add the standalone Next.js
  `GoogleAnalytics` component — it would double-count (we removed it on purpose).

## 2. Custom-event trigger (forwards everything)

- Triggers → New → **Custom Event**.
- Event name: `.*`  → check **Use regex matching**.
  (This fires on every dataLayer `event` we push.)
- Optionally exclude GTM/GA internals by adding a condition
  `Event` does not match regex `gtm\.|^(page_view|user_engagement)$`.
- Name it e.g. `CE - all custom events`.

## 3. GA4 Event tag (the forwarder)

- Tags → New → **Google Analytics: GA4 Event**.
- Configuration tag: the GA4 tag from step 1.
- Event name: `{{Event}}`  (built-in variable — enable it under Variables if needed).
- Event parameters: add **Event Settings** / parameters you care about, e.g.
  `label`, `location`, `status`, `percent`, `path`, `search_term`, `content_type`,
  `item_id`, `milestone`, `from`, `to`. Map each to a **dataLayer Variable** of the
  same name (Variables → New → Data Layer Variable → name = `label`, etc.).
- Trigger: the custom-event trigger from step 2.
- Publish the container.

Result: every `trackEvent(...)` / tracked click flows to GA4 as a custom event
with its params.

## 4. GA4 Enhanced Measurement (in GA4, not GTM)

Admin → Data Streams → your web stream → **Enhanced measurement** ON. It already
covers, so we do NOT duplicate in code:
- `page_view`, `scroll` (90% only — we add 25/50/75/100 via `scroll_depth`),
- **outbound clicks**, **site search** (uses `q` param — our `/search?q=` works),
- file downloads, form interactions, video.

## 5. Mark conversions (GA4)

Admin → Events / Key events → mark as **key events (conversions)**:
- `generate_lead` (contact form success)
- `schedule_meeting` (Calendly booking)

## Verify

- **DebugView**: GA4 Admin → DebugView. Open the site with the GA Debugger
  extension (or `?gtm_debug=x`), click CTAs, switch language, scroll → events
  appear live.
- **GTM Preview**: connect to the site, watch the dataLayer + tag firing.
- **Console**: `window.dataLayer` in DevTools shows pushed events.

No PII is sent: `trackEvent` strips email/phone/name-like keys and truncates
long values. See `analytics-events.md` for the full event catalog.
