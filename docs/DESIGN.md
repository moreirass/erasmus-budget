# Pocket interface system

## Direction and structure

Forest surfaces, one mint action/selection accent, gold only for currency/laundry and semantic error styling. Preserve all destinations, form actions, grouping and calculations. Pending behavioural ideas live in PROPOSALS.md.

## Tokens

Colour roles: canvas, surface, inset, elevated, active, text, muted, disabled, border, action/on-action, gold/background, error/background. Seven chart series use shades of the existing green palette with numeric legends; laundry alone may use gold.
Type: Inter body and monetary values; Plus Jakarta Sans headings. 14/16/20/24/32/48px scale; 16px mobile body. Tabular numerals for financial values, dates, rates and percentages. Balanced heading wrapping, unbroken amounts.
Spacing: 4/8/12/16/24/32/48px. Radius: 16px outer, 8px inner at 8px padding, square inner at 16px padding. Touch minimum44px. Shadow only on floating menus/dialogs/toasts. Layers: header10, navigation20, toast40, modal50.
Motion: 180ms ease-out; transform/opacity only, finite feedback. Reduced motion disables animations/transitions. Refresh progress retains previous values without decorative loops.

## Components

Native accessible controls with shared primary/secondary/destructive styles; Field, Search, chips, Metric, bars, transaction rows, Notice, EmptyState, Skeleton/BusyButton, Modal/UnsavedDialog. One dominant action per current screen or modal; contextual actions remain available with lower visual weight. Lucide icons,1.75 stroke,16/20/24 grid. No decorative badges, emoji, gradients or illustrations.

## Layout

Existing mobile five-control navigation and settings tabs preserved. Desktop sidebar and two columns retained. Spacing groups related content; forms avoid nested bordered cards. Safe areas on all edges. Check320/390/768/1440px in EN/PT and dark/light.

## Language

English source keys and a separate English catalog, PT-PT equivalents with identical keys and placeholders. First launch uses navigator language (pt variants→pt; otherwiseen); saved choice wins. Runtime switching preserves mounted inputs/scroll. Intl handles dates, numbers, currency, percentages and plurals. Titles/lang/accessible names update. Data, notes, storage keys and machine-readable exports never translate. Unknown provider errors use localized generic UI feedback; technical diagnostics remain unchanged internally.

## Verification

Run tests/build at every commit, plus dictionary parity/source-key checks. Browser matrix uses disposable data and mocked networking. Verify language switch mid-form, longPT labels, busy states, reduced motion and dialog focus. LiveSupabase, physicaldevices and realSW lifecycle remain separate verification boundaries.
