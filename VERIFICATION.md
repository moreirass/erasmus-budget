# Verification — 3 November 2026

- Production TypeScript/Vite/PWA build passes.
- 23 accounting, currency, migration, backup and date-selection tests pass.
- Tests cover monthly travel reset, independent budget arithmetic, income, laundry rollover/double counting, EUR/CZK snapshots, prorated October, month/week boundaries, non-mutating and idempotent legacy migration, CSV subcategories and insertion order after edits.
- The browser QA attempt could not start Edge in this execution environment (access denied during temporary browser-profile initialization). No new visual/mobile/offline-browser pass is claimed for this release.
- Live Supabase authentication and conflict resolution require the configured project; no live account data was modified here. The SQL schema is unchanged.
- Vite emits its existing large-bundle advisory; compilation succeeds. The previous dependency audit found four low-severity PWA build-tool findings; no dependency versions changed in this release and the audit was not rerun.

Run `npm test` and `npm run build` to repeat the local checks.

## Currency update

- Frankfurter v2 currencies and EUR rates were fetched and parsed live successfully on 3 November 2026: 165 non-crypto currency entries, 170 valid quotes including the excluded cryptocurrency quotes.
- Requests with the production Origin returned `Access-Control-Allow-Origin: *` for both endpoints.
- Tests include zero/two/three currency decimals, high reference rates, currency search in Portuguese, malformed response/cache rejection, immutable conversion snapshots and CSV rate provenance.
- Rate fetching uses a six-hour browser cache, timeout and a manual-rate fallback. Publication date and fetch time are separate. Auto refresh does not mutate the financial document.
- Browser/UI automation has not been rerun; the earlier Edge startup restriction remains the visual-verification limit.
