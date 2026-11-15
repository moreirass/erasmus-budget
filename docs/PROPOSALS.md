# Audit and proposals — UI/language refinement

Base: ae629f2. Branch: codex/pocket-ui-language.

## Audit
- Language selector already exists in Settings/Account; i18n.ts defaults to English rather than device language. There is one PT dictionary but no independently checked EN catalog.
- AppLayout.tsx still includes decorative Erasmus badges, an ornamental term label and generic introductory copy.
- style.css contains historical gradients, shadows, raw dimensions, inconsistent icon sizes and disabled opacity that weakens contrast. Tokens lack type, motion and layering scales.
- Overview/ledger repeat descriptive labels; percentages, saved rates and some dates bypass locale formatting. Amount wrapping needs explicit protection.
- Transfer actions have no in-progress feedback. Runtime/provider errors can fall through untranslated. These can be addressed in the presentation layer without changing formats or sync.
- Settings forms are preserved between settings tabs, but unmount when leaving the screen. Global Overview totals remain global when a single budget is selected.

## P1 — Preserve settings drafts across page navigation
Problem: Settings.tsx unmounts when moving to Overview/Transactions, losing unsaved plan/tracking fields.
Proposal: keep the screen mounted or retain drafts in its existing hook.
Benefit: navigation does not silently discard a draft.
Affects: navigation/form behaviour and tests; bilingual discard/restore copy if required. No accounting, storage key, backup, sync or schema change.
Risk: medium (stale drafts after external data updates). Effort: M.
Alternatives: do nothing; warn before leaving instead.
Recommendation: approve separately after the visual work. Status: APPROVED by the user. Implementation scheduled after visual polish.

## P2 — Scope the Overview summary to the selected budget
Problem: Overview.tsx global spending/support/remainder metrics stay global while category charts filter to Day to day or Travel.
Proposal: filter all three summary figures to the chosen budget, while Both retains current totals.
Benefit: the headline summary matches the selected context.
Affects: presentation/grouping, UI tests and translated labels only; uses existing summary values. No model/accounting/storage/backup/sync/schema change.
Risk: medium (changes interpretation of the headline figures). Effort: S.
Alternatives: do nothing; retain global values and explicitly label them as totals for both budgets.
Recommendation: approve separately; for now retain values and clarify the global scope in copy. Status: APPROVED by the user. Implementation scheduled after visual polish.

Only reply with IDs to approve these, e.g. approve P1; reject P2. Visual styling and the expressly requested language support continue independently. No HIGH IMPACT proposal is needed.
