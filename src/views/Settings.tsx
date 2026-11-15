import { BusyButton } from "../components/Feedback";
import { errorMessage } from "../i18n";
import { useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Download,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
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
import { Field, Modal } from "../components/Primitives";
import { money, monthEnd, monthLabel, planFor, today } from "../model";
import { appLocale, displayDate, tr, type Language } from "../i18n";
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
    dark: boolean;
    setDark: (dark: boolean) => void;
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
  dark,
  setDark,
  setToast,
}: SettingsProps) {
  const [reading, setReading] = useState(false);
  const [sending, setSending] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const tabs = [
    { id: "plan", label: "Plan", icon: Wallet },
    { id: "rates", label: "Exchange", icon: RefreshCw },
    { id: "tracking", label: "Card", icon: WashingMachine },
    { id: "data", label: "Data", icon: Download },
    { id: "sync", label: "Account", icon: Cloud },
  ];
  const scope = store.user?.id ?? "guest";
  return (
    <>
      <nav
        className="settings-tabs"
        aria-label={tr("Budget and settings sections")}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={settingsSection === id ? "selected" : ""}
            aria-pressed={settingsSection === id}
            aria-controls={`settings-${id}`}
            onClick={() => setSettingsSection(id)}
          >
            <Icon size={18} /> <span>{tr(label)}</span>
          </button>
        ))}
      </nav>

      <section
        id="settings-plan"
        className="settings-section settings-plan-layout"
        aria-label={tr("Plan")}
        hidden={settingsSection !== "plan"}
      >
        <div className="panel plan-panel">
          <div className="section-heading">
            <div>
              <h2>{tr("Your monthly plan")}</h2>
              <p>
                {tr(
                  "Choose a month, adjust its budgets and decide whether to apply the plan to following months.",
                )}
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
            )}
          </p>
        </div>
        <div className="settings-companion">
          <section className="panel semester-plan">
            <h2>
              <CalendarDays size={20} /> {tr("Semester trajectory")}
            </h2>
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
          </section>
          <div className="plan-automation">
            <RecurringManager key={scope} data={data} save={commit} fx={fx} />
            <FavoriteManager key={scope} data={data} fx={fx} save={commit} />
          </div>
        </div>
      </section>

      <section
        id="settings-rates"
        className="settings-section settings-rates-layout"
        aria-label={tr("Exchange rates")}
        hidden={settingsSection !== "rates"}
      >
        <div className="panel rates-panel">
          <ExchangePanel fx={fx} />
        </div>
      </section>

      <section
        id="settings-tracking"
        className="settings-section settings-card-layout"
        aria-label={tr("Laundry card")}
        hidden={settingsSection !== "tracking"}
      >
        <div className="settings-companion">
          <LaundryPanel stats={stats} openNew={openNew} />
          <section className="panel tracking-panel">
            <h2>{tr("Tracking & opening balances")}</h2>
            <p className="help">
              {tr(
                "Only enter laundry credit you actually have. It is not a new expense. Previous travel and emergency reserves are retained in backups and no longer increase your monthly budgets.",
              )}
            </p>
            <SettingsForm
              key={JSON.stringify(data.settings)}
              data={data}
              save={(d) => commit(d, "Settings saved")}
            />
          </section>
        </div>
        <section className="panel laundry-history">
          <div className="section-heading">
            <div>
              <h2>
                <WashingMachine size={20} /> {tr("Card history")}
              </h2>
              <p>
                {tr("Through {0} · card top-ups and usage only.", [
                  displayDate(range?.end ?? monthEnd(month)),
                ])}
              </p>
            </div>
          </div>
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
        </section>
      </section>

      <section
        id="settings-data"
        className="settings-section settings-data-layout"
        aria-label={tr("Data")}
        hidden={settingsSection !== "data"}
      >
        <section className="panel data-panel">
          <div className="section-heading">
            <div>
              <h2>{tr("Backup files")}</h2>
              <p>{tr("Export or restore your records.")}</p>
            </div>
            <Download size={22} />
          </div>
          <div className="data-actions">
            <BusyButton className="data-action" onClick={exportJSON}>
              <Download size={22} />
              <span>
                <strong>{tr("Full JSON backup")}</strong>
                <small>{tr("Plans, transactions, rules and favorites")}</small>
              </span>
            </BusyButton>
            <BusyButton className="data-action" onClick={exportCSV}>
              <Download size={22} />
              <span>
                <strong>{tr("Transactions CSV")}</strong>
                <small>{tr("Transaction history for a spreadsheet")}</small>
              </span>
            </BusyButton>
            <button
              className="data-action import-action"
              disabled={reading}
              aria-busy={reading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={22} />
              <span>
                <strong>
                  {tr(reading ? "Reading file…" : "Import JSON / CSV")}
                </strong>
                <small>{tr("Review the file before making changes")}</small>
              </span>
            </button>
          </div>
          <input
            type="file"
            ref={fileRef}
            hidden
            disabled={reading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setReading(true);
              try {
                await readFile(file);
              } finally {
                setReading(false);
              }
            }}
          />
          <div className="privacy-note">
            <AlertCircle size={20} />
            <p>
              {tr(
                "JSON and CSV exports are plain text, without encryption. Keep them somewhere private. CSV merges transactions by ID. Imports are validated before any changes.",
              )}
            </p>
          </div>
          <p className="help">
            {tr(
              "Local data stays in this browser. Export a backup before clearing browser data or moving devices.",
            )}
          </p>
        </section>
        <section className="panel backup-settings">
          <h2>{tr("Backup reminders")}</h2>
          <BackupReminder
            key={scope}
            data={data}
            scope={scope}
            save={commit}
            exportJSON={exportJSON}
            settings
          />
        </section>
      </section>

      <section
        id="settings-sync"
        className="settings-section settings-account-layout"
        aria-label={tr("Account")}
        hidden={settingsSection !== "sync"}
      >
        <section className="panel sync-panel">
          <div className="section-heading">
            <div>
              <h2>
                <Cloud size={20} /> {tr("Account & sync")}
              </h2>
              <p>{tr("Account and manual sync")}</p>
            </div>
          </div>
          {!online && (
            <div className="notice" role="status">
              <AlertCircle size={20} />
              <span>
                {tr(
                  "Offline changes stay on this device until you sync online.",
                )}
              </span>
            </div>
          )}
          {!cloud ? (
            <>
              <span className="pill">{tr("No account required")}</span>
              <p className="help">
                {tr(
                  "Local mode is ready to use. Add your Supabase project URL and publishable key to enable sign-in and sync. Setup instructions are in README.md.",
                )}
              </p>
            </>
          ) : store.user ? (
            <>
              <div className="account-identity">
                <span className="tiny">{tr("Signed-in account")}</span>
                <strong>{store.user.email}</strong>
              </div>
              <p className="help">
                {tr(
                  "Signed in as {0}. Account data is separate from the local workspace. To transfer local records, export there and import here.",
                  [store.user.email ?? ""],
                )}
              </p>
              <div className="account-sync-state" role="status">
                {store.busy ? (
                  <RefreshCw size={20} className="spin" />
                ) : store.dirty ? (
                  <AlertCircle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                <div>
                  <strong>{tr(store.status)}</strong>
                  <small>
                    {store.dirty
                      ? tr("Unsynced changes")
                      : tr("No pending changes")}
                  </small>
                  <small>
                    {store.lastSyncedAt
                      ? tr("Last sync: {0}", [
                          new Date(store.lastSyncedAt).toLocaleString(
                            appLocale(),
                          ),
                        ])
                      : tr("Not synced yet")}
                  </small>
                </div>
              </div>
              <div className="button-pair">
                <button
                  className="primary"
                  onClick={() => store.sync()}
                  disabled={store.busy || !online}
                >
                  <RefreshCw size={18} className={store.busy ? "spin" : ""} />{" "}
                  {tr(store.busy ? "Syncing…" : "Sync now")}
                </button>
                <button
                  onClick={() => {
                    setAuthError("");
                    setConfirmSignOut(true);
                  }}
                >
                  <LogOut size={18} /> {tr("Sign out")}
                </button>
              </div>
              <p className="help">
                {tr(
                  "Press Sync on each device before and after editing. Offline changes stay local until synced. If both versions changed, you choose which to keep.",
                )}
              </p>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (sending || !online) return;
                const email = String(
                  new FormData(e.currentTarget).get("email"),
                );
                setSending(true);
                setAuthError("");
                setAuthMessage("");
                try {
                  const { error } = await cloud!.auth.signInWithOtp({
                    email,
                    options: { emailRedirectTo: location.origin },
                  });
                  if (error) throw error;
                  setAuthMessage("Check your email for a sign-in link.");
                  setToast("Check your email for a sign-in link.");
                } catch (error) {
                  setAuthError(
                    error instanceof Error ? error.message : String(error),
                  );
                } finally {
                  setSending(false);
                }
              }}
            >
              <Field label={tr("Email address")}>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={sending}
                />
              </Field>
              <button
                className="primary full"
                type="submit"
                disabled={sending || !online}
              >
                {sending && <RefreshCw size={18} className="spin" />}
                {tr(sending ? "Sending sign-in link…" : "Send sign-in link")}
              </button>
              {authMessage && (
                <div className="notice" role="status">
                  <CheckCircle2 size={20} />
                  <span>{tr(authMessage)}</span>
                </div>
              )}
              {authError && (
                <div className="form-error" role="alert">
                  <AlertCircle size={20} />
                  <span>{errorMessage(authError)}</span>
                </div>
              )}
              <p className="help">
                {tr(
                  "Signing in opens a separate account workspace. Your local records stay on this device.",
                )}
              </p>
            </form>
          )}
        </section>
        <section className="panel preferences-panel">
          <h2>{tr("Appearance & language")}</h2>
          <div className="preference-row">
            <h3>{tr("Appearance")}</h3>
            <div className="segmented" aria-label={tr("Appearance")}>
              <button
                type="button"
                className={dark ? "selected" : ""}
                aria-pressed={dark}
                onClick={() => setDark(true)}
              >
                <Moon size={18} />
                {tr("Dark")}
              </button>
              <button
                type="button"
                className={!dark ? "selected" : ""}
                aria-pressed={!dark}
                onClick={() => setDark(false)}
              >
                <Sun size={18} />
                {tr("Light")}
              </button>
            </div>
          </div>
          <div className="preference-row language-settings">
            <Field label={tr("Language")}>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value === "pt" ? "pt" : "en")
                }
              >
                <option value="en" lang="en">
                  English
                </option>
                <option value="pt" lang="pt-PT">
                  Português (Portugal)
                </option>
              </select>
            </Field>
            <p className="help">
              {tr(
                "Choose the app language. Your preference is saved on this device.",
              )}
            </p>
          </div>
          <div className="preference-row">
            <label className="check-field">
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
              <span>{tr("Enable monthly limit alerts")}</span>
            </label>
            <p className="help">
              {tr(
                "Show a reminder at 80% and 100% of a monthly category limit.",
              )}
            </p>
          </div>
        </section>
      </section>
      {confirmSignOut && (
        <Modal
          title={tr("Sign out?")}
          close={() => {
            if (!signingOut) setConfirmSignOut(false);
          }}
        >
          <p className="help">
            {tr(
              store.dirty
                ? "Unsynced changes stay on this device. Sign out anyway?"
                : "Your saved account data stays on this device after signing out.",
            )}
          </p>
          {authError && (
            <div className="form-error" role="alert">
              <AlertCircle size={20} />
              <span>{errorMessage(authError)}</span>
            </div>
          )}
          <div className="button-pair">
            <button
              disabled={signingOut}
              onClick={() => setConfirmSignOut(false)}
            >
              {tr("Cancel")}
            </button>
            <button
              className="primary"
              disabled={signingOut}
              onClick={async () => {
                if (!cloud) return;
                setSigningOut(true);
                setAuthError("");
                try {
                  const { error } = await cloud.auth.signOut();
                  if (error) throw error;
                  setConfirmSignOut(false);
                } catch (error) {
                  setAuthError(
                    error instanceof Error ? error.message : String(error),
                  );
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              {tr(signingOut ? "Signing out…" : "Sign out")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
