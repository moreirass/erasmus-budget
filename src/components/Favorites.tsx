import { useState } from "react";
import {
  periodStart,
  monthEnd,
  favoriteTransaction,
  makeTransaction,
  money,
  today,
  type Data,
  type Favorite,
  type Transaction,
} from "../model";
import { tr } from "../i18n";
import type { useExchangeRates } from "../useExchangeRates";
import { TransactionForm } from "./TransactionEditor";
import { Modal, Field } from "./Primitives";
type Props = {
  data: Data;
  fx: ReturnType<typeof useExchangeRates>;
  save: (d: Data, message?: string) => boolean;
};
export function FavoriteManager({ data, fx, save }: Props) {
  const [editing, setEditing] = useState<Favorite | "new" | null>(null);
  return (
    <section className="panel">
      <h2>{tr("Favorites")}</h2>
      {(data.favorites ?? []).map((f) => (
        <div className="allocation-total" key={f.id}>
          <span>
            {f.name} · {money(f.amount, f.currency)}
          </span>
          <div className="button-pair">
            <button onClick={() => setEditing(f)}>{tr("Edit")}</button>
            <button
              onClick={() =>
                save({
                  ...data,
                  favorites: data.favorites?.filter((x) => x.id !== f.id),
                })
              }
            >
              {tr("Delete")}
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => setEditing("new")}>{tr("Add favorite")}</button>
      {editing && (
        <FavoriteEditor
          key={typeof editing === "string" ? editing : editing.id}
          data={data}
          fx={fx}
          save={save}
          favorite={editing === "new" ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
    </section>
  );
}
function FavoriteEditor({
  data,
  fx,
  save,
  favorite,
  close,
}: Props & { favorite?: Favorite; close: () => void }) {
  const [name, setName] = useState(favorite?.name ?? ""),
    [rate, setRate] = useState(
      favorite?.manualRate ? String(favorite.manualRate) : "",
    );
  const initial = favorite
    ? makeTransaction({
        id: favorite.id,
        date:
          today() < periodStart(data, data.settings.start)
            ? periodStart(data, data.settings.start)
            : today() > monthEnd(data.settings.end)
              ? monthEnd(data.settings.end)
              : today(),
        kind: "expense",
        category: favorite.category,
        amount: favorite.amount,
        currency: favorite.currency,
        rate: 1,
        note: favorite.name,
        travelType: favorite.travelType,
      })
    : undefined;
  return (
    <Modal title={tr("Favorites")} close={close}>
      <TransactionForm
        data={data}
        month={data.settings.start}
        initial={initial}
        initialKind="expense"
        fx={fx}
        ruleMode
        expenseOnly
        extraFields={
          <>
            <Field label={tr("Favorite name")}>
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label={tr("Fixed manual rate (optional)")}>
              <input
                type="number"
                min="0.000000000001"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </Field>
            <p className="help">
              {tr(
                "Favorites use today's date and their own currency. Leave the rate empty to use cached rates.",
              )}
            </p>
          </>
        }
        save={(t) => {
          const f: Favorite = {
            id: favorite?.id ?? crypto.randomUUID(),
            name: name.trim(),
            amount: t.amount,
            currency: t.currency,
            category: t.category,
            travelType: t.travelType,
            ...(rate ? { manualRate: Number(rate) } : {}),
          };
          if (
            save(
              {
                ...data,
                favorites: [
                  ...(data.favorites ?? []).filter((x) => x.id !== f.id),
                  f,
                ],
              },
              "Favorite saved",
            )
          )
            close();
        }}
      />
    </Modal>
  );
}
export function FavoriteButtons({ data, fx, save }: Props) {
  const [added, setAdded] = useState<Transaction | null>(null),
    [error, setError] = useState("");
  if (!data.favorites?.length && !added) return null;
  return (
    <section className="panel">
      <h2>{tr("Favorites")}</h2>
      <div className="export-buttons">
        {data.favorites?.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              try {
                const t = favoriteTransaction(f, data, fx.cache?.rates ?? {});
                if (!t) {
                  setError(
                    "No cached rate for this currency. Refresh online or choose a manual bank rate.",
                  );
                  return;
                }
                if (
                  save(
                    { ...data, transactions: [...data.transactions, t] },
                    "Favorite added",
                  )
                ) {
                  setAdded(t);
                  setError("");
                }
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {f.name} · {money(f.amount, f.currency)}
          </button>
        ))}
      </div>
      {error && <p role="status">{tr(error)}</p>}
      {added && (
        <div role="status">
          {tr("Favorite added")}{" "}
          <button
            onClick={() => {
              if (
                save(
                  {
                    ...data,
                    transactions: data.transactions.filter(
                      (t) => t.id !== added.id,
                    ),
                  },
                  "Automatic entries undone",
                )
              )
                setAdded(null);
            }}
          >
            {tr("Undo")}
          </button>
          <button onClick={() => setAdded(null)}>
            {tr("Dismiss notification")}
          </button>
        </div>
      )}
    </section>
  );
}
