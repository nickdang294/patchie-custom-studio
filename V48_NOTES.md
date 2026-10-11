# Patchie v48 — Performance & Suggestion Fixes

## Changes

- Server-render the current catalog into the studio. Hero text and the selected base image are present in the initial HTML; the browser does not repeat the catalog request on normal loads. Catalog remains uncached so admin updates stay fresh. If the server catalog request fails, the existing client fetch is retained as a fallback.
- Give the visible base image high fetch priority. Prefetch other views at low priority 1.5 seconds after the visible image loads, rather than competing at startup. Image quality is unchanged.
- Serve DM Sans and Manrope from `/public/fonts`, with their OFL licenses. Remove the Google Fonts CSS import, preload the default font subsets, and use optional font display to avoid a late swap.
- Share one recommendation snapshot between desktop and mobile. Adding a patch filters already-selected items out but does not automatically fetch a new design batch; use the bottom refresh button. Removing paid patches or changing base invalidates the snapshot and reloads it.
- Deduplicate simultaneous refreshes, abort superseded requests and reject stale responses. A completed request with no results disables refresh until the context changes. Failed requests display a retry action and are distinct from an empty result. The product-design API now returns an error status for database failures.
- Keep design result dimensions stable across loading, results, errors and empty states. Refresh shows an overlay without collapsing the result slot. The patch suggestion row stays present. Remove the artificial 1.2-second/520ms waiting timers.
- The toggle still controls only design cards. Design-derived patch suggestions remain available when it is off. Manual vertical scrolling suppresses subsequent auto-scroll while the toggle is on; turning it off still aligns the dock.
- Popup view selection is independent of the main mockup view.
- Zoom/pan transforms update through requestAnimationFrame and a ref; the full studio rerenders only when crossing the zoomed/unzoomed state. Recommendation ranking is cached between relevant changes. JSX helper components have stable identities outside Home.
- Clip zoomed artwork inside a dedicated viewport so the enlarged base cannot cover the patch picker or intercept its clicks.

## Validation

- Production `npm run build`: passed.
- Undefined-reference scan on changed JS/JSX files: passed.
- 15 browser regression checks passed with a 390 × 844 mobile viewport, plus desktop comparison. These cover server HTML, no duplicate catalog request, delayed-result geometry, matching desktop/mobile recommendations, manual refresh, rapid refresh deduplication, stale responses, error/retry, removal/reset, toggle/scroll rules, popup view, stable control identity during tab changes, pinch zoom, empty results and absence of browser runtime exceptions.
- With an intentionally delayed 750ms design response, the mockup's document Y position was 1180.375px both during loading and after the result appeared (0px change).
- Separate desktop checkout-preview check: passed; a placed patch remains present with its rotation after completing customization. No order was submitted.
- Mobile populated suggestions and desktop empty-state screenshots inspected locally.

Tests used bundled demo products and mocked design responses; they did not access the production Supabase database or submit orders. Local automated timings are not a replacement for Vercel's field P75 metrics. Recheck CLS/LCP/INP on the deployed site with real traffic. Server rendering moves the catalog wait into the server response, so database latency can affect TTFB.

## Deploy

Use this ZIP as the complete v48 project and redeploy through the existing Vercel workflow. Keep the existing environment variables. No database migration or image re-upload is required. The homepage is now `app/page.jsx` (server) plus `app/studio-client.jsx` (client); deploy both and the new components/hooks/fonts together.
