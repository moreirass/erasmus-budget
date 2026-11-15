# Verification

## Bilingual UI refinement and transaction time

Base ae629f2; branch codex/pocket-ui-language. See docs/COVERAGE.md for all screens, 20 UI rules and proposals; docs/PROPOSALS.md records approval/impact/rollback. The language selector already existed and was completed, not invented anew.

- 52 tests pass (48 existing plus catalog/device-language and time-compatibility coverage); production TypeScript/Vite/PWA build and formatting pass. Every implementation commit passed its applicable 50/52 tests and build. No new dependencies.
- 176 rendered state/layout samples cover 320/390/768/1440px, both themes and EN/PT. After correcting a narrow-screen metric overflow, no document overflow, sampled clipped amounts, text below 14px, controls below 44px or computed text-contrast failures remained. Disabled text was included. This is sampling, not accessibility certification.
- Targeted browser checks confirm P1 draft retention across navigation, P2 scoped totals, P3 recorded time and latest-added-first display, mid-form locale changes retaining input nodes/values/time/sheet scroll, language-selector page-scroll preservation, saved language after reload, export feedback and stable-size/disabled import reading.
- Motion checks exercise animated dialog cancellation and reduced-motion disabling. Exit transitions use the optional native View Transitions API; unsupported browsers perform the action immediately. No looping decoration.
- Date/time metadata is optional. Time is HH:mm in Europe/Prague; legacy/scheduled unknown times remain absent. The new 16-column CSV includes time and reads old 10/12/13/15-column CSVs. Tests verify old CSV merge preserves an existing time, JSON/CSV round trips, invalid-time rejection and insertion order unaffected by edits/recorded time.
- P3 deliberately changes transaction metadata validation, display ordering and CSV shape with user authorization. Financial arithmetic, historical credit validation, storage keys, sync protocol and SQL schema are unchanged. P1/P2 only affect presentation/lifecycle. Language/visual feedback extend existing hooks without replacing the state layer.
- Built assets were served to isolated Chrome contexts through same-origin interception with production CSP. Frankfurter/account responses are mocked; no personal records/accounts were accessed. Localhost HTTP preview was blocked/timed out despite Vite starting, so a live preview could not be verified.
- No physical device install, real SW offline/update lifecycle, live email delivery, live Supabase two-device sync or download-file completion was checked. Source remained local; no push/deployment. Figma had no supplied destination/source file; no new Figma file or hosted Site was created.

## Interface redesign — 15 November 2026

Branch `codex/calm-pocket-redesign`, based on `240efd2`. Implementation follows the ordered checkpoints in [docs/COVERAGE.md](docs/COVERAGE.md); design rules and the short audit are in [docs/DESIGN.md](docs/DESIGN.md).

### Changes and automated checks

- Semantic tokens cover both themes; type, controls, navigation, overview, ledger, editor, settings sections, recurring/favourites, laundry, exchange rates, data and account states were revised. All new interface strings use English source keys with Portuguese (Portugal) translations.
- **All 48 existing tests pass.** Every implementation checkpoint ran the tests and TypeScript/Vite/PWA production build before committing. Formatting passes. No new runtime or development dependencies were added.
- Accounting (`model.ts`), persistence (`store.ts`), all hooks, sync protocol, exchange-rate retrieval, JSON/CSV transfer, schema and dependency files are unchanged from the base commit. No user data was read, migrated or populated by the redesign.
- Original-currency presentation uses a UI formatter respecting currency minor units, including three-decimal currencies. This does not change stored amounts or conversions. Transaction details resolve their selected ID from current rows rather than retaining a stale object.
- Transaction, favourite, recurring-rule and pending-occurrence dialogs share an unsaved-change guard. Successful saves close directly; cancellation offers Keep editing or Discard. Browser navigation warnings are registered only after edits.
- Production output at the final code checkpoint: main JavaScript approximately **387.19 KB / 118.31 KB gzip**, Supabase **227.08 KB / 58.97 KB gzip**, CSS **67.19 KB / 12.56 KB gzip**. No JavaScript chunk exceeds the default 500 KB warning. The Supabase chunk remains separate; this does not assert lazy loading.

### Browser and interaction evidence

- The broad Chrome pass covered **209 layout/state samples and 20 workflow groups** across 320, 390, 768 and 1440px, dark/light themes and English/Portuguese layouts. There were no uncaught errors, horizontal document overflows or clipped amount findings. Font and control sampling found no text below 14px or non-checkbox controls below 44px in the sampled visible states.
- Computed text-contrast sampling was checked against AA thresholds. Initial measurements taken during theme transitions were repeated after settling, with no remaining sampled contrast failures. Follow-up checks after the final layout changes covered mobile Overview/editor and desktop light Overview/editor.
- Exercised entry creation for all four kinds, immutable conversion snapshots, details, edit/delete/Undo, currency keyboard navigation/manual rates, insufficient laundry credit, unsaved draft choices, favourites/use/Undo/missing rate, recurring rule and occurrence actions, monthly plan changes, JSON/CSV payloads and import validation/preview/merge, backup reminders and persistent appearance/language choices.
- Dialog focus restoration was explicitly checked after detail → Edit → Close and nested Discard. Tests use real components and browser events, not duplicate implementations of accounting rules.
- Focused follow-up checks passed for all four editor guards and successful-save bypass, KWD three-decimal details/delete/template amounts, EUR laundry quote labels, income labels, and detail updates/removal after simulated cross-tab storage events. Invalid plan distribution disables Save, following-month replacement feedback renders, and invalid tracking changes are rejected. Held/failed rate responses exercise refreshing, missing quote and error feedback.
- The final focused pass covered **13 workflow groups and 8 additional rendered-state samples**, with no sampled contrast, size, overflow or clipped-amount findings. It also verified blocked deletion of a consumed card top-up, retention of cached rates after a failed refresh, and the actual App's update-ready/open-form warning with a mocked PWA hook and reload callback. This verifies the UI, not a real service-worker update.
- Account fixtures rendered email-link request/success, pending changes, syncing, synced, offline, error, conflict and sign-out confirmation. Export-both and both conflict-resolution callbacks were exercised. These substitute store/network callbacks; they do not prove live Supabase authentication or sync.

### What was not checked

- No physical Android/iOS install, physical safe-area/landscape test or full assistive-technology audit.
- Service workers were blocked in browser checks. Offline notices and cached-rate UI are separate from actual offline navigation and the service-worker update lifecycle.
- No live Supabase email delivery, session, cross-account access check or two-device conflict. No live Frankfurter request was used for visual tests; all financial records and quotes were isolated test fixtures, not application defaults.
- Export payloads were inspected at Blob creation; completion of files saved to disk and Android's system file picker were not verified.
- No new dependency audit was run for this UI-only update. The dated audit below is historical, not a current claim.
- Local browser data and exports remain unencrypted. No deployment or push was performed.

## Historical checks — 3 November 2026

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
- At the time of this historical check, full PT/EN localization and language selection were unfinished. They are now available through the existing translation mechanism and were exercised in the November 15 redesign checks.

Repeat local checks with `npm test`, `npm run build`, `npm run format:check`, `npm audit` and `npm audit --omit=dev`.

## App responsibility refactor — 9 November 2026

- App.tsx reduced from 1, 335 to 227 lines. Preferences, reporting periods, ledger actions, notifications, data transfer, settings selections and platform status now have dedicated hooks. Settings, layout, period controls and dialogs are separate components. Persistence/cloud sync remain in store.ts and accounting remains in model.ts.
- Production build and formatting check pass; all 48 existing automated tests pass. No dependency, database schema, storage key or backup-format changes.
- Headless Chrome regression checks with isolated data and mocked FX cover adding/editing/deleting/undoing transactions, searching, month/week navigation, period reset on focus, plan month/scope preservation after saving and navigation, JSON/CSV payloads, import preview/cancellation/confirmation, duplicate-free CSV merge, and theme/language/view persistence after reload. No uncaught page errors. Export payloads were inspected at Blob creation; disk download completion was not verified.
- The existing feature smoke check also passes: PWA add shortcut, remembered currency/category, automatic recurring processing while settings are open, favorite creation/use/undo, budget alert, backup reminder and no horizontal overflow at 320/390/768/1440px. Service workers were blocked in these browser checks.
- Live Supabase authentication and two-device sync were not exercised. Existing sync tests pass; sync implementation and conflict behavior are unchanged. Extracting hooks groups responsibilities and does not on its own eliminate parent re-renders.
