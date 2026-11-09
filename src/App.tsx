import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BackupReminder } from "./components/BackupReminder";
import { FavoriteButtons } from "./components/Favorites";
import { RecurringOverview } from "./components/Recurring";
import { AppLayout } from "./components/AppLayout";
import { LedgerDialogs } from "./components/LedgerDialogs";
import { DataDialogs } from "./components/DataDialogs";
import { appLocale, tr } from "./i18n";
import { useBudget } from "./store";
import { download } from "./transfer";
import { useExchangeRates } from "./useExchangeRates";
import { useAppPrefs } from "./hooks/useAppPrefs";
import { useAppPlatform } from "./hooks/useAppPlatform";
import { usePeriod } from "./hooks/usePeriod";
import { useSettings } from "./hooks/useSettings";
import { useToast } from "./hooks/useToast";
import { useLedger } from "./hooks/useLedger";
import { useDataTransfer } from "./hooks/useDataTransfer";
import { OverviewView } from "./views/Overview";
import { TransactionsView } from "./views/Transactions";
import { SettingsView } from "./views/Settings";
import { PeriodControls } from "./components/PeriodControls";
export default function App() {
  const prefs = useAppPrefs();
  const { dark, setDark, view, setView } = prefs;
  const fx = useExchangeRates();
  const store = useBudget();
  const { data } = store;
  const [tab, setTab] = useState("Overview");
  const isSettings = tab === "Budget & settings" || tab === "Budget";
  const settings = useSettings(data);
  const { setSettingsSection } = settings;
  const { toast, setToast } = useToast();
  const { online, needRefresh, updateServiceWorker } = useAppPlatform();
  const period = usePeriod(data, store.user?.id, view);
  const {
    month,
    group,
    setGroup,
    monthList,
    weekList,
    range,
    stats,
    plan,
    isFuture,
    groupCash,
  } = period;
  const ledger = useLedger(store, setToast, stats, group);
  const {
    rows,
    search,
    filter,
    setSearch,
    setFilter,
    openNew,
    setEditor,
    setPendingDelete,
    commit,
  } = ledger;
  const transfer = useDataTransfer(store, setToast, () =>
    ledger.setRemoved(null),
  );
  const { exportJSON } = transfer;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
  function selectBudget(next: string) {
    setGroup((current) => (current === next ? "all" : next));
    setFilter("all");
  }
  const viewProps = {
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
  };
  return (
    <AppLayout
      data={data}
      stats={stats}
      fx={fx}
      setTab={setTab}
      setGroup={setGroup}
      setSettingsSection={setSettingsSection}
      openNew={openNew}
      store={store}
      tab={tab}
      isSettings={isSettings}
      online={online}
      dark={dark}
      setDark={setDark}
      overlays={
        <>
          <LedgerDialogs {...ledger} data={data} month={month} fx={fx} />
          <DataDialogs {...transfer} store={store} />
          {toast && (
            <div className="toast" role="status">
              {tr(toast)}
              <button
                onClick={() => setToast("")}
                aria-label={tr("Dismiss notification")}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </>
      }
    >
      {store.user && (
        <p className="help sync-summary" role="status">
          {store.dirty ? tr("Unsynced changes") : tr("No pending changes")} ·{" "}
          {store.lastSyncedAt
            ? tr("Last sync: {0}", [
                new Date(store.lastSyncedAt).toLocaleString(appLocale()),
              ])
            : tr("Not synced yet")}
        </p>
      )}
      {store.corrupt && (
        <div className="notice error">
          {tr("Saved data needs recovery.")}{" "}
          <button
            onClick={() =>
              download("pocket-recovery.txt", store.recovery(), "text/plain")
            }
          >
            {tr("Export recovery file")}{" "}
          </button>{" "}
          {tr("Then restore a JSON backup below.")}{" "}
        </div>
      )}
      {store.error && (
        <div role="alert" className="notice error">
          {tr(store.error)}
          <button
            onClick={() => store.setError("")}
            aria-label={tr("Dismiss error")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {needRefresh && (
        <div className="notice">
          {tr("An app update is ready. Save any open form first.")}{" "}
          <button onClick={() => updateServiceWorker(true)}>
            {tr("Reload & update")}{" "}
          </button>
        </div>
      )}
      {!isSettings && (
        <PeriodControls
          {...period}
          data={data}
          view={view}
          setView={setView}
          setFilter={setFilter}
        />
      )}
      <div hidden={tab !== "Overview"}>
        <RecurringOverview
          enabled={store.ready && !store.corrupt}
          key={store.user?.id ?? "guest"}
          data={data}
          save={commit}
          fx={fx}
        />
      </div>
      {tab === "Overview" && (
        <BackupReminder
          key={store.user?.id ?? "guest"}
          data={data}
          scope={store.user?.id ?? "guest"}
          save={commit}
          exportJSON={exportJSON}
        />
      )}
      {tab === "Overview" && (
        <>
          <FavoriteButtons
            key={store.user?.id ?? "guest"}
            data={data}
            fx={fx}
            save={commit}
          />
          <OverviewView {...viewProps} />
        </>
      )}
      {tab === "Transactions" && <TransactionsView {...viewProps} />}
      {isSettings && (
        <SettingsView
          {...viewProps}
          {...settings}
          {...transfer}
          store={store}
          commit={commit}
          monthList={monthList}
          online={online}
          language={prefs.language}
          setLanguage={prefs.setLanguage}
          setToast={setToast}
        />
      )}
    </AppLayout>
  );
}
