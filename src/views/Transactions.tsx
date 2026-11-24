import { Search, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Modal } from "../components/Primitives";
import { tr, trCount } from "../i18n";
import { categories } from "../model";
import { PocketHistory } from "./PocketDetails";
import type { ViewProps } from "./types";

export function TransactionsView({
  rows,
  group,
  filter,
  search,
  view,
  setGroup,
  setFilter,
  setSearch,
  setEditor,
  setPendingDelete,
  monthControl,
  periodFilter,
}: ViewProps & { monthControl: ReactNode; periodFilter: ReactNode }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters =
    Number(group !== "all") +
    Number(filter !== "all") +
    Number(view === "week");
  return (
    <div className="pocket-stack">
      <section
        className="pocket-panel pocket-filters"
        aria-label={tr("Search and filters")}
      >
        {monthControl}
        <label className="pocket-search">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label={tr("Search transactions")}
            placeholder={tr("Search transactions")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button
          className="pocket-filter-trigger"
          aria-haspopup="dialog"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={17} /> {tr("Filters")}
          {activeFilters > 0 && (
            <span className="pocket-filter-count">{activeFilters}</span>
          )}
        </button>
      </section>
      <section className="pocket-panel" aria-label={tr("History")}>
        <div className="pocket-section-head">
          <span className="muted">
            {trCount("{0} transactions", [rows.length])}
          </span>
        </div>
        <PocketHistory
          rows={rows}
          setEditor={setEditor}
          setPendingDelete={setPendingDelete}
        />
      </section>
      {filtersOpen && (
        <Modal title={tr("Filters")} close={() => setFiltersOpen(false)}>
          <div className="pocket-filter-fields">
            {periodFilter}
            <label className="field">
              <span>{tr("Group")}</span>
              <select
                value={group}
                onChange={(event) => {
                  setGroup(event.target.value);
                  setFilter("all");
                }}
              >
                <option value="all">{tr("All groups")}</option>
                <option value="daily">{tr("Day to day")}</option>
                <option value="travel">{tr("Travel")}</option>
              </select>
            </label>
            <label className="field">
              <span>{tr("Category")}</span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">{tr("All categories")}</option>
                {categories
                  .filter(
                    (category) =>
                      group === "all" ||
                      (group === "travel"
                        ? category.id === "travel"
                        : category.id !== "travel"),
                  )
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {tr(category.name)}
                    </option>
                  ))}
              </select>
            </label>
            <button className="primary" onClick={() => setFiltersOpen(false)}>
              {tr("Done")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
