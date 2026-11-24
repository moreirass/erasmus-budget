import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Cloud, CloudUpload, X } from "lucide-react";
import { FavoriteButtons } from "./components/Favorites";
import { RecurringOverview } from "./components/Recurring";
import { AppLayout } from "./components/AppLayout";
import { LedgerDialogs } from "./components/LedgerDialogs";
import { LaundryQuickCard } from "./components/Laundry";
import { DataDialogs } from "./components/DataDialogs";
import { tr } from "./i18n";
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
import { AnalysisView, CardView } from "./views/PocketDetails";
import { OverviewView } from "./views/Overview";
import { TransactionsView } from "./views/Transactions";
import { SettingsView } from "./views/Settings";
import { PeriodControls, PeriodFilter } from "./components/PeriodControls";
const DesktopViews = lazy(() => import("./views/desktop/DesktopViews"));
const desktopQuery = "(min-width: 1024px)";
function subscribeDesktop(notify: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
const isDesktopViewport = () => window.matchMedia(desktopQuery).matches;

export default function App() {
  const isDesktop = useSyncExternalStore(subscribeDesktop, isDesktopViewport);
  const prefs = useAppPrefs();
  const { dark, setDark, view, setView } = prefs;
  const fx = useExchangeRates();
  const store = useBudget();
  const { data } = store;
  const [tab, setTab] = useState("Overview");
  const isSettings = tab === "Budget & settings";
  const settings = useSettings(data);
  const { toast, setToast } = useToast();
  const { online, needRefresh, updateServiceWorker } = useAppPlatform();
  const period = usePeriod(
    data,
    store.user?.id,
    tab === "Transactions" ? view : "month",
  );
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
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
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
    openNew,
    setEditor,
    setPendingDelete,
    setSearch,
    setFilter,
    setGroup,
  };
  const laundryCard = tab === "Overview" && (
    <LaundryQuickCard
      data={data}
      disabled={!store.ready || store.corrupt}
      record={ledger.quickLaundry}
      topUp={() => openNew("topup")}
      openCard={() => setTab("Card")}
    />
  );
  return (
    <AppLayout
      setTab={setTab}
      openNew={() => openNew()}
      canAdd={store.ready && !store.corrupt}
      tab={tab}
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
              {toast === "Laundry use saved" && ledger.laundryUndo && (
                <button className="toast-action" onClick={ledger.undoLaundry}>
                  {tr("Undo")}
                </button>
              )}
              {toast === "Insufficient credit" && (
                <button
                  className="toast-action"
                  onClick={() => {
                    setToast("");
                    openNew("topup");
                  }}
                >
                  {tr("Top up")}
                </button>
              )}
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
          {store.dirty ? (
            <CloudUpload size={15} aria-hidden="true" />
          ) : (
            <Cloud size={15} aria-hidden="true" />
          )}
          {store.dirty ? tr("Pending sync") : tr("No pending changes")}
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
      {(tab === "Overview" || tab === "Analysis") && (
        <PeriodControls {...period} compact />
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
      {isDesktop &&
      (tab === "Overview" || tab === "Analysis" || tab === "Transactions") ? (
        <Suspense fallback={null}>
          <DesktopViews
            {...viewProps}
            tab={tab}
            laundryCard={laundryCard}
            favorites={
              tab === "Overview" && (
                <FavoriteButtons
                  key={store.user?.id ?? "guest"}
                  data={data}
                  fx={fx}
                  save={commit}
                />
              )
            }
            monthControl={
              tab === "Transactions" && <PeriodControls {...period} />
            }
            periodFilter={
              tab === "Transactions" && (
                <PeriodFilter {...period} view={view} setView={setView} />
              )
            }
          />
        </Suspense>
      ) : (
        <>
          {tab === "Overview" && (
            <OverviewView
              {...viewProps}
              laundryCard={laundryCard}
              favorites={
                <FavoriteButtons
                  key={store.user?.id ?? "guest"}
                  data={data}
                  fx={fx}
                  save={commit}
                />
              }
            />
          )}
          {tab === "Analysis" && <AnalysisView {...viewProps} />}
          {tab === "Transactions" && (
            <TransactionsView
              {...viewProps}
              monthControl={<PeriodControls {...period} shortLabel />}
              periodFilter={
                <PeriodFilter {...period} view={view} setView={setView} />
              }
            />
          )}
        </>
      )}
      {tab === "Card" && <CardView {...viewProps} />}
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
