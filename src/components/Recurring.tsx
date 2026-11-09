import { useEffect, useState } from "react";
import {
  dueOccurrences,
  generateRecurring,
  occurrenceTransaction,
  settleOccurrence,
  makeTransaction,
  money,
  today,
  type Data,
  type Transaction,
  type RecurringRule,
  type Occurrence,
} from "../model";
import { tr } from "../i18n";
import type { useExchangeRates } from "../useExchangeRates";
import { TransactionForm } from "./TransactionEditor";
import { Field, Modal } from "./Primitives";
type Props = {
  enabled?: boolean;
  data: Data;
  save: (d: Data, message?: string) => boolean;
  fx: ReturnType<typeof useExchangeRates>;
};
export function RecurringManager({ data, save, fx }: Props) {
  const [editing, setEditing] = useState<RecurringRule | "new" | null>(null);
  return (
    <section className="panel">
      <h2>{tr("Recurring transactions")}</h2>
      <p className="help">
        {tr(
          "Rules run when you open or resume the app. Missing exchange rates require confirmation.",
        )}
      </p>
      {(data.recurring ?? []).map((r) => (
        <div className="allocation-total" key={r.id}>
          <span>
            {r.note || tr("Recurring transactions")} ·{" "}
            {money(r.amount, r.currency)} ·{" "}
            {tr(r.frequency === "monthly" ? "Monthly" : "Weekly")}
          </span>
          <div className="button-pair">
            <button onClick={() => setEditing(r)}>{tr("Edit")}</button>
            <button
              onClick={() =>
                save({
                  ...data,
                  recurring: data.recurring?.filter((x) => x.id !== r.id),
                })
              }
            >
              {tr("Delete")}
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => setEditing("new")}>
        {tr("Add recurring rule")}
      </button>
      {editing && (
        <RuleEditor
          key={typeof editing === "string" ? editing : editing.id}
          data={data}
          fx={fx}
          rule={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
          save={save}
        />
      )}
    </section>
  );
}
function RuleEditor({
  data,
  fx,
  rule,
  close,
  save,
}: Props & { rule?: RecurringRule; close: () => void }) {
  const [frequency, setFrequency] = useState(rule?.frequency ?? "monthly");
  const [day, setDay] = useState(rule?.day ?? 1);
  const [end, setEnd] = useState(rule?.end ?? "");
  const [mode, setMode] = useState(rule?.mode ?? "confirm");
  const [manual, setManual] = useState(
    rule?.manualRate ? String(rule.manualRate) : "",
  );
  const initial = rule
    ? makeTransaction({
        id: rule.id,
        date: rule.start,
        kind: rule.kind,
        category: rule.category,
        amount: rule.amount,
        currency: rule.currency,
        rate: rule.manualRate ?? 1,
        note: rule.note,
        travelType: rule.travelType,
      })
    : undefined;
  return (
    <Modal title={tr("Recurring transactions")} close={close}>
      <TransactionForm
        data={data}
        month={today().slice(0, 7)}
        initial={initial}
        initialKind="expense"
        fx={fx}
        ruleMode
        extraFields={
          <fieldset>
            <legend>{tr("Schedule")}</legend>
            <Field label={tr("Frequency")}>
              <select
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value as typeof frequency);
                  setDay(1);
                }}
              >
                <option value="monthly">{tr("Monthly")}</option>
                <option value="weekly">{tr("Weekly")}</option>
              </select>
            </Field>
            <Field
              label={tr(
                frequency === "monthly"
                  ? "Day of month"
                  : "Day of week (0 Sunday, 6 Saturday)",
              )}
            >
              <input
                type="number"
                required
                min={frequency === "monthly" ? 1 : 0}
                max={frequency === "monthly" ? 31 : 6}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              />
            </Field>
            <p className="help">
              {tr(
                "The transaction date is the rule start date. Day 31 uses the last day in shorter months.",
              )}
            </p>
            <Field label={tr("End date (optional)")}>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
            <Field label={tr("Generation mode")}>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
              >
                <option value="confirm">{tr("Ask for confirmation")}</option>
                <option value="auto">{tr("Add automatically")}</option>
              </select>
            </Field>
            <Field label={tr("Fixed manual rate (optional)")}>
              <input
                type="number"
                min="0.000000000001"
                max="1000000000000"
                step="any"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
            </Field>
            <p className="help">
              {tr(
                "Leave empty to use cached rates or the manual CZK fallback at generation time.",
              )}
            </p>
          </fieldset>
        }
        save={(t) => {
          const r: RecurringRule = {
            id: rule?.id ?? crypto.randomUUID(),
            kind: t.kind as RecurringRule["kind"],
            category: t.category,
            amount: t.amount,
            currency: t.currency,
            note: t.note,
            travelType: t.travelType,
            start: t.date,
            ...(end ? { end } : {}),
            frequency,
            day,
            mode,
            ...(manual ? { manualRate: Number(manual) } : {}),
            generated: rule?.generated ?? [],
            ignored: rule?.ignored ?? [],
          };
          if (
            save(
              {
                ...data,
                recurring: [
                  ...(data.recurring ?? []).filter((x) => x.id !== r.id),
                  r,
                ],
              },
              "Recurring rule saved",
            )
          )
            close();
        }}
      />
    </Modal>
  );
}
export function RecurringOverview({ data, save, fx, enabled = true }: Props) {
  const [wake, setWake] = useState(0),
    [editing, setEditing] = useState<Occurrence | null>(null),
    [undo, setUndo] = useState<Transaction[]>([]);
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== "hidden") setWake((x) => x + 1);
    };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    const timer = setInterval(resume, 60000);
    return () => {
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const result = generateRecurring(data, fx.cache?.rates ?? {});
    if (
      result.added.length &&
      save(result.data, "Recurring transactions added")
    )
      setUndo(result.added);
  }, [data, fx.cache, wake, enabled]);
  const pending = dueOccurrences(data);
  const draft = editing
    ? (occurrenceTransaction(editing, data, fx.cache?.rates ?? {}) ?? {
        ...makeTransaction({
          id: editing.id,
          date: editing.date,
          kind: editing.rule.kind,
          category: editing.rule.category,
          amount: editing.rule.amount,
          currency: editing.rule.currency,
          rate: 1,
          note: editing.rule.note,
          travelType: editing.rule.travelType,
        }),
        rate: 0,
      })
    : undefined;
  return (
    <>
      {!!undo.length && (
        <div className="notice" role="status">
          {tr("Recurring transactions added")}{" "}
          <button
            onClick={() => {
              if (
                save(
                  {
                    ...data,
                    transactions: data.transactions.filter(
                      (t) => !undo.some((x) => x.id === t.id),
                    ),
                  },
                  "Automatic entries undone",
                )
              )
                setUndo([]);
            }}
          >
            {tr("Undo")}
          </button>
          <button onClick={() => setUndo([])}>
            {tr("Dismiss notification")}
          </button>
        </div>
      )}
      {!!pending.length && (
        <section className="panel">
          <h2>{tr("Pending recurring transactions")}</h2>
          {pending.map((o) => (
            <div className="allocation-total" key={o.id}>
              <span>
                {o.date} · {o.rule.note} ·{" "}
                {money(o.rule.amount, o.rule.currency)}
                {!occurrenceTransaction(o, data, fx.cache?.rates ?? {}) && (
                  <small>{tr("No cached rate")}</small>
                )}
              </span>
              <div className="button-pair">
                <button onClick={() => setEditing(o)}>
                  {tr("Confirm / edit")}
                </button>
                <button
                  onClick={() =>
                    save(settleOccurrence(data, o), "Occurrence ignored")
                  }
                >
                  {tr("Ignore")}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {editing && draft && (
        <Modal title={tr("Confirm / edit")} close={() => setEditing(null)}>
          <TransactionForm
            data={data}
            month={editing.date.slice(0, 7)}
            initial={draft}
            initialKind={draft.kind}
            fx={fx}
            save={(t) => {
              if (save(settleOccurrence(data, editing, t), "Transaction saved"))
                setEditing(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
