# Ostrava Pocket

A mobile-first React + TypeScript budget PWA for your Erasmus stay. Works without an account; optionally syncs through your own Supabase project. No bank connection, sample spending or invented bank balance.

## Run locally

Install Node.js 24+ (Node 24 LTS recommended). Open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No environment variables are needed. To check the production PWA:

```sh
npm test
npm run build
npm run preview
```

The PWA service worker is enabled in production, not the development server. After the first online visit, the app shell and local data work offline. Installation needs HTTPS (or localhost). On Android/desktop use your browser's install action; on iOS use Safari → Share → Add to Home Screen. Fonts fall back to system fonts offline. When an update is ready, save any open form before accepting Reload & update.

## First use

1. Open **Budget & settings**. The default period is November 2026–January 2027, matching the original plan. Change it if you want to track October as well.
2. Enter your own CZK-per-EUR exchange rate, or enter a rate for each transaction. There is deliberately no invented or automatic market rate. Use the effective rate from your bank if you want conversions to match actual debits; bank fees are not inferred.
3. Enter existing laundry credit in CZK and existing travel/emergency reserves in EUR, if any. Defaults are zero, not assertions about your bank account.
4. Add an expense, top-up, or wash. Edit or delete records from the transaction list.
5. Export JSON regularly, especially before clearing browser storage.

### Your monthly plan

| Category | EUR |
|---|---:|
| Groceries | 170 |
| Restaurants | 40 |
| Laundry top-ups | 55 |
| Nightlife | 80 |
| Travel | 150 |
| Hygiene / other | 25 |
| Emergency | 30 |
| Lodging | 0 |
| Local transport, covered by ISKAM | 0 |
| **Total** | **550** |

Limits must add up to the budget. A saved plan applies from its effective month until the next saved plan. Changing a historical plan deliberately changes historical allocations. The recurring allocations are calculated once per calendar month; there is no scheduler to duplicate or miss a contribution.

## Accounting rules

- Amounts use integer cents. Each transaction retains its original currency, amount, exchange rate and EUR conversion. Changing the default rate never revalues existing transactions.
- **Money out** sums ordinary expenses and laundry top-ups. It excludes washes and planned savings allocations. It is not a bank balance.
- **Everyday budget left** is monthly budget minus travel/emergency allocations minus ordinary-category cash outflows. It excludes travel/emergency spending, which is deducted from those rolling funds. Negative amounts remain visible.
- **Travel/emergency funds** equal opening reserves + allocations from the start month through the viewed month − expenses in that category through the viewed period's end. No allocations accrue after the configured end month. These are budget envelopes, not verified savings-account balances.
- **Laundry top-up:** money leaves the bank once; CZK credit increases. An EUR top-up converts into CZK at that entry's rate.
- **Wash:** CZK credit decreases; bank outflow remains zero. Credit rolls over independently of months. Opening card credit does not count as spending. Negative card credit is blocked, including when editing/deleting historical top-ups. Same-day top-ups precede washes because records have dates, not times.
- **Week view:** Monday–Sunday weeks are clipped to the selected month. Guides are prorated by actual days in that month, so boundary weeks have smaller guides. Rolling fund/card balances are shown through the selected week's end, while the month’s reserve is allocated on its first day.
- Future months are plan previews. Future-dated transactions are allowed and labelled; they affect their future period. No expenses are prepopulated.

## JSON and CSV

**JSON** is a complete, versioned backup of settings, effective-dated plans, opening balances and transactions. Restoring replaces the current workspace after confirmation.

**CSV** is a transaction-only exchange format. Import merges by ID, skips identical records, and rejects changed records sharing an ID. Current settings and plans are retained. Use a JSON backup to move the entire budget to another device or account. Imports validate dates, conversions, limits and laundry credit before saving.

CSV columns, in order:

```text
id,date,kind,category,amount,currency,rate,eur,credit,note
```

`amount` is original currency cents; `eur` is EUR cents; `credit` is CZK cents (zero for ordinary expenses). `rate` means CZK per EUR. Kinds: `expense`, `topup`, `wash`. Category IDs are in `src/model.ts`. CSV supports quoted commas/newlines; formula-like notes are escaped on export. Only Pocket-format CSV is accepted, not arbitrary bank statements. Refunds/negative transactions are not supported in this version; correct erroneous entries through edit/delete.

## Optional Supabase authentication and sync

1. Create a Supabase project. In the SQL editor run **supabase/schema.sql** once. It creates an account-owned document table, row-level security policies and an atomic revision-checking save function.
2. Copy `.env.example` to `.env.local` and fill in your project URL and **publishable** key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Never put a secret or service-role key in the browser configuration.
3. In Supabase Authentication → URL Configuration, set the Site URL to your deployed app origin. Add `http://localhost:5173` and your production origin to allowed redirect URLs. For production-preview testing add its exact origin too.
4. Enable email authentication. The app uses email magic links. Supabase's built-in mail sender has restrictions; configure your own SMTP provider if you need to send to other addresses or exceed those limits. Avoid link-scanning/reuse issues by opening the fresh sign-in link in your intended browser.
5. Restart Vite after editing environment variables. Open **Budget & settings → Account & sync**, enter your email and open the link.
6. Press **Sync now** on a new device to load its cloud budget. Press Sync before and after editing on each device. Offline edits stay local until you sync again; this version intentionally does not perform background sync.

Guest and signed-in workspaces have separate browser storage. Signing in never automatically uploads guest records. To migrate, export guest JSON, sign in, import it and sync. Signing out leaves that account's cached data on the device for the next sign-in. Use a private/trusted browser; browser data is not encrypted at rest.

Sync compares revisions before uploading. If both devices changed, neither is silently overwritten: export both versions if needed, then choose the local or cloud version. Choosing local requires another Sync to upload it. Conflicting snapshots are retained under `pocket-v1:<user-id>:conflict` in browser storage. This is whole-document sync, not automatic record-level merging. Concurrent-tab saves also check the local document stamp. Local storage failure is surfaced rather than reported as saved.

### Verify cloud isolation after setup

Use two different test accounts. Save and sync a distinct budget in each; neither should see the other's data. In the Supabase SQL editor verify RLS is enabled and the three ownership policies are present. With two browsers on the same account, change both offline, sync one, then sync the other: the second should show a conflict. Live authentication/database checks require your project and keys and are not included in the local test result.

## Deploy to Vercel

1. Push the project folder to your Git repository (exclude `node_modules`, `dist` and `.env.local`).
2. Import the repository into Vercel. If this project is inside a larger repository, set Root Directory to this folder.
3. Use framework **Vite**, build command `npm run build`, output directory `dist`, and Node.js 24.
4. Add the two `VITE_SUPABASE_*` environment variables if you want cloud mode. You can deploy without them for local-only use.
5. Deploy. Add the final HTTPS origin to Supabase's Site URL and redirect allowlist. Environment-variable changes require a new Vercel deployment.
6. Visit the deployed app once online, then install it from your phone's browser.

The project is prepared for personal use on free plans, but service limits and email delivery conditions still apply. No deployment or cloud account has been created for you.

Official references: [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite), [Vercel plans](https://vercel.com/pricing), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Supabase magic links](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Project map

```text
src/App.tsx           Screens, forms, SVG charts
src/style.css         Responsive UI and mobile navigation
src/model.ts          Pure accounting and validation
src/model.test.ts     Accounting / backup regression tests
src/transfer.ts       JSON download and CSV round trips
src/store.ts          Local persistence, auth and revision-safe sync
supabase/schema.sql   Database, ownership policies and save function
vite.config.ts        Production PWA and precaching
vercel.json           Vercel build settings and headers
```

No paid API, analytics, bank integration or server process is required. Local financial data is stored under `pocket-v1:guest`; account caches use a separate user ID key.

