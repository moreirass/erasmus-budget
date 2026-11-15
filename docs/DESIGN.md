# Pocket interface system

## Audit

The existing screens repeat the add action and introductory text, use multiple card styles, mix 8–13 px labels with large headings, and place long management lists ahead of the settings tabs. The ledger has no separate no-results or detail state. Fixed colors and repeated responsive overrides weaken light-theme consistency.

## Direction

A quiet financial notebook: forest surfaces, mint selection/actions, gold reserved for currency/card information. Primary hierarchy: period → remaining budgets → spending detail → activity. No invented forecasts or records.

## Tokens

Colors live in src/tokens.css with complete light/dark palettes: canvas, surface, inset, elevated, active, text, muted, border, action, gold, error, and seven chart categories. CSS components consume these tokens. Dark is the existing new-device default. Text/muted pairs target 4.5:1; controls have visible borders/focus and 44 px minimum touch targets.

Inter body 16/24 px; Plus Jakarta Sans headings 28–36/1.2, section headings 20/1.35. Secondary text never below 14 px. Monetary values use tabular numerals and wrap rather than truncate. Spacing scale 4, 8, 12, 16, 24, 32, 48 px; radii 8, 12, 20 px. Subtle token shadows only for floating surfaces.

## Components

Native buttons/inputs/selects use one base treatment with primary, secondary, icon and text variants. Shared Field, Modal, EmptyState, Metric and Notice components handle repeated presentation. Segmented controls and chips expose pressed state. Budget bars always accompany numeric labels; alerts pair icon and text. Transaction rows keep amount and actions visible, with an optional detail dialog. Native dialog focus containment/restoration is preserved; editor cancellation explicitly handles unsaved changes.

## Layout

At 1024+ px: 240 px persistent sidebar, compact top bar, centred maximum-width content; two-column overview/ledger/settings where useful. At 768–1023 px: compact sidebar and two-column layouts only when readable. Below 768 px: five-control bottom navigation, safe areas on every edge, single-column content, wrapping settings tabs and a scrolling editor sheet. The central Add is the mobile creation action; desktop uses the top bar.

Settings tabs precede content. Plan includes recurring/favourite management after the budget, not before it. Language, theme and alerts remain easy to reach. Account and Data explain manual sync and unencrypted files. EN source strings use the existing tr mechanism with pt-PT mappings.

## Boundaries and validation

No changes to model.ts, hooks, store.ts, sync protocol, schema, storage identifiers or backup formats. Keep recurring processing mounted off-screen. Every stage runs the 48 unit tests and production build before a commit. Final Chrome checks cover both themes, EN/PT, 320/390/768/1440 widths and isolated interaction/error states. Physical devices and live Supabase are reported separately.
