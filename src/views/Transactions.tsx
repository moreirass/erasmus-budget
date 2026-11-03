import { Download, RefreshCw, Search } from "lucide-react";
import {
  LaundryPanel,
  PeriodSummary,
  SpendingChart,
  TransactionList,
} from "../components/Panels";
import { categories, today, type Category } from "../model";
import { download, toCSV } from "../transfer";
import type { ViewProps } from "./types";
export function TransactionsView({
  data,
  month,
  view,
  range,
  group,
  stats,
  plan,
  weekList,
  rows,
  isFuture,
  fx,
  search,
  filter,
  setTab,
  setSettingsSection,
  selectBudget,
  groupCash,
  openNew,
  setEditor,
  setPendingDelete,
  setSearch,
  setFilter,
  setGroup,
}: ViewProps) {
  return (
    <>
      <PeriodSummary
        stats={stats}
        plan={plan}
        month={month}
        range={range}
        group={group}
        selectGroup={(value) => {
          setGroup(value);
          setFilter("all");
        }}
      />
      <section className="transactions-layout">
        <div className="transaction-stream">
          <div className="transaction-tools">
            <label className="search">
              <Search size={19} />
              <input
                aria-label="Search transactions"
                placeholder="Pesquisar notas, cafés, comboios…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter category"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="secondary export-csv"
              onClick={() =>
                download(
                  `pocket-transactions-${today()}.csv`,
                  toCSV(data),
                  "text/csv;charset=utf-8",
                )
              }
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="ledger-heading">
            <span>HISTÓRICO DE TRANSAÇÕES</span>
            <span>{rows.length} movimentos</span>
          </div>
          <TransactionList
            rows={rows}
            edit={setEditor}
            remove={setPendingDelete}
            add={() => openNew()}
          />
        </div>
        <aside className="ledger-aside">
          <LaundryPanel stats={stats} openNew={openNew} />
          <div className="panel">
            <h2>Spending mix</h2>
            <SpendingChart
              spent={
                Object.fromEntries(
                  categories.map((c) => [
                    c.id,
                    group === "all" ||
                    (group === "travel" ? c.id === "travel" : c.id !== "travel")
                      ? stats.spent[c.id]
                      : 0,
                  ]),
                ) as Record<Category, number>
              }
            />
          </div>
          <div className="panel fx-detail">
            <h2>
              <RefreshCw size={18} /> EUR / CZK
            </h2>
            <strong>
              {fx.cache?.rates.CZK
                ? `1 EUR ≈ ${fx.cache.rates.CZK.rate.toFixed(2)} CZK`
                : "Sem taxa disponível"}
            </strong>
            <p>
              {fx.cache?.rates.CZK
                ? `Referência publicada em ${fx.cache.rates.CZK.date}. Cada movimento guarda a taxa utilizada.`
                : "Atualiza as taxas nas definições ou introduz a taxa do banco."}
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
