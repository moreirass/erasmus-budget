# Ostrava Pocket

Mobile-first React/TypeScript PWA. Empty by default, offline local storage, optional Supabase email login and manual sync. No bank integration.

## Run

Use Node.js 24+ in this folder:

```sh
npm ci
npm run dev
```

Checks: `npm test` and `npm run build`. Production PWA: `npm run preview`. Install from your browser on HTTPS or localhost. On Android choose Install app; on iOS choose Share → Add to Home Screen. Save open forms before accepting Reload & update.

## Two budgets

The default monthly total is €550:

| Day to day | EUR |
|---|---:|
| Groceries & hygiene | 100 |
| Snacks & coffee (including vending) | 45 |
| Restaurants & canteen | 75 |
| Laundry top-ups | 55 |
| Nightlife | 90 |
| Other | 25 |
| **Day-to-day total** | **390** |
| **Travel & tourism** | **160** |

Travel uses one shared cap. Transport, accommodation, food on trips and tourism/activities describe spending within it. Existing travel records remain unclassified until you assign a travel category. Travel and everyday budgets reset each month; neither carries forward. Money received adds support to the chosen category/group in its dated month. Gross expenses and support are displayed separately, so reimbursements never hide purchases or count twice.

Monthly limits are editable globally and must sum to the budget. October 25–31 is automatically prorated; November–January use full months. Editing global limits recalculates historical comparisons. Weekly guides use actual days in the month, with Monday–Sunday weeks clipped at month boundaries.

The app opens at the current Ostrava month and week. It remembers Month/Week view, resets the calendar selection on reopening/resuming the app, and updates after a date change. Manual navigation is available while the app is active. Dates outside the tracking period select the nearest tracked month/week. Extend the tracking dates in settings if needed.

## Laundry accounting

Top-ups count once as bank outflows and increase CZK card credit. Washes consume credit without another bank outflow. Opening credit and leftover card credit carry forward independently of monthly budgets. Negative historical card credit is blocked, even when deleting/editing a top-up. Same-day top-ups precede washes for credit validation because entries store dates, not times. Laundry support is bank money: record a separate top-up when you load the card.

## Currencies, history and backups

Enter EUR or CZK amounts and your effective CZK-per-EUR rate. Conversion is saved on each entry and never changes when the default rate changes. There is no automatic market-rate feed. Bank fees are not inferred.

Transactions are grouped by day, newest day first, then first-added first within a day. Editing an entry preserves its insertion order. Older entries receive an insertion sequence based on their existing stored order; previously lost creation chronology cannot be reconstructed. Sequence numbers travel with JSON, CSV and cloud sync.

JSON saves all settings, plans, history and legacy metadata. Import replaces the workspace after confirmation. CSV exports transactions, including travel categories and insertion order. CSV import merges IDs, skips identical records and rejects changed duplicates. Original 10-column and previous 12-column Pocket CSVs are also accepted. Use JSON when moving the complete budget. Export backups before clearing browser storage. Refund/negative entries are not supported; use income for support and edit/delete mistakes.

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

Use the browser publishable key, never a secret/service-role key.
3. Set Supabase Authentication → URL Configuration → Site URL to the app origin and add the same origin to allowed Redirect URLs. Add `http://localhost:5173` if testing locally. Keep email authentication enabled. Restart Vite after changing environment variables.
4. In Account & sync request an email link and open it in the intended browser. The default Supabase sender restricts recipients and volume; use the project owner's authorized email while testing or configure your own SMTP.
5. Sign in with the same email on both devices. Press Sync now before and after editing. Guest/account workspaces are separate: export guest JSON, sign in, import it and sync to migrate existing entries. Opening an account does not upload guest data automatically.

Whole-document sync uses atomic revision checks. Concurrent changes prompt you to export both versions and choose which to keep. Keep local requires another Sync to upload it. Conflict snapshots remain in browser storage. Sign-out keeps the account cache on this device. Local browser storage is not encrypted. For isolation checks, use two accounts and ensure neither can read the other's document. Live cloud checks require your configured project; local unit tests do not prove live authentication works.

## Vercel

Push this folder's contents to GitHub and import the repository into Vercel. Framework: Vite; Node: 24; build: `npm run build`; output: `dist`. Add both VITE_SUPABASE variables in Production and redeploy after changes. Without keys it runs in local-only mode. Configure the final HTTPS origin in Supabase before signing in. Free-plan service limits and inactivity rules apply.

Official references: [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite), [Supabase keys](https://supabase.com/docs/guides/getting-started/api-keys), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
