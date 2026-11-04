# Ostrava Pocket

Mobile-first React/TypeScript PWA. Empty by default, offline local storage, optional Supabase email login and manual sync. No bank integration.

Track everyday spending and trips separately, enter purchases in multiple currencies, and manage a prepaid laundry card without counting washes twice. The interface follows the supplied forest-green design: mint actions, gold currency/laundry accents, Plus Jakarta Sans headings, Inter body text and system-font fallbacks. Light and dark themes are supported; new devices start in dark mode and an existing saved preference is preserved.

## Run

Use Node.js 24+ in this folder:

```sh
npm ci
npm run dev
```

Checks: `npm test` and `npm run build`. Production PWA: `npm run preview`. Install from your browser on HTTPS or localhost. On Android choose Install app; on iOS choose Share → Add to Home Screen. Save open forms before accepting Reload & update.

## Interface and navigation

English is the default language. Open **Settings → Language** and choose **Português (Portugal)** to switch immediately. The device remembers the choice across reloads and shares it between open tabs. Navigation, forms, categories, app messages, currency names, dates and amounts follow the selected language. Personal notes, financial values and JSON/CSV field names remain unchanged. Translations live in `src/locales/pt.ts`, with English source messages as keys.

Desktop uses a persistent sidebar, exchange-rate badge and an account/sync status derived from the actual workspace. Mobile uses five navigation controls: Overview, Transactions, a central Add button, Budget, and Settings. Budget and Settings share the same data forms; mobile tabs expose Plan, Exchange rates, Card, Data and Account. Changing pages returns to the top.

Transactions are shown as day-grouped cards with icons, original-currency amounts, incoming-support styling and each day’s net bank movement (washes excluded). The period summary shows gross spending, support and planned remainder. On desktop, laundry and charts appear alongside the ledger. All metrics are calculated from user data.

The transaction editor is a centered dialog on desktop and a scrolling bottom sheet on mobile. It provides type controls, selectable budget-group cards, category chips, the full currency picker and the existing validation. The rate settings include a searchable reference-rate explorer and a simple EUR converter. Card settings include real laundry history and quick actions.

The supplied mockups contain illustrative data, campus locations, service hours, cycle prices, performance trends and encryption claims. Those examples are not injected into the app. The app does not claim end-to-end encrypted storage or invent an exchange rate, transaction or cloud-sync result.

## Using the dashboard

- Tap **Day to day** to filter category guides, spending charts, weekly rhythm and activity to everyday spending. The laundry panel is available in this view.
- Tap **Travel & tourism** to switch to trip spending and its subcategory breakdown.
- The selected card has a green background and highlighted border; the other card stays neutral. The highlight follows your selection in both light and dark themes.
- Tap the selected card again to show **both budgets**, or use the budget-group dropdown. Both cards remain visible so you can switch directly. The dropdown also works on the Transactions page.
- Choose **Month** or **Week** to change the reporting period. You can browse older periods without changing the global monthly plan.
- Use the sun/moon button in the top bar to change theme. Your device remembers the choice. New devices start with the reference design’s dark theme.

## Adding money movements

Choose **Add transaction**, then the type:

| Type           | Effect                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| Expense        | Deducts from the selected everyday category or shared travel budget                      |
| Money received | Adds support, such as money from parents, to that category and budget in the dated month |
| Card top-up    | Counts as a laundry cash outflow and increases prepaid CZK credit                        |
| Wash           | Decreases existing laundry credit without another cash expense                           |

For expenses and support, select **Day to day** or **Travel & tourism**, then the category. Choose the original currency, enter the amount, check the reference or manual rate, and save. The date defaults to today within your tracking period. Use the pencil to edit an entry or the bin to delete it.

## Two budgets

The default monthly total is €550:

| Day to day                          |     EUR |
| ----------------------------------- | ------: |
| Groceries & hygiene                 |     100 |
| Snacks & coffee (including vending) |      45 |
| Restaurants & canteen               |      75 |
| Laundry top-ups                     |      55 |
| Nightlife                           |      90 |
| Other                               |      25 |
| **Day-to-day total**                | **390** |
| **Travel & tourism**                | **160** |

Travel uses one shared cap. Transport, accommodation, food on trips and tourism/activities describe spending within it. Existing travel records remain unclassified until you assign a travel category. Travel and everyday budgets reset each month; neither carries forward. Money received adds support to the chosen category/group in its dated month. Gross expenses and support are displayed separately, so reimbursements never hide purchases or count twice.

Monthly limits are editable globally and must sum to the budget. New workspaces start in the current month and cover four months. Start/end months and the first tracked day are configurable. A partial first month is prorated using its actual number of days, including leap years. Existing Erasmus workspaces retain October 25–31 and their original end month. Editing global limits recalculates historical comparisons. Weekly guides use actual days in the month, with Monday–Sunday weeks clipped at month boundaries.

The app opens at the current Ostrava month and week. It remembers Month/Week view, resets the calendar selection on reopening/resuming the app, and updates after a date change. Manual navigation is available while the app is active. Dates outside the tracking period select the nearest tracked month/week. Extend the tracking dates in settings if needed.

## Laundry accounting

Top-ups count once as bank outflows and increase CZK card credit. Washes consume credit without another bank outflow. Opening credit and leftover card credit carry forward independently of monthly budgets. Negative historical card credit is blocked, even when deleting/editing a top-up. Same-day top-ups precede washes for credit validation because entries store dates, not times. Laundry support is bank money: record a separate top-up when you load the card.

## Currencies, history and backups

Choose a currency from the searchable list when adding an expense or income. The full available Frankfurter monetary-currency catalog is loaded online (cryptocurrencies are excluded). Search by ISO code, English name or Portuguese name. Without a cached catalog, the browser’s ISO currency list is available offline.

Latest EUR reference rates come from Frankfurter v2, refreshed at app opening, reconnection or resumption when the cache is older than six hours. You can also press Refresh rates. The publication date and fetch time are shown; weekends or holidays may return an earlier published rate. This is a reference rate, not guaranteed to match your bank. Choose My bank / manual rate to override it. Backdated entries use the latest reference unless manually overridden; automatic historical-date lookup is not included.

On 3 November 2026 the service returned 165 searchable non-crypto currencies. Coverage can change. No additional API key or Supabase configuration is needed for exchange rates. The settings page provides a rate summary and refresh button; the searchable selector is in the transaction form.

Rates and catalog are cached separately from the financial document, so refreshes do not create Supabase conflicts. Offline entries can use cached rates; without a rate you must enter one manually. Each entry saves its currency, EUR conversion, rate and optional publication/source metadata. Editing starts with the entry’s saved rate, preserving historical valuations. Foreign amounts use currency-specific integer minor units (JPY has no fractional digits, KWD has three). Budgets stay in EUR; the laundry card stays in CZK with EUR/CZK-only top-ups and washes. Bank fees are not inferred.

Transactions are grouped by day, newest day first, then first-added first within a day. Editing an entry preserves its insertion order. Older entries receive an insertion sequence based on their existing stored order; previously lost creation chronology cannot be reconstructed. Sequence numbers travel with JSON, CSV and cloud sync.

JSON saves all settings, plans, history and legacy metadata. Import replaces the workspace after confirmation. CSV exports transactions, including travel categories and insertion order. CSV import merges IDs, skips identical records and rejects changed duplicates. Original 10-column, previous 12-column and 13-column Pocket CSVs are also accepted. New CSVs include rateDate and rateSource. Amount is always in the original currency’s minor units; eur and card credit remain in EUR/CZK cents. Use JSON when moving the complete budget. Export backups before clearing browser storage. Refund/negative entries are not supported; use income for support and edit/delete mistakes.

## Existing budgets migrate automatically

The database envelope remains version 1 with `layoutVersion: 2`, so the existing Supabase schema works unchanged. Legacy budgets get the new €550 allocation; original plans and opening travel/emergency reserves are retained under `legacy` in JSON backups. Those old reserves no longer affect monthly available money.

Removed categories Emergency, Lodging and Local transport map to Other and show a review label. Groceries explicitly described as vending machine map to Snacks. Other unclassified purchases remain in Other; inspect them manually to move hygiene purchases to Groceries if appropriate. IDs, amounts, dates, notes, currency conversions and laundry credit remain intact. No purchase is invented or removed. Local storage also retains the original envelope under `pocket-v1:<workspace>:before-two-budgets` before migration. Migration is idempotent.

Update both phone and PC before syncing this layout. Old clients do not understand the new categories. Read older backups through Import to migrate them. Migration is saved locally and uploaded with Sync now. The generated proposal JSON from another conversation may contain a different schema; prefer an actual Pocket export.

## Optional Supabase

1. Create a Supabase project and run `supabase/schema.sql` once in its SQL editor. It creates owner-only RLS policies and a revision-checked save function. If already configured, do not rerun the schema for this update.
2. Copy `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use the browser publishable key, never a secret/service-role key. 3. Set Supabase Authentication → URL Configuration → Site URL to the app origin and add the same origin to allowed Redirect URLs. Add `http://localhost:5173` if testing locally. Keep email authentication enabled. Restart Vite after changing environment variables. 4. In Account & sync request an email link and open it in the intended browser. The default Supabase sender restricts recipients and volume; use the project owner's authorized email while testing or configure your own SMTP. 5. Sign in with the same email on both devices. Press Sync now before and after editing. Guest/account workspaces are separate: export guest JSON, sign in, import it and sync to migrate existing entries. Opening an account does not upload guest data automatically.

Whole-document sync uses atomic revision checks. Concurrent changes prompt you to export both versions and choose which to keep. Keep local requires another Sync to upload it. Conflict snapshots remain in browser storage. Sign-out keeps the account cache on this device. Local browser storage is not encrypted. For isolation checks, use two accounts and ensure neither can read the other's document. Live cloud checks require your configured project; local unit tests do not prove live authentication works.

### Move phone changes to your PC

1. On your phone, press **Sync now** and wait for **Synced just now**.
2. On your PC, sign in with the same email and press **Sync now**.
3. Before making further changes on either device, sync to load the latest cloud version.

If both devices have unsynced changes, export their JSON backups before choosing a version. **Use cloud version** replaces local changes; **Keep local version** followed by Sync replaces the cloud document. Sync does not automatically merge two independently edited budgets.

## Vercel

Push this folder's contents to GitHub and import the repository into Vercel. Framework: Vite; Node: 24; build: `npm run build`; output: `dist`. Add both VITE_SUPABASE variables in Production and redeploy after changes. Without keys it runs in local-only mode. Configure the final HTTPS origin in Supabase before signing in. Free-plan service limits and inactivity rules apply.

After a code update, push the changed files and wait for Vercel to finish deployment. After environment-variable changes, redeploy to rebuild the app. Update the app on both phone and PC before syncing new transaction features.

## Troubleshooting

- **A device shows an older interface:** accept **Reload & update** if offered, then close and reopen the app. On desktop, try Ctrl + Shift + R. A private window can confirm whether the deployed version is newer. Export JSON before any action that clears site data.
- **Account & sync still shows local mode:** confirm both `VITE_SUPABASE_*` variables are configured for Production and rebuild the deployment. Supabase integration variables with other names do not replace these two.
- **Android cannot find an import file:** download it to internal Downloads and browse that folder in the file picker. The picker permits all file types to avoid Android MIME-filter issues; the app validates content before importing. If the budget already exists on your PC, import there and sync to your phone instead.
- **Reference rates fail to load:** use the cached quote or select **My bank / manual rate**. An uncached currency needs a manual rate while offline.
- **A wash or deletion is rejected:** the change would make historical laundry credit negative. Correct the missing top-up or opening credit first.

## Verification

`npm test` currently runs 27 tests covering accounting, migration, dates, ordering, currencies, backup round trips and platform configuration. `npm run build` checks TypeScript and generates the production app and service worker. See [VERIFICATION.md](VERIFICATION.md) for the checks performed and their limits. The redesign passed a Chrome browser smoke check at 320, 390, 768 and 1440px, including mobile navigation, currency search, card filtering, expense creation/editing and light theme. These checks used isolated test data and mocked rate responses; they are not tests on a physical Android device or live Supabase accounts.

Official references: [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite), [Supabase keys](https://supabase.com/docs/guides/getting-started/api-keys), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Platform and maintenance update

- The manifest has a stable `id: /`, `lang: en`, a separate maskable icon with approximately 20% padding and narrow/wide installation screenshots. Screenshots are illustrative, not personal bank records.
- New workspaces start in the current month and cover four months. The first tracked day is configurable and prorated for any month. Existing documents without `firstDay` keep the legacy October interpretation. Changing dates recalculates the plan and rejects changes excluding entries.
- Production headers include CSP, frame-ancestors/X-Frame-Options and Permissions-Policy. Script execution is restricted to same-origin code. Inline styles support React charts; Google Fonts is allowed explicitly. Connections allow Supabase domains and Frankfurter. For a custom Supabase domain, change connect-src. Narrow the wildcard to your project host if desired. Vercel applies these headers; the development server does not automatically apply them.
- FX responses remain in localStorage, not service-worker runtime caching. Offline use has previously fetched quotes or manual rates. Login/sync need a connection.
- JSON/CSV backups are unencrypted plain text: keep them private. Account login does not encrypt exported files.
- The currency picker supports arrows, Enter and Escape, active-descendant and focus restoration. Transaction deletion uses an app dialog and Undo; restoring an entry validates laundry credit. The logout warning remains a native confirmation.
- Safe areas cover top, bottom and landscape sides. Supabase is a separate production chunk; this is not lazy loading in every configured guest session.
- Use `npm run format` and `npm run format:check`. Views are in src/views; the editor and shared panels are in src/components.
- The manifest/document explicitly identify English as the primary interface language. Portuguese design labels and currency-search aliases remain available; a full PT/EN translation and language selector are not implemented.

Consult VERIFICATION.md for the latest checks and dated audit counts; see IMPROVEMENTS.md for the status of each review point.
