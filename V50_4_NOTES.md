# Patchie v50.4 — Replace patch recommendations with design recommendations

- Removed patch-recommendation UI from the desktop picker and mobile dock.
- Renamed the mobile “Patchie Gợi Ý” tab to “Design Gợi Ý”; it now shows the saved product-design combinations. “Tự Phối” remains available.
- Both mobile tab panels stay mounted in the same CSS grid cell and remain part of intrinsic grid sizing. Switching tabs changes visibility and interaction state only, so the larger panel continues to determine dock height and the mockup does not jump.
- Kept the design on/off switch; its result slot keeps its space when switched off. Design thumbnails start observing/loading only when the Design Gợi Ý tab and switch are active.
- Removed patch-ranking work from the customer suggestion hook, leaving product-design fetching and refresh behavior.
- A tab switch no longer triggers the dock auto-scroll effect.

Validation: source references were checked. Build and browser/CLS verification were not run because this workspace does not have the project dependencies installed; npm's offline cache was missing `tslib`. Deploy and remeasure CLS before treating the field score as confirmed.
