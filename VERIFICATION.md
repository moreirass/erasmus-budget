# Verification — 28 October 2026

- Production TypeScript check and Vite/PWA build: passed.
- Node built-in test runner: 12 tests passed (accounting, rollover, rate snapshots, validation and CSV round trips).
- Headless Edge browser: desktop and 390px mobile rendering passed; no horizontal overflow or runtime errors.
- Browser flows: laundry top-up, wash, local persistence after reload, week selection and allocation validation passed.
- Production service worker: offline reload passed after the first online visit.
- Desktop and mobile screenshots were visually reviewed. They show the empty initial workspace, not sample expenses.
- Supabase SQL, authentication and conflict handling are included but live cloud tests require your own project and keys. Vercel deployment has not been performed.
- Dependency audit after removing the vulnerable test runner: zero critical, high or moderate findings; four low findings trace to `deepmerge` through the PWA build-tool chain. No safe compatible upgrade was offered by the audit; do not apply its suggested major downgrade blindly. These are development dependencies, not the browser's financial-data code.
- Vite reports a bundle-size advisory (~504 KB uncompressed / 145 KB gzip for the main JavaScript bundle); the build succeeds.

Run `npm test` and `npm run build` to repeat the local checks. Use the cloud-isolation checklist in README.md after configuring Supabase.
