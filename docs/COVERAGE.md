# UI refinement coverage

Branch: codex/pocket-ui-language. Base: ae629f2. The PT/EN selector already existed; this update completes device-language defaults, catalog parity and localized field feedback. Financial notes, brand names, currency codes and backup field names intentionally remain unchanged. No known app-owned interface label remains untranslated; unknown service diagnostics use a localized generic error.

## Screen and state coverage

Done means implemented and rendered; mock account/PWA states are distinguished from live infrastructure. No fixture records or quotes are bundled into the app.

| Screen/state                                                            | Status      | Evidence                                                                                                   |
| ----------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| Overview: month/week, Day to day/Travel/Both, figures/cards             | Done        | Browser matrix and selected-budget assertions (P2).                                                        |
| Categories,80%/100%,numeric chart legends,recent activity               | Done        | Existing threshold fixtures and localized matrix.                                                          |
| First-use,favourites,pending occurrences,laundry,backup reminder        | Done        | Empty/fixture flows; actions retained.                                                                     |
| Transactions: daily groups/net movement,search/filters,empty/no-results | Done        | Browser matrix; washes excluded by unchanged accounting.                                                   |
| Detail,edit,delete/Undo                                                 | Done        | Existing workflow checks; precision retained.                                                              |
| Newest addition first within day; recorded time                         | Done        | Unit round trips, ordering assertions and browser save/detail assertions. Legacy unknown time is explicit. |
| Editor: expense,received,top-up,wash; add/edit                          | Done        | Existing production forms with new time field.                                                             |
| Currency/date/time/group/category/note/rate/EUR equivalent              | Done        | Keyboard picker and saved input preservation; EN/PT.                                                       |
| Validation,insufficient credit,unsaved choices,success/limit alerts     | Done        | Existing guard/credit tests; localized native validation.                                                  |
| Budget:total,distribution,scope,replacement/error/success,tracking      | Done        | Form checks; navigation retains drafts (P1).                                                               |
| Recurring rules:create/edit/delete; Confirm/edit/Ignore; automatic Undo | Done        | Existing workflows retained; schedule dates localized.                                                     |
| Favourites:list/empty/create/edit/delete/use/Undo/missing rate          | Done        | Existing workflows; new quick entries record time.                                                         |
| Laundry:balance/history/opening credit/blocked changes                  | Done        | Existing credit tests and blocked top-up fixture.                                                          |
| Rates:search/converter/refresh/cache/offline/error/missing              | Done        | Mocked network; skeleton and last values retained.                                                         |
| Data:JSON/CSV export/import/preview/duplicates/invalid/reminder         | Done        | Unit compatibility and browser stable-size reading/export feedback.                                        |
| Account:local/email-link/pending/syncing/synced/offline/error           | Done (mock) | Real components with mock account/network callbacks.                                                       |
| Conflict:Export both/Keep local/Use cloud; sign-out                     | Done (mock) | Existing callback/confirmation checks. Live server not tested.                                             |
| Appearance/language/alerts/offline/update/open-form warning             | Done        | Matrix, preference persistence and mocked PWA state.                                                       |
| Physical install,real service-worker lifecycle,live Supabase            | Partial     | Not exercised in this environment.                                                                         |

## Twenty UI rules

The brief's related typography and state bullets are grouped into20 review rows.

| Rule                                               | Where applied                                                            | Status                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1 Remove filler badges                             | AppLayout,empty marks,term/mobile branding                               | Done                                                                         |
| 2 Remove redundant labels                          | Page introductions,data headings,editor rate copy                        | Done                                                                         |
| 3 Specific headlines                               | Category spending,backup files,account/manual sync                       | Done                                                                         |
| 4 Balanced headings;unbroken amounts               | Shared CSS,metrics,rows,budget cards                                     | Done                                                                         |
| 5 Defined type scale and fonts                     | tokens.css;14/16/20/24/32/48scale                                        | Done                                                                         |
| 6 No decorative italics/bold/monospace             | Shared body/value fonts and branding                                     | Done                                                                         |
| 7 Tabular locale-aware numbers                     | Values,rates,percentages,dates,time                                      | Done                                                                         |
| 8 AA contrast/readable secondary and disabled text | Dark/light tokens;computed text checks including disabled controls       | Done in sampled states                                                       |
| 9 Primary task gets visual weight                  | Remaining figures,editor amount,laundry credit                           | Done                                                                         |
| 10 Group through spacing;reduce nested boxes       | Plan/editor/template panels;spacing scale                                | Done                                                                         |
| 11 Optical alignment                               | Lucide normalization;rendered screenshots                                | Done                                                                         |
| 12 Nested radius rule                              | Surface tokens and inner-panel/fieldset overrides                        | Done: nested surfaces and segmented controls derive inner radii from padding |
| 13 Semantic token system                           | Colours,type,motion,layers;layout geometry remains in CSS                | Done                                                                         |
| 14 One mint accent;semantic gold                   | Actions/selection/focus;currency/laundry;green chart palette             | Done                                                                         |
| 15 One dominant CTA;distinct destructive action    | Page/modal styles;confirmed deletion and sign-out                        | Done                                                                         |
| 16 Consistent icons/accessible names               | Lucide16/20/24,1.75stroke;existing aria labels                           | Done                                                                         |
| 17 No embellishments                               | No gradients/glows/illustrations;floating elevation only                 | Done                                                                         |
| 18 Async loading feedback                          | BusyButton,Skeleton,file reading,FX,sync,email                           | Done; browser controls disk download completion                              |
| 19 Empty/error/offline/success states              | Existing screens plus localized fallback diagnostics                     | Done                                                                         |
| 20 Useful motion/reduced motion                    | Transform bars,press,dialog/toast entry,optional native exit transitions | Done; browsers without View Transitions close immediately                    |

## Proposals

| ID  | Change                                           | Impact                                                    | Recommendation           | Status                                       |
| --- | ------------------------------------------------ | --------------------------------------------------------- | ------------------------ | -------------------------------------------- |
| P1  | Preserve settings drafts across pages            | UI lifecycle;no persisted format change                   | Keep                     | Approved and implemented,e2f8564             |
| P2  | Scope Overview summary to selected budget        | Presentation only;existing summary values                 | Keep                     | Approved and implemented,ce6b1ea             |
| P3  | Latest addition first and optional recorded time | HIGH IMPACT:metadata validation/comparator and CSV column | Keep;update both devices | Explicitly requested and implemented,f9e5d46 |

P3 compatibility/rollback is documented in PROPOSALS.md. Amounts,exchange conversion,allocation,credit-validation rules,storage keys,sync protocol and Supabase schema are unchanged. P1 preserves drafts across navigation, not across a browser reload; committed external changes still reset forms to the latest saved data.

## Step record

Every implementation commit passed tests and production build. Initial language work increased48tests to50; time/ordering coverage increased50to52. Commit history contains the ordered screen refinements and separate proposal commits. Review source with git diff ae629f2..HEAD. Screenshot fixtures are explicitly QA-only; compare docs/previews with the current files referenced in VERIFICATION.md.

## Remaining verification

No physical Android/iOS install,real offline SW navigation/update,live email delivery,live two-device sync or full assistive-technology certification. Localhost preview HTTP was blocked/timed out in this environment; Chrome QA served the built assets by same-origin interception with production CSP. No GitHub push or deployment was performed. Figma was not supplied a file/node destination; no external design file or new hosted Site was created.
