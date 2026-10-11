# Patchie v50.2 — Moved mobile design suggestions below mockup

- On mobile, the “Mẫu phối hợp gu” module now appears directly after the mockup card and before the fulfilment choices. It is outside the switching Tự Phối / Patchie Gợi Ý dock, so changing tabs no longer mounts/unmounts this tall module inside the dock.
- The design toggle remains available. Turning it off hides the design cards while reserving the result-slot dimensions to avoid moving content below the module.
- Desktop keeps the design suggestions in the picker sidebar.
- Removed the experimental 460–510 px minimum mobile dock height.
- No backend, database, asset, or recommendation-fetch behavior changed.

Validation: source edits reviewed. Build/browser testing was not completed because dependencies are not installed and npm offline cache lacks `tslib`; no production URL or Supabase data was changed.

## Follow-up CLS adjustment

The prior CLS selector list also showed `mobile-patch-dock` and `preview-card` moving. The design cards are now outside that dock, but the remaining patch chooser and recommended-patch panels can still have slightly different heights. v50.2 follow-up reserves 312 px for the dock only when its two tabs are present, clamps the dynamic suggestion title to one line, and removes entrance transforms from tab-switched rows. This avoids adding blank height before any paid patch is selected.
