# Patchie v50.5 — Guard invalid initial catalog payload

- Fixed a production client crash when the server supplied an initial catalog without valid `products`, `patches`, or `settings` fields.
- The page now accepts the server payload only when its catalog collections and settings object have the expected shape. Otherwise, it starts from a safe local catalog and requests `/api/catalog` on the client.
- Retains the v50.4 mobile “Design Gợi Ý” replacement and stable dock panels.

Validation: browser console on the deployed site showed `TypeError: Cannot read properties of undefined (reading 'find')` in the product selection render path. Source now validates the initial catalog before calling `.find`. ZIP integrity checked. Build and post-fix production verification have not been run in this workspace because project dependencies are unavailable.
