import {
  CalendarDays,
  Cloud,
  Download,
  LogOut,
  RefreshCw,
  Upload,
  Wallet,
  WashingMachine,
} from "lucide-react";
import { BackupReminder } from "../components/BackupReminder";
import { FavoriteManager } from "../components/Favorites";
import { RecurringManager } from "../components/Recurring";
import {
  BudgetForm,
  ExchangePanel,
  LaundryPanel,
  SettingsForm,
  TransactionList,
} from "../components/Panels";
import { Field } from "../components/Primitives";
import { money, monthEnd, monthLabel, planFor, today } from "../model";
import { displayDate, tr, type Language } from "../i18n";
import { cloud } from "../store";
import type { ViewProps } from "./types";
import type { BudgetStore, Commit } from "../hooks/types";
import type { useSettings } from "../hooks/useSettings";
import type { useDataTransfer } from "../hooks/useDataTransfer";
type SettingsProps = Pick<
  ViewProps,
  | "data"
  | "fx"
  | "stats"
  | "month"
  | "range"
  | "openNew"
  | "setEditor"
  | "setPendingDelete"
> &
  ReturnType<typeof useSettings> &
  Pick<
    ReturnType<typeof useDataTransfer>,
    "fileRef" | "readFile" | "exportJSON" | "exportCSV"
  > & {
    store: BudgetStore;
    commit: Commit;
    monthList: string[];
    online: boolean;
    language: Language;
    setLanguage: (language: Language) => void;
    setToast: (message: string) => void;
  };
export function SettingsView({
  data,
  fx,
  stats,
  month,
  range,
  openNew,
  setEditor,
  setPendingDelete,
  selectedPlanMonth,
  setPlanMonth,
  planScope,
  setPlanScope,
  settingsSection,
  setSettingsSection,
  fileRef,
  readFile,
  exportJSON,
  exportCSV,
  store,
  commit,
  monthList,
  online,
  language,
  setLanguage,
  setToast,
}: SettingsProps) {
  return (
    <>
      <section className="panel">
        <label>
          <input
            type="checkbox"
            checked={data.settings.limitAlerts !== false}
            onChange={(e) =>
              commit({
                ...data,
                settings: {
                  ...data.settings,
                  limitAlerts: e.target.checked,
                },
              })
            }
          />
          {tr("Enable monthly limit alerts")}
        </label>
      </section>
      <FavoriteManager
        key={store.user?.id ?? "guest"}
        data={data}
        fx={fx}
        save={commit}
      />
      <RecurringManager
        key={store.user?.id ?? "guest"}
        data={data}
        save={commit}
        fx={fx}
      />
      <section className="panel language-settings">
        <div>
          <h2>{tr("Language")}</h2>
          <p className="help">
            {tr(
              "Choose the app language. Your preference is saved on this device.",
            )}
          </p>
        </div>
        <select
          aria-label={tr("Language")}
          value={language}
          onChange={(event) =>
            setLanguage(event.target.value === "pt" ? "pt" : "en")
          }
        >
          <option value="en" lang="en">
            English
          </option>
          <option value="pt" lang="pt-PT">
            Português (Portugal)
          </option>
        </select>
      </section>
      <div className="settings-tabs">
        <button
          className={settingsSection === "plan" ? "selected" : ""}
          onClick={() => setSettingsSection("plan")}
        >
          <Wallet size={18} /> {tr("Plan")}{" "}
        </button>
        <button
          className={settingsSection === "rates" ? "selected" : ""}
          onClick={() => setSettingsSection("rates")}
        >
          <RefreshCw size={18} /> {tr("Exchange")}{" "}
        </button>
        <button
          className={settingsSection === "tracking" ? "selected" : ""}
          onClick={() => setSettingsSection("tracking")}
        >
          <WashingMachine size={18} /> {tr("Card")}{" "}
        </button>
        <button
          className={settingsSection === "data" ? "selected" : ""}
          onClick={() => setSettingsSection("data")}
        >
          <Download size={18} /> {tr("Data")}{" "}
        </button>
        <button
          className={settingsSection === "sync" ? "selected" : ""}
          onClick={() => setSettingsSection("sync")}
        >
          <Cloud size={18} /> {tr("Account")}{" "}
        </button>
      </div>
      <div className={`settings-grid section-${settingsSection}`}>
        <div className="panel plan-panel">
          <div className="section-heading">
            <div>
              <h2>{tr("Your monthly plan")}</h2>
              <p>
                {tr(
                  "Choose a month, adjust its budgets and decide whether to apply the plan to following months.",
                )}{" "}
              </p>
            </div>
          </div>
          <BudgetForm
            key={selectedPlanMonth + JSON.stringify(data.plans)}
            month={selectedPlanMonth}
            setMonth={setPlanMonth}
            scope={planScope}
            setScope={setPlanScope}
            data={data}
            save={(d) => commit(d, "Monthly plan saved")}
          />
          <p className="help">
            {tr(
              "Day to day and travel are independent budgets. Only laundry card credit rolls over. Weekly guides are prorated to the days in the month.",
            )}{" "}
          </p>
          <div className="semester-plan">
            <h3>
              <CalendarDays size={17} /> {tr("Semester trajectory")}{" "}
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
            <h2>{tr("Tracking & opening balances")}</h2>
            <p className="help">
              {tr(
                "Only enter laundry credit you actually have. It is not a new expense. Previous travel and emergency reserves are retained in backups and no longer increase your monthly budgets.",
              )}{" "}
            </p>
            <LaundryPanel stats={stats} openNew={openNew} />
            <SettingsForm
              key={JSON.stringify(data.settings)}
              data={data}
              save={(d) => commit(d, "Settings saved")}
            />
            <div className="laundry-history">
              <h3>
                <WashingMachine size={18} /> {tr("Card history")}{" "}
              </h3>
              <p className="help">
                {tr("Through {0} · card top-ups and usage only.", [
                  displayDate(range?.end ?? monthEnd(month)),
                ])}
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
            <h2>{tr("Your data, your way")}</h2>
            <BackupReminder
              key={store.user?.id ?? "guest"}
              data={data}
              scope={store.user?.id ?? "guest"}
              save={commit}
              exportJSON={exportJSON}
              settings
            />
            <p className="help">
              {tr(
                "JSON and CSV exports are plain text, without encryption. Keep them somewhere private. CSV merges transactions by ID. Imports are validated before any changes.",
              )}{" "}
            </p>
            <div className="export-buttons">
              <button onClick={exportJSON}>
                <Download size={16} /> {tr("Full JSON backup")}{" "}
              </button>
              <button onClick={exportCSV}>
                <Download size={16} /> {tr("Transactions CSV")}{" "}
              </button>
              <button onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> {tr("Import JSON / CSV")}{" "}
              </button>
            </div>
            <input
              type="file"
              ref={fileRef}
              hidden
              onChange={(e) => readFile(e.target.files?.[0])}
            />
            <p className="help">
              {tr(
                "Local data stays in this browser. Export a backup before clearing browser data or moving devices.",
              )}{" "}
            </p>
          </div>
          <div className="panel sync-panel">
            <h2>
              <Cloud size={20} /> {tr("Account & sync")}{" "}
            </h2>
            {!cloud ? (
              <>
                <p className="help">
                  {tr(
                    "Local mode is ready to use. Add your Supabase project URL and publishable key to enable sign-in and sync. Setup instructions are in README.md.",
                  )}{" "}
                </p>
                <span className="pill">{tr("No account required")}</span>
              </>
            ) : store.user ? (
              <>
                <p className="help">
                  {tr(
                    "Signed in as {0}. Account data is separate from the local workspace. To transfer local records, export there and import here.",
                    [store.user.email ?? ""],
                  )}
                </p>
                <p className="sync-status">{tr(store.status)}</p>
                <div className="button-pair">
                  <button
                    onClick={() => store.sync()}
                    disabled={store.busy || !online}
                  >
                    <RefreshCw size={16} className={store.busy ? "spin" : ""} />{" "}
                    {tr("Sync now")}{" "}
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        store.dirty &&
                        !confirm(
                          tr(
                            "Unsynced changes stay on this device. Sign out anyway?",
                          ),
                        )
                      )
                        return;
                      const result = await cloud!.auth.signOut();
                      if (result.error) setToast(result.error.message);
                    }}
                  >
                    <LogOut size={16} /> {tr("Sign out")}{" "}
                  </button>
                </div>
                <p className="help">
                  {tr(
                    "Press Sync on each device before and after editing. Offline changes stay local until synced. If both versions changed, you choose which to keep.",
                  )}{" "}
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
                    error?.message ?? "Check your email for a sign-in link.",
                  );
                }}
              >
                <Field label={tr("Email address")}>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                  />
                </Field>
                <button className="primary" type="submit">
                  {tr("Send sign-in link")}{" "}
                </button>
                <p className="help">
                  {tr(
                    "Signing in opens a separate account workspace. Your local records stay on this device.",
                  )}{" "}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
