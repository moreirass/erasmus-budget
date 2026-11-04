# Verification — 3 November 2026

## Current checks

- Production TypeScript/Vite/PWA build passes with vite-plugin-pwa 2.0.0 and Workbox 7.4.1.
- All 27 tests pass: accounting, immutable currency snapshots, income, card-credit history/rollover, travel limits, migration, backup validation/round trips, transaction ordering, current month/week selection, configurable partial months including leap years, and platform configuration.
- Prettier check passes. Source imports have been organized; views, transaction editor, shared primitives and panels are separate modules.
- Main JavaScript is approximately 313 KB (96 KB gzip); Supabase is a separate 227 KB chunk (59 KB gzip). No chunk exceeds Vite's default 500 KB warning threshold. Chunking does not remove total downloaded bytes or guarantee lazy loading for guests.
- Manifest has explicit language/identity, narrow and wide screenshots, and a separate maskable icon with approximately 20% safe padding. Asset dimensions and production security headers have automated checks.

## Browser verification

- Headless Chrome loaded the built app through intercepted same-origin asset responses with the production CSP and other Vercel headers applied. Localhost navigation was restricted in this environment. Service workers were disabled for this smoke check.
- Checks passed for current-month selection, budget-card filtering, mobile navigation/tabs, reference-currency search/conversion, laundry history, expense creation, editing income assigned to Laundry and switching back to Expense, and theme switching.
- Additional checks passed for currency selection with arrows/Enter and custom deletion followed by Undo. No uncaught page errors or horizontal document overflow at 320, 390, 768 or 1440px.
- Screenshots were generated from isolated test data. Frankfurter responses were mocked; no personal transactions, credentials or live accounts were used.
- No physical Android install, notch-equipped device, service-worker offline navigation, live Supabase sign-in or multi-device conflict was exercised in this check. Safe-area support was inspected in CSS; this is not device certification.

## Dependency audit

The previous report of four low findings is superseded by these results, checked on 3 November 2026:

| Scope                                            | Low | Moderate | High | Critical | Total |
| ------------------------------------------------ | --: | -------: | ---: | -------: | ----: |
| Full dependency tree (`npm audit`)               |   2 |        8 |    0 |        0 |    10 |
| Production dependencies (`npm audit --omit=dev`) |   0 |        0 |    0 |        0 |     0 |

Upgrading vite-plugin-pwa and Workbox did not eliminate the build-tool findings. They concern deepmerge, minimatch and glob and propagate through the PWA build chain, including Rollup helpers, EJS/Jake/filelist. These packages are not included in the browser application. The findings still apply to the build environment; zero production findings does not mean the entire project has no vulnerabilities.

No incompatible forced downgrade or unverified transitive override was applied. Recheck before deployment because advisories and available fixes change. Primary references: [PWA plugin releases](https://github.com/vite-pwa/vite-plugin-pwa/releases), [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).

## Other limits

- Previous live Frankfurter checks on this date returned 165 non-crypto currencies and valid CORS responses. The current UI test uses fixtures; availability/coverage can change.
- FX cache remains browser localStorage. Offline use relies on previously fetched quotes or manual rates, not new live requests. Financial transactions keep their original conversion snapshots.
- Supabase SQL and data-envelope version are unchanged. Existing budgets retain their period; only new workspaces use the current month. The legacy October start-day rule remains exclusively for old documents lacking `firstDay`.
- JSON/CSV exports and browser storage are unencrypted. CSP reduces script-execution exposure; it does not encrypt data or replace Supabase RLS.
- Full PT/EN localization and language selection remain optional unfinished work. The primary interface language is English, declared consistently in HTML and the manifest, with some Portuguese design labels.

Repeat local checks with `npm test`, `npm run build`, `npm run format:check`, `npm audit` and `npm audit --omit=dev`.
