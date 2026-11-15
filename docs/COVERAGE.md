# Redesign coverage — 15 November 2026

Branch: `codex/calm-pocket-redesign`. Base: `240efd2`.

**Done** means the interface exists and was rendered in Chrome, including isolated fixtures where a live account or unusual state was needed. It does not mean physical-device or live-service certification. **Partial** identifies an explicit verification gap. No financial fixtures are bundled into the application; browser checks used separate disposable storage and mocked reference-rate responses.

## Screens and states

| Screen       | State or action                                                               | Status | Evidence / boundary                                                                                                             |
| ------------ | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Navigation   | Five mobile controls, desktop sidebar, rate and workspace badges              | Done   | 320, 390, 768 and 1440px; navigation actions exercised.                                                                         |
| Overview     | Month/week selection; Day to day, Travel and Both                             | Done   | All variants rendered; filtering and navigation exercised.                                                                      |
| Overview     | Spending, money received, planned remainder, selected budget cards            | Done   | Existing summary values; selected card toggles back to Both.                                                                    |
| Overview     | Category guides, 80%/100% indicators, charts with numeric legends             | Done   | Threshold fixture, labels and values rendered; no colour-only alert.                                                            |
| Overview     | Recent activity and first-use empty state                                     | Done   | Populated and isolated empty workspaces rendered.                                                                               |
| Overview     | Favourites, pending recurring occurrences, laundry, backup reminder           | Done   | Launch/undo, confirm/edit/ignore, top-up/wash and reminder controls exercised.                                                  |
| Transactions | Day groups, daily net bank movement, original amounts                         | Done   | Daily totals retain the model's exclusion of washes from bank movement.                                                         |
| Transactions | Search, group/category filters, empty and no-results states                   | Done   | No-results has a distinct Clear filters action.                                                                                 |
| Transactions | Read-only detail and edit handoff                                             | Done   | Focus restoration, original three-decimal currency amounts, live row refresh/removal and opening the editor checked.            |
| Transactions | Delete confirmation and Undo                                                  | Done   | Entry restored through existing validation; delete summary shows original currency.                                             |
| Editor       | Expense, Money received, Card top-up and Wash; add/edit                       | Done   | All four kinds saved through the production form and unchanged accounting.                                                      |
| Editor       | Amount/currency/date, budget cards, categories, note, rate and EUR equivalent | Done   | Bottom sheet/mobile and centred dialog/desktop; no clipped amounts.                                                             |
| Editor       | Searchable currency picker, keyboard selection, manual rate                   | Done   | Arrows/Enter and manually entered conversion exercised.                                                                         |
| Editor       | Validation and insufficient historical card credit                            | Done   | Invalid wash rejected and inline error rendered.                                                                                |
| Editor       | Unsaved changes, Keep editing, Discard, successful save                       | Done   | Manual, favourite, recurring-rule and pending-occurrence guard actions and save bypass exercised.                               |
| Editor       | Saved and monthly-limit notifications                                         | Done   | Existing notifications retained with icons and accessible text.                                                                 |
| Budget       | Monthly total/category distribution, month/scope, saved feedback              | Done   | Plan changed and saved; selected month remains selected.                                                                        |
| Budget       | Replacement warning and invalid distribution                                  | Done   | Following-month warning rendered; mismatch shows feedback and disables Save.                                                    |
| Budget       | Tracking period, first tracked day, opening balances                          | Done   | Settings rendered; invalid tracking change rejected. Existing model tests retained.                                             |
| Recurring    | Rule list, empty state, create/edit/delete, schedule/mode                     | Done   | Rule creation, edit and deletion exercised; generated entries unchanged.                                                        |
| Recurring    | Pending occurrence Confirm/edit/Ignore and automatic Undo                     | Done   | Production components rendered and callbacks exercised.                                                                         |
| Favourites   | List/empty, create/edit/delete, use/Undo, missing rate                        | Done   | All actions exercised with isolated records.                                                                                    |
| Laundry      | Balance, history, opening credit and quick actions                            | Done   | Real fixture history displayed; no assumed wash prices or hours.                                                                |
| Laundry      | Insufficient and blocked-change errors                                        | Done   | Invalid wash rejected; deleting a consumed top-up shows an error and preserves the record.                                      |
| Exchange     | Searchable currencies, converter, published/fetched dates                     | Done   | Mocked reference response; search and conversion exercised.                                                                     |
| Exchange     | Refreshing, cached/offline, error and missing rate                            | Done   | Held/failed mock responses render refreshing/error and missing quote; cached fixture renders offline.                           |
| Data         | JSON/CSV export and reminder interval                                         | Done   | Export Blob contents inspected; disk download completion not checked.                                                           |
| Data         | Import preview, cancellation, confirmation, duplicates, invalid file          | Done   | Invalid content rejected; duplicate-free CSV merge and preview actions exercised.                                               |
| Account      | Unconfigured local mode and email-link request/success                        | Done   | Production settings rendered with mock OTP; real email delivery not tested.                                                     |
| Account      | Pending changes, syncing, synced, offline, error                              | Done   | Production settings rendered with isolated store fixtures in both themes.                                                       |
| Account      | Conflict; Export both, Keep local, Use cloud                                  | Done   | Both versions displayed and callbacks exercised. Existing sync protocol tests pass; no live cloud write.                        |
| Account      | Sign-out confirmation                                                         | Done   | Dialog and Cancel exercised with pending-change fixture.                                                                        |
| Settings     | Dark/light, English/Portuguese, limit alerts                                  | Done   | Theme/language changes persist on reload; preferences rendered.                                                                 |
| Settings     | Offline notice                                                                | Done   | Offline UI state rendered; no service-worker offline navigation test.                                                           |
| Settings     | Update available, save-open-forms warning, Reload & update                    | Done   | Actual App renders with mocked PWA hook; warning and reload callback checked. Real service-worker lifecycle remains unverified. |

## Delivery checkpoints

Every implementation checkpoint ran formatting, **48/48 tests** and the production TypeScript/Vite/PWA build successfully before committing. Subsequent focused checks address changes made after the broad browser pass.

The broad browser run contains 209 layout/state samples and 20 workflow groups. Follow-up checks cover 6 updated Overview/editor layouts, settled account contrast/focus restoration, and a final 13 workflow groups with 8 additional rendered-state samples. No requested interface is missing. Live-service, physical-device and service-worker lifecycle verification remains outstanding as described below.

| Step                               | Commit    | Main files                                                                            | Result |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------------- | ------ |
| Tokens/base                        | `ca3a138` | `src/tokens.css`, `src/style.css`, `docs/DESIGN.md`                                   | Pass   |
| Shared components                  | `7c9922e` | `src/components/Primitives.tsx`, styles                                               | Pass   |
| Layout/navigation                  | `d17c3bd` | `AppLayout.tsx`, `PeriodControls.tsx`, translations/styles                            | Pass   |
| Overview                           | `378581a` | `src/views/Overview.tsx`, `Panels.tsx`, translations/styles                           | Pass   |
| Transactions                       | `a92a10a` | `src/views/Transactions.tsx`, `Panels.tsx`, translations/styles                       | Pass   |
| Editor                             | `c638bf0` | `TransactionEditor.tsx`, `LedgerDialogs.tsx`, translations/styles                     | Pass   |
| Budget/settings navigation         | `78b111e` | `src/views/Settings.tsx`, `src/App.tsx`, translations/styles                          | Pass   |
| Recurring/favourites               | `40916cd` | `Recurring.tsx`, `Favorites.tsx`, translations/styles                                 | Pass   |
| Laundry                            | `11e9df6` | `Panels.tsx`, translations/styles                                                     | Pass   |
| Exchange                           | `5d870e2` | `Panels.tsx`, styles                                                                  | Pass   |
| Data                               | `2e285f2` | `DataDialogs.tsx`, styles                                                             | Pass   |
| Account/preferences                | `6dcfd63` | `Settings.tsx`, `App.tsx`, styles                                                     | Pass   |
| Theme/accessibility polish         | `bf31fe5` | tokens, styles, navigation/translations                                               | Pass   |
| Overview columns/detail correction | `4814cae` | `Overview.tsx`, `Panels.tsx`, styles                                                  | Pass   |
| Precision/shared discard guard     | `870ac28` | `formatAmount.ts`, `UnsavedDialog.tsx`, ledger/recurring/favourite components, README | Pass   |

## Limits and review

Review screenshots: [dark mobile Overview](previews/overview-dark-mobile.png), [light desktop Overview](previews/overview-light-desktop.png), [mobile editor](previews/editor-dark-mobile.png). These contain isolated QA records and mocked rates only. They are documentation, not preloaded application data.

- Accounting, hooks, persistence, sync, backup formats, exchange-rate retrieval, Supabase schema, package manifests and lockfile have no diff from the base commit.
- Browser checks used Chrome with production headers and CSP, mocked Frankfurter responses and blocked service workers. Account fixtures render the real components but substitute authentication/network callbacks.
- Computed text-contrast sampling, target/font sizes, amounts and overflow were inspected. This is not a full screen-reader audit or accessibility certification. No physical Android/iOS device or notch/landscape device was available.
- No real Supabase authentication, cross-account RLS test, two-device network sync or conflict was performed. No changes were pushed or deployed.
- See [VERIFICATION.md](../VERIFICATION.md) for test details and historical checks. Dependency audit counts are dated; no new audit or dependency upgrade is claimed for this UI work.
