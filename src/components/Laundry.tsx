import { WashingMachine } from "lucide-react";
import { appLocale, laundryServiceLabel, tr } from "../i18n";
import type { Commit } from "../hooks/types";
import {
  laundryBalance,
  laundryPrice,
  laundryServices,
  money,
  type Data,
  type LaundryService,
} from "../model";
import { Field } from "./Primitives";

export function LaundryQuickCard({
  data,
  disabled,
  record,
  topUp,
  openCard,
}: {
  data: Data;
  disabled: boolean;
  record: (service: LaundryService) => void;
  topUp: () => void;
  openCard: () => void;
}) {
  return (
    <section className="pocket-panel laundry-quick">
      <div className="pocket-section-head">
        <h2>
          <WashingMachine size={18} aria-hidden="true" />
          {tr("Laundry card")}
        </h2>
        <button onClick={openCard}>{tr("View card")}</button>
      </div>
      <strong className="laundry-quick-balance">
        {money(laundryBalance(data), "CZK")}
      </strong>
      <div className="laundry-quick-actions">
        {laundryServices.map((service) => (
          <button
            key={service}
            type="button"
            disabled={disabled}
            onClick={() => record(service)}
          >
            {laundryServiceLabel(service)} ·{" "}
            {laundryPrice(data.settings, service).toLocaleString(appLocale())}{" "}
            CZK
          </button>
        ))}
        <button
          className="laundry-quick-topup"
          type="button"
          disabled={disabled}
          onClick={topUp}
        >
          {tr("Top up")}
        </button>
      </div>
    </section>
  );
}

export function LaundryPriceSettings({
  data,
  save,
}: {
  data: Data;
  save: Commit;
}) {
  const wash = laundryPrice(data.settings, "wash");
  const dry = laundryPrice(data.settings, "dry");
  return (
    <form
      key={`${wash}/${dry}`}
      onSubmit={(event) => {
        event.preventDefault();
        const input = new FormData(event.currentTarget);
        save(
          {
            ...data,
            settings: {
              ...data.settings,
              washPriceCzk: Number(input.get("washPriceCzk")),
              dryPriceCzk: Number(input.get("dryPriceCzk")),
            },
          },
          "Laundry prices saved",
        );
      }}
    >
      <p className="muted">
        {tr("Current card balance: {0}", [money(laundryBalance(data), "CZK")])}
      </p>
      <div className="laundry-price-fields">
        <Field label={tr("Wash price (CZK)")}>
          <input
            type="number"
            name="washPriceCzk"
            required
            min="0.01"
            max="1000000"
            step="0.01"
            inputMode="decimal"
            defaultValue={wash}
          />
        </Field>
        <Field label={tr("Drying price (CZK)")}>
          <input
            type="number"
            name="dryPriceCzk"
            required
            min="0.01"
            max="1000000"
            step="0.01"
            inputMode="decimal"
            defaultValue={dry}
          />
        </Field>
      </div>
      <p className="help">{tr("Price changes apply only to new entries.")}</p>
      <button type="submit" className="primary">
        {tr("Save")}
      </button>
    </form>
  );
}
