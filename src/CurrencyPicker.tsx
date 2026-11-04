import { useEffect, useId, useRef, useState } from "react";
import { currencyName, searchCurrencies, type CurrencyInfo } from "./fx";
import { tr } from "./i18n";
export function CurrencyPicker({
  value,
  onChange,
  currencies,
  disabled = false,
}: {
  value: string;
  onChange: (code: string) => void;
  currencies: CurrencyInfo[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0);
  const id = useId(),
    trigger = useRef<HTMLButtonElement>(null),
    input = useRef<HTMLInputElement>(null);
  const results = searchCurrencies(currencies, query);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open)
      document
        .getElementById(`${id}-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);
  function choose(code: string) {
    onChange(code);
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div className="currency-picker">
      <span className="field-label" id={`${id}-label`}>
        {tr("Currency")}{" "}
      </span>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        aria-expanded={open}
        aria-label={tr("Currency: {0}", [value])}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive(0);
          }
        }}
        onClick={() => {
          setOpen(!open);
          setQuery("");
          setActive(0);
        }}
      >
        {value} · {currencyName(value)} ▾
      </button>
      {open && (
        <div className="currency-options">
          <input
            ref={input}
            role="combobox"
            aria-label={tr("Search currencies")}
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={`${id}-list`}
            aria-activedescendant={
              results[active] ? `${id}-${active}` : undefined
            }
            placeholder={tr("Search name or code · EUR, dollar…")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key))
                e.preventDefault();
              if (e.key === "ArrowDown")
                setActive((i) => Math.min(results.length - 1, i + 1));
              if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
              if (e.key === "Enter" && results[active])
                choose(results[active].code);
              if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
                trigger.current?.focus();
              }
            }}
          />
          <div
            className="currency-results"
            role="listbox"
            id={`${id}-list`}
            aria-labelledby={`${id}-label`}
          >
            {results.map((c, i) => (
              <button
                type="button"
                role="option"
                tabIndex={-1}
                id={`${id}-${i}`}
                className={active === i ? "keyboard-active" : ""}
                aria-selected={c.code === value}
                key={c.code}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(c.code)}
              >
                <b>{c.code}</b>
                <span>{currencyName(c.code)}</span>
              </button>
            ))}
            {!results.length && (
              <p role="status">{tr("No currencies found.")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
