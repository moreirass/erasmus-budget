import {
  ArrowLeftRight,
  CalendarDays,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  Plus,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Sun,
  Upload,
  UserRound,
  Wallet,
  WashingMachine,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  BudgetForm,
  ExchangePanel,
  LaundryPanel,
  SettingsForm,
  TransactionList,
} from "./components/Panels";
import { Field, Modal } from "./components/Primitives";
import { TransactionForm } from "./components/TransactionEditor";
import {
  currentPeriod,
  globalPlan,
  money,
  monthEnd,
  monthLabel,
  months,
  planFor,
  summary,
  today,
  transactionOrder,
  validateData,
  weeks,
  type Data,
  type Transaction,
} from "./model";
import { cloud, useBudget } from "./store";
import { download, importCSV, toCSV } from "./transfer";
import { useExchangeRates } from "./useExchangeRates";
import { OverviewView } from "./views/Overview";
import { TransactionsView } from "./views/Transactions";
const toCents = (s: FormDataEntryValue | null) => Math.round(Number(s) * 100);
export default function App() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("pocket-theme");
      return saved ? saved === "dark" : true;
    } catch {
      return true;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#00170f" : "#eaf5ee");
    try {
      localStorage.setItem("pocket-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  const fx = useExchangeRates();
  const store = useBudget(),
    { data, update } = store;
  const [tab, setTab] = useState("Overview"),
    [month, setMonth] = useState(() => currentPeriod(data).month),
    [view, setView] = useState(() => {
      try {
        return localStorage.getItem("pocket-view") === "week"
          ? "week"
          : "month";
      } catch {
        return "month";
      }
    }),
    [week, setWeek] = useState(() => currentPeriod(data).week);
  const [group, setGroup] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null),
    [removed, setRemoved] = useState<Transaction | null>(null);
  const [settingsSection, setSettingsSection] = useState("plan");
  const isSettings = tab === "Budget & settings" || tab === "Budget";
  const [editor, setEditor] = useState<Transaction | "new" | null>(null),
    [editorKind, setEditorKind] = useState<Transaction["kind"]>("expense"),
    [toast, setToast] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [pendingImport, setPendingImport] = useState<{
      data: Data;
      type: string;
    } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null),
    [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    // Pending actions belong to the workspace in which they were started.
    setRemoved(null);
    setPendingDelete(null);
    setPendingImport(null);
    setEditor(null);
  }, [store.user?.id]);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const reset = () => {
      if (document.visibilityState === "hidden") return;
      const p = currentPeriod(data);
      setMonth(p.month);
      setWeek(p.week);
    };
    reset();
    let date = today();
    const timer = setInterval(() => {
      if (today() !== date) {
        date = today();
        reset();
      }
    }, 30000);
    window.addEventListener("pageshow", reset);
    window.addEventListener("focus", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("focus", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [
    data.settings.start,
    data.settings.end,
    data.settings.firstDay,
    store.user?.id,
  ]);
  useEffect(() => {
    try {
      localStorage.setItem("pocket-view", view);
    } catch {}
  }, [view]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);
  const monthList = months(data.settings.start, data.settings.end),
    weekList = weeks(month, data),
    range =
      view === "week"
        ? weekList[Math.min(week, weekList.length - 1)]
        : undefined;
  const stats = summary(data, month, range),
    plan = planFor(data, month),
    isFuture = month > today().slice(0, 7);
  function selectBudget(next: string) {
    setGroup((current) => (current === next ? "all" : next));
    setFilter("all");
  }
  const groupCash = (s: ReturnType<typeof summary>) =>
    group === "travel"
      ? s.spent.travel
      : group === "daily"
        ? s.cash - s.spent.travel
        : s.cash;
  function commit(d: Data, message = "Saved") {
    try {
      update(d);
      setToast(message);
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    }
  }
  function openNew(kind: Transaction["kind"] = "expense") {
    setEditorKind(kind);
    setEditor("new");
  }
  function changeMonth(m: string) {
    setMonth(m);
    const p = currentPeriod(data);
    setWeek(m === p.month ? p.week : 0);
  }
  async function readFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10000000)
        throw new Error("Please choose a file smaller than 10 MB.");
      const text = await file.text();
      const csv = file.name.toLowerCase().endsWith(".csv");
      const next = csv ? importCSV(text, data) : validateData(JSON.parse(text));
      setPendingImport({
        data: next,
        type: csv ? "Merge CSV transactions" : "Restore full JSON backup",
      });
    } catch (e) {
      setToast((e as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  const rows = stats.rows
    .filter(
      (t) =>
        (group === "all" ||
          (group === "travel"
            ? t.category === "travel"
            : t.category !== "travel")) &&
        (filter === "all" || t.category === filter) &&
        `${t.note} ${t.category} ${t.kind}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(transactionOrder);
  const exportJSON = () =>
    download(`pocket-${today()}.json`, JSON.stringify(data, null, 2));
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
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("Overview");
          }}
        >
          <span className="brand-icon">
            <Wallet size={24} />
          </span>
          <span>
            Pocket<small>Your Erasmus Companion</small>
          </span>
        </a>
        <div className="active-term">
          <MapPin size={17} />
          <div>
            <span>ACTIVE TERM</span>
            <strong>
              Erasmus · {data.settings.start.slice(0, 4)}/
              {data.settings.end.slice(2, 4)}
            </strong>
          </div>
        </div>
        <nav>
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Transactions", icon: ArrowLeftRight },
            { name: "Budget & settings", icon: SlidersHorizontal },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={
                tab === name || (name === "Budget & settings" && isSettings)
                  ? "active"
                  : ""
              }
              onClick={() => setTab(name)}
            >
              <Icon size={20} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <button
          className="sidebar-laundry"
          onClick={() => {
            setTab("Overview");
            setGroup("daily");
          }}
        >
          <WashingMachine size={20} />
          <span>
            Lavandaria<strong>{money(stats.card, "CZK")}</strong>
          </span>
          <ChevronRight size={16} />
        </button>
        <div className="storage-badge">
          <MapPin size={14} />
          <span>Ostrava, Czechia</span>
          <span className={online ? "status-dot" : "status-dot offline"} />
          <small>{store.user?.email ?? "Guardado neste dispositivo"}</small>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          className={tab === "Overview" ? "active" : ""}
          onClick={() => setTab("Overview")}
        >
          <LayoutDashboard size={21} />
          <span>Overview</span>
        </button>
        <button
          className={tab === "Transactions" ? "active" : ""}
          onClick={() => setTab("Transactions")}
        >
          <ArrowLeftRight size={21} />
          <span>Transactions</span>
        </button>
        <button
          className="quick-add"
          aria-label="Add transaction"
          onClick={() => openNew()}
          disabled={!store.ready || store.corrupt}
        >
          <Plus size={29} />
        </button>
        <button
          className={tab === "Budget" ? "active" : ""}
          onClick={() => {
            setTab("Budget");
            setSettingsSection("plan");
          }}
        >
          <ChartPie size={21} />
          <span>Budget</span>
        </button>
        <button
          className={tab === "Budget & settings" ? "active" : ""}
          onClick={() => {
            setTab("Budget & settings");
            setSettingsSection("rates");
          }}
        >
          <Settings size={21} />
          <span>Settings</span>
        </button>
      </nav>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <span className="desktop-crumb">
              <LayoutDashboard size={15} /> / Erasmus Hub / <b>{tab}</b>
            </span>
            <span className="mobile-brand">
              <span className="brand-icon">
                <Wallet size={22} />
              </span>
              <span>
                Pocket <em>Erasmus+</em>
                <small>ERASMUS · OSTRAVA</small>
              </span>
            </span>
          </div>
          <div className="header-actions">
            <span
              className="fx-pill"
              title={
                fx.cache?.rates.CZK
                  ? `Publicado em ${fx.cache.rates.CZK.date}`
                  : "Sem taxa em cache"
              }
            >
              <RefreshCw size={16} />{" "}
              {fx.cache?.rates.CZK ? (
                <>
                  <span>1 EUR ≈ </span>
                  <strong>{fx.cache.rates.CZK.rate.toFixed(2)} CZK</strong>
                </>
              ) : (
                <strong>EUR / CZK</strong>
              )}
            </span>
            <button
              className="sync-pill"
              onClick={() => {
                setTab("Budget & settings");
                setSettingsSection("sync");
              }}
            >
              <span
                className={
                  store.user &&
                  !store.dirty &&
                  store.status === "Synced just now"
                    ? "status-dot"
                    : "status-dot offline"
                }
              />
              {!online
                ? "Offline"
                : !store.user
                  ? "Local workspace"
                  : store.dirty
                    ? "Sync pending"
                    : store.status}
            </button>
            <button
              className="icon-button theme-toggle"
              aria-label={
                dark ? "Switch to light theme" : "Switch to dark theme"
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="primary top-add"
              onClick={() => openNew()}
              disabled={!store.ready || store.corrupt}
            >
              <Plus size={18} /> Add transaction
            </button>
            <button
              className="avatar"
              aria-label="Account settings"
              onClick={() => {
                setTab("Budget & settings");
                setSettingsSection("sync");
              }}
            >
              <UserRound size={19} />
            </button>
          </div>
        </header>
        <div
          className={`content screen-${tab === "Transactions" ? "transactions" : isSettings ? "settings" : "overview"}`}
        >
          <div className="page-heading">
            <div>
              <div className="eyebrow">ERASMUS · OSTRAVA 2026/27</div>
              <h1>
                {tab === "Overview"
                  ? "Your adventure, in balance."
                  : tab === "Transactions"
                    ? "The little things add up."
                    : "A plan that fits your life."}
              </h1>
              <p>
                {tab === "Overview"
                  ? "A clear view of your money. More headspace for Erasmus."
                  : tab === "Transactions"
                    ? "Every coffee, train ride and laundry day, in one place."
                    : "Your monthly budgets, laundry credit and data — all in your hands."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() => openNew()}
              disabled={!store.ready || store.corrupt}
            >
              <Plus size={18} /> Add transaction
            </button>
          </div>
          {store.corrupt && (
            <div className="notice error">
              Saved data needs recovery.{" "}
              <button
                onClick={() =>
                  download(
                    "pocket-recovery.txt",
                    store.recovery(),
                    "text/plain",
                  )
                }
              >
                Export recovery file
              </button>{" "}
              Then restore a JSON backup below.
            </div>
          )}
          {store.error && (
            <div role="alert" className="notice error">
              {store.error}
              <button
                onClick={() => store.setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {needRefresh && (
            <div className="notice">
              An app update is ready. Save any open form first.{" "}
              <button onClick={() => updateServiceWorker(true)}>
                Reload & update
              </button>
            </div>
          )}
          {!isSettings && (
            <div className="period-bar">
              <div className="month-picker">
                <button
                  className="icon-button"
                  aria-label="Previous month"
                  disabled={month === monthList[0]}
                  onClick={() =>
                    changeMonth(monthList[monthList.indexOf(month) - 1])
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <select
                  aria-label="Selected month"
                  value={month}
                  onChange={(e) => changeMonth(e.target.value)}
                >
                  {monthList.map((m) => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  aria-label="Next month"
                  disabled={month === monthList.at(-1)}
                  onClick={() =>
                    changeMonth(monthList[monthList.indexOf(month) + 1])
                  }
                >
                  <ChevronRight size={18} />
                </button>
                {isFuture && <span className="pill">Plan preview</span>}
              </div>
              <div className="period-right">
                <select
                  aria-label="Budget group"
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setFilter("all");
                  }}
                >
                  <option value="all">Both budgets</option>
                  <option value="daily">Day to day</option>
                  <option value="travel">Travel & tourism</option>
                </select>
                {view === "week" && (
                  <select
                    aria-label="Selected week"
                    value={Math.min(week, weekList.length - 1)}
                    onChange={(e) => setWeek(Number(e.target.value))}
                  >
                    {weekList.map((w, i) => (
                      <option key={w.start} value={i}>
                        {w.start.slice(8)}–{w.end.slice(8)}{" "}
                        {new Date(month + "-15").toLocaleDateString("en", {
                          month: "short",
                        })}
                      </option>
                    ))}
                  </select>
                )}
                <div className="segmented">
                  <button
                    className={view === "month" ? "selected" : ""}
                    onClick={() => setView("month")}
                  >
                    Month
                  </button>
                  <button
                    className={view === "week" ? "selected" : ""}
                    onClick={() => {
                      setView("week");
                      const p = currentPeriod(data);
                      if (month === p.month) setWeek(p.week);
                    }}
                  >
                    Week
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === "Overview" && <OverviewView {...viewProps} />}
          {tab === "Transactions" && <TransactionsView {...viewProps} />}
          {isSettings && (
            <>
              <div className="settings-tabs">
                <button
                  className={settingsSection === "plan" ? "selected" : ""}
                  onClick={() => setSettingsSection("plan")}
                >
                  <Wallet size={18} /> Plano
                </button>
                <button
                  className={settingsSection === "rates" ? "selected" : ""}
                  onClick={() => setSettingsSection("rates")}
                >
                  <RefreshCw size={18} /> Câmbio
                </button>
                <button
                  className={settingsSection === "tracking" ? "selected" : ""}
                  onClick={() => setSettingsSection("tracking")}
                >
                  <WashingMachine size={18} /> Cartão
                </button>
                <button
                  className={settingsSection === "data" ? "selected" : ""}
                  onClick={() => setSettingsSection("data")}
                >
                  <Download size={18} /> Dados
                </button>
                <button
                  className={settingsSection === "sync" ? "selected" : ""}
                  onClick={() => setSettingsSection("sync")}
                >
                  <Cloud size={18} /> Conta
                </button>
              </div>
              <div className={`settings-grid section-${settingsSection}`}>
                <div className="panel plan-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Your monthly plan</h2>
                      <p>
                        One plan for all months, including past months. The
                        first month follows your configured start day.
                        Day-to-day and travel limits restart every month.
                      </p>
                    </div>
                  </div>
                  <BudgetForm
                    key={JSON.stringify(globalPlan(data))}
                    data={data}
                    save={(d) => commit(d, "Monthly plan saved for all months")}
                  />
                  <p className="help">
                    Day to day and travel are independent budgets. Only laundry
                    card credit rolls over. Weekly guides are prorated to the
                    days in the month.
                  </p>
                  <div className="semester-plan">
                    <h3>
                      <CalendarDays size={17} /> Semester trajectory
                    </h3>
                    <div>
                      {monthList.map((m) => (
                        <span
                          key={m}
                          className={m === today().slice(0, 7) ? "current" : ""}
                        >
                          <small>{monthLabel(m)}</small>
                          <b>{money(planFor(data, m).budget)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="right-stack">
                  <div className="panel rates-panel">
                    <ExchangePanel fx={fx} />
                  </div>
                  <div className="panel tracking-panel">
                    <h2>Tracking & opening balances</h2>
                    <p className="help">
                      Only enter laundry credit you actually have. It is not a
                      new expense. Previous travel and emergency reserves are
                      retained in backups and no longer increase your monthly
                      budgets.
                    </p>
                    <LaundryPanel stats={stats} openNew={openNew} />
                    <SettingsForm
                      key={JSON.stringify(data.settings)}
                      data={data}
                      save={(d) => commit(d, "Settings saved")}
                    />
                    <div className="laundry-history">
                      <h3>
                        <WashingMachine size={18} /> Histórico do cartão
                      </h3>
                      <p className="help">
                        Até {range?.end ?? monthEnd(month)} · apenas
                        carregamentos e consumo do cartão.
                      </p>
                      <TransactionList
                        rows={data.transactions.filter(
                          (t) =>
                            (t.kind === "topup" || t.kind === "wash") &&
                            t.date <= (range?.end ?? monthEnd(month)),
                        )}
                        edit={setEditor}
                        remove={setPendingDelete}
                        add={() => openNew("topup")}
                      />
                    </div>
                  </div>
                  <div className="panel data-panel">
                    <h2>Your data, your way</h2>
                    <p className="help">
                      JSON e CSV são exportados em texto simples, sem
                      encriptação. Guarda-os num local privado. CSV funde
                      transações por ID. Imports are validated before any
                      changes.
                    </p>
                    <div className="export-buttons">
                      <button onClick={exportJSON}>
                        <Download size={16} /> Full JSON backup
                      </button>
                      <button
                        onClick={() =>
                          download(
                            `pocket-transactions-${today()}.csv`,
                            toCSV(data),
                            "text/csv;charset=utf-8",
                          )
                        }
                      >
                        <Download size={16} /> Transactions CSV
                      </button>
                      <button onClick={() => fileRef.current?.click()}>
                        <Upload size={16} /> Import JSON / CSV
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileRef}
                      hidden
                      onChange={(e) => readFile(e.target.files?.[0])}
                    />
                    <p className="help">
                      Local data stays in this browser. Export a backup before
                      clearing browser data or moving devices.
                    </p>
                  </div>
                  <div className="panel sync-panel">
                    <h2>
                      <Cloud size={20} /> Account & sync
                    </h2>
                    {!cloud ? (
                      <>
                        <p className="help">
                          Local mode is ready to use. Add your Supabase project
                          URL and publishable key to enable sign-in and sync.
                          Setup instructions are in README.md.
                        </p>
                        <span className="pill">No account required</span>
                      </>
                    ) : store.user ? (
                      <>
                        <p className="help">
                          Signed in as {store.user.email}. Account data is
                          separate from the local workspace. To transfer local
                          records, export there and import here.
                        </p>
                        <p className="sync-status">{store.status}</p>
                        <div className="button-pair">
                          <button
                            onClick={() => store.sync()}
                            disabled={store.busy || !online}
                          >
                            <RefreshCw
                              size={16}
                              className={store.busy ? "spin" : ""}
                            />{" "}
                            Sync now
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                store.dirty &&
                                !confirm(
                                  "Unsynced changes stay on this device. Sign out anyway?",
                                )
                              )
                                return;
                              const result = await cloud!.auth.signOut();
                              if (result.error) setToast(result.error.message);
                            }}
                          >
                            <LogOut size={16} /> Sign out
                          </button>
                        </div>
                        <p className="help">
                          Press Sync on each device before and after editing.
                          Offline changes stay local until synced. If both
                          versions changed, you choose which to keep.
                        </p>
                      </>
                    ) : (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const email = String(
                            new FormData(e.currentTarget).get("email"),
                          );
                          const { error } = await cloud!.auth.signInWithOtp({
                            email,
                            options: { emailRedirectTo: location.origin },
                          });
                          setToast(
                            error?.message ??
                              "Check your email for a sign-in link.",
                          );
                        }}
                      >
                        <Field label="Email address">
                          <input
                            type="email"
                            name="email"
                            required
                            placeholder="you@example.com"
                          />
                        </Field>
                        <button className="primary" type="submit">
                          Send sign-in link
                        </button>
                        <p className="help">
                          Signing in opens a separate account workspace. Your
                          local records stay on this device.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          <footer>
            <span>
              pocket.{" "}
              <span className="muted">Made for your Ostrava chapter.</span>
            </span>
            <span className="muted">
              EUR budget · multiple currencies · CZK laundry card
            </span>
          </footer>
        </div>
      </main>
      {editor && (
        <Modal
          title={editor === "new" ? "Novo movimento" : "Editar movimento"}
          close={() => setEditor(null)}
        >
          <TransactionForm
            data={data}
            month={month}
            initial={editor === "new" ? undefined : editor}
            initialKind={editorKind}
            fx={fx}
            save={(t) => {
              if (
                commit(
                  {
                    ...data,
                    transactions: [
                      ...data.transactions.filter((x) => x.id !== t.id),
                      t,
                    ],
                  },
                  "Transaction saved",
                )
              )
                setEditor(null);
            }}
          />
        </Modal>
      )}
      {pendingImport && (
        <Modal title={pendingImport.type} close={() => setPendingImport(null)}>
          <p>
            {pendingImport.data.transactions.length} transactions in the
            resulting workspace.
          </p>
          <p className="help">
            JSON replaces the full workspace, including plans and balances. CSV
            keeps current settings and merges transactions. Download a backup
            first if you want to preserve the current version.
          </p>
          <div className="button-pair">
            <button onClick={exportJSON}>
              <Download size={16} /> Back up current
            </button>
            <button
              className="primary"
              onClick={() => {
                try {
                  store.restore(pendingImport.data);
                  setRemoved(null);
                  setPendingImport(null);
                  setToast("Import complete · saved locally");
                } catch (e) {
                  setToast((e as Error).message);
                }
              }}
            >
              Confirm import
            </button>
          </div>
        </Modal>
      )}
      {store.conflict && (
        <Modal
          title="Two versions need your choice"
          close={() => store.resolveConflict("local")}
        >
          <div className="conflict-banner">
            <Cloud size={23} />
            <div>
              <span className="tiny">ATENÇÃO NECESSÁRIA</span>
              <h3>Conflito de sincronização</h3>
              <p>
                O documento foi alterado neste dispositivo e na nuvem. Escolhe a
                versão a manter.
              </p>
            </div>
          </div>
          <p className="help">
            Local: {data.transactions.length} records. Cloud:{" "}
            {store.conflict.data.transactions.length} records. Both versions are
            retained in a local recovery snapshot. Export both if you need to
            combine them manually.
          </p>
          <div className="export-buttons">
            <button onClick={exportJSON}>Export local JSON</button>
            <button
              onClick={() =>
                download(
                  "pocket-cloud-conflict.json",
                  JSON.stringify(store.conflict?.data, null, 2),
                )
              }
            >
              Export cloud JSON
            </button>
          </div>
          <div className="button-pair">
            <button onClick={() => store.resolveConflict("remote")}>
              <Cloud size={18} /> Use cloud version{" "}
              <small>
                {store.conflict.data.transactions.length} movimentos
              </small>
            </button>
            <button
              className="primary"
              onClick={() => store.resolveConflict("local")}
            >
              <Wallet size={18} /> Keep local version{" "}
              <small>
                {data.transactions.length} movimentos · sincronizar depois
              </small>
            </button>
          </div>
        </Modal>
      )}
      {pendingDelete && (
        <Modal title="Eliminar movimento?" close={() => setPendingDelete(null)}>
          <p>
            {pendingDelete.note || pendingDelete.kind} · {pendingDelete.date} ·{" "}
            {money(pendingDelete.eur)}
          </p>
          <p className="help">
            Podes anular a eliminação neste dispositivo. A validação do cartão
            continua ativa.
          </p>
          <div className="button-pair">
            <button onClick={() => setPendingDelete(null)}>Cancelar</button>
            <button
              className="primary"
              onClick={() => {
                const item = pendingDelete;
                if (
                  commit(
                    {
                      ...data,
                      transactions: data.transactions.filter(
                        (t) => t.id !== item.id,
                      ),
                    },
                    "Movimento eliminado",
                  )
                ) {
                  setRemoved(item);
                  setPendingDelete(null);
                }
              }}
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
      {removed && (
        <div className="undo-notice" role="status">
          Movimento eliminado.
          <button
            onClick={() => {
              if (data.transactions.some((t) => t.id === removed.id)) {
                setToast("Este movimento já existe.");
                return;
              }
              if (
                commit(
                  { ...data, transactions: [...data.transactions, removed] },
                  "Eliminação anulada",
                )
              )
                setRemoved(null);
            }}
          >
            Anular
          </button>
          <button
            aria-label="Fechar opção de anular"
            onClick={() => setRemoved(null)}
          >
            ×
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
