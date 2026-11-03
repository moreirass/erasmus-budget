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

## Reference UI redesign — 3 November 2026

- Applied the supplied HTML/image references and DESIGN tokens to the existing React app. Domain data format, SQL and financial logic were retained.
- Production build and all 23 domain tests passed.
- Headless Chrome successfully loaded the built app through intercepted same-origin asset responses. Localhost navigation was blocked by this environment, so the check served build bytes directly to the isolated browser context. Service workers were disabled in this smoke check; it does not reverify offline installation.
- Frankfurter responses were mocked in the UI check; no personal data, credentials or live accounts were used. Previous live API checks remain documented above.
- Browser checks passed for budget card filtering, current month, mobile navigation/tabs, reference-currency search/conversion, laundry history, expense creation, editing an income assigned to Laundry, switching it back to Expense, and theme switching.
- No horizontal document overflow was detected at 320, 390, 768 or 1440px.
- Screenshots of mobile overview/transactions/budget/currency/card/form and desktop settings/transactions/light theme were generated. Visual review led to fixing page scroll restoration, the mobile month selector and a rate-panel text style.
- No real Android device, production Supabase account, live login or cloud conflict was exercised in this UI check. No new claim of end-to-end encryption or background sync is made.
