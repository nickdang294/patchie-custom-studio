# Patchie v50.2 — Moved mobile design suggestions below mockup

- On mobile, the “Mẫu phối hợp gu” module now appears directly after the mockup card and before the fulfilment choices. It is outside the switching Tự Phối / Patchie Gợi Ý dock, so changing tabs no longer mounts/unmounts this tall module inside the dock.
- The design toggle remains available. Turning it off hides the design cards while reserving the result-slot dimensions to avoid moving content below the module.
- Desktop keeps the design suggestions in the picker sidebar.
- Removed the experimental 460–510 px minimum mobile dock height.
- No backend, database, asset, or recommendation-fetch behavior changed.

Validation: source edits reviewed. Build/browser testing was not completed because dependencies are not installed and npm offline cache lacks `tslib`; no production URL or Supabase data was changed.
