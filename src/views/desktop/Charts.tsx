import { useEffect, useRef, useState, type ReactNode } from "react";
import { currencyFactor } from "../../fx";
import { appLocale, tr } from "../../i18n";
import { money } from "../../model";

export const colors = {
  daily: "var(--viz-daily)",
  travel: "var(--viz-travel)",
  all: "var(--viz-all)",
  reference: "var(--viz-reference)",
  card: "var(--viz-card)",
};

export function ChartPanel({
  title,
  empty,
  controls,
  className = "",
  children,
}: {
  title: string;
  empty?: boolean;
  controls?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`pocket-panel desktop-chart ${className}`}>
      <div className="desktop-chart-heading">
        <h2>{title}</h2>
        {controls}
      </div>
      {empty ? (
        <p className="desktop-empty">{tr("No data for this period.")}</p>
      ) : (
        children
      )}
    </section>
  );
}

type Series = {
  label: string;
  color: string;
  kind: "bar" | "line";
  dashed?: boolean;
};
type Point = { label: string; values: number[] };
type Item = {
  label: string;
  parts: { label: string; amount: number; color: string }[];
};

export function Plot({
  label,
  points,
  series,
  currency = "EUR",
}: {
  label: string;
  points: Point[];
  series: Series[];
  currency?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const element = container.current!;
    const resize = new ResizeObserver(() =>
      setWidth(Math.max(270, element.clientWidth)),
    );
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  const selected = active === null ? null : points[active];
  const height = 206,
    left = 76,
    top = 12,
    baseline = 177,
    right = 14;
  const cell = (width - left - right) / Math.max(points.length, 1);
  const maxValue = Math.max(
    1,
    ...points.map((point) =>
      Math.max(
        point.values.reduce(
          (sum, value, i) => sum + (series[i].kind === "bar" ? value : 0),
          0,
        ),
        ...point.values,
      ),
    ),
  );
  const step = Math.pow(10, Math.floor(Math.log10(maxValue / 3)));
  const max = Math.ceil(maxValue / (3 * step)) * (3 * step);
  const x = (i: number) => left + (i + 0.5) * cell;
  const y = (value: number) => baseline - ((baseline - top) * value) / max;
  const barWidth = Math.min(44, cell * 0.66);
  const xInterval = Math.ceil(points.length / 6);
  const axis = new Intl.NumberFormat(appLocale(), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <div
      ref={container}
      className="desktop-plot"
      onMouseLeave={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={label}
        tabIndex={0}
        onFocus={() => {
          setKeyboard(true);
          setActive(0);
        }}
        onBlur={() => {
          setKeyboard(false);
          setActive(null);
        }}
        onKeyDown={(event) => {
          if (
            !["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(
              event.key,
            )
          )
            return;
          if (event.key !== "Escape") event.preventDefault();
          if (event.key === "Escape") setActive(null);
          else if (event.key === "Home") setActive(0);
          else if (event.key === "End") setActive(points.length - 1);
          else
            setActive((index) =>
              Math.min(
                points.length - 1,
                Math.max(
                  0,
                  (index ?? 0) + (event.key === "ArrowLeft" ? -1 : 1),
                ),
              ),
            );
        }}
      >
        {[0, 1, 2, 3].map((tick) => {
          const value = Math.round((max * tick) / 3);
          return (
            <g key={tick}>
              <line
                className="desktop-gridline"
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
              />
              <text
                className="desktop-axis"
                x={left - 7}
                y={y(value) + 4}
                textAnchor="end"
              >
                {axis.format(value / currencyFactor(currency))}
              </text>
            </g>
          );
        })}
        {points.map((point, i) => {
          let stack = 0;
          return (
            <g key={i}>
              {point.values.map((value, j) => {
                if (series[j].kind !== "bar" || value <= 0) return null;
                const lower = stack;
                stack += value;
                return (
                  <rect
                    key={series[j].label}
                    x={x(i) - barWidth / 2}
                    y={y(stack)}
                    width={barWidth}
                    height={y(lower) - y(stack)}
                    fill={series[j].color}
                  />
                );
              })}
              {(i % xInterval === 0 ||
                (i === points.length - 1 &&
                  i % xInterval >= xInterval / 2)) && (
                <text
                  className="desktop-axis"
                  x={x(i)}
                  y={baseline + 19}
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
        {series.map(
          (item, j) =>
            item.kind === "line" && (
              <g key={item.label}>
                <polyline
                  points={points
                    .map((point, i) => `${x(i)},${y(point.values[j])}`)
                    .join(" ")}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.5"
                  strokeDasharray={item.dashed ? "6 4" : undefined}
                />
                {points.length < 8 &&
                  points.map((point, i) => (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(point.values[j])}
                      r="3"
                      fill={item.color}
                    />
                  ))}
              </g>
            ),
        )}
        {active !== null && selected && (
          <line
            className="desktop-crosshair"
            x1={x(active)}
            x2={x(active)}
            y1={top}
            y2={baseline}
          />
        )}
        {points.map((point, i) => (
          <rect
            key={i}
            x={left + i * cell}
            y={top}
            width={cell}
            height={baseline - top}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
          />
        ))}
      </svg>
      <div className="desktop-legend">
        {series.map((item) => (
          <span key={item.label}>
            <i style={{ background: item.color }} data-dashed={item.dashed} />
            {item.label}
          </span>
        ))}
      </div>
      <div
        className="desktop-tooltip"
        role={keyboard ? "status" : undefined}
        hidden={!selected}
      >
        {selected && (
          <>
            <strong>{selected.label}</strong>
            {series.map((item, i) => (
              <span key={item.label}>
                {item.label} <b>{money(selected.values[i], currency)}</b>
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function Donut({
  items,
  total,
}: {
  items: { label: string; amount: number; color: string; opacity: number }[];
  total: number;
}) {
  const [active, setActive] = useState<string | null>(null);
  let offset = 0;
  const selected = items.find((item) => item.label === active);
  return (
    <div className="desktop-donut">
      <div className="desktop-donut-graphic">
        <svg viewBox="0 0 164 164" aria-hidden="true">
          <circle
            cx="82"
            cy="82"
            r="62"
            fill="none"
            stroke="var(--meter-track)"
            strokeWidth="20"
          />
          {items.map((item) => {
            const portion = (item.amount / total) * 100;
            const position = offset;
            offset += portion;
            return (
              <circle
                key={item.label}
                cx="82"
                cy="82"
                r="62"
                pathLength="100"
                fill="none"
                stroke={item.color}
                strokeOpacity={
                  active && active !== item.label
                    ? item.opacity * 0.45
                    : item.opacity
                }
                strokeWidth={item.label === active ? 23 : 20}
                strokeDasharray={`${Math.max(portion - Math.min(1, portion * 0.08), 0)} ${100 - Math.max(portion - Math.min(1, portion * 0.08), 0)}`}
                strokeDashoffset={-position}
                transform="rotate(-90 82 82)"
                onPointerEnter={() => setActive(item.label)}
                onPointerLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="desktop-donut-center">
          <small>{selected?.label ?? tr("Total")}</small>
          <strong>{money(selected?.amount ?? total)}</strong>
        </div>
      </div>
      <div className="desktop-donut-legend">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setActive(item.label)}
            onPointerEnter={() => setActive(item.label)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(item.label)}
            onBlur={() => setActive(null)}
          >
            <i style={{ background: item.color, opacity: item.opacity }} />
            <span>{item.label}</span>
            <b>{money(item.amount)}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBars({ items }: { items: Item[] }) {
  const maximum = Math.max(
    1,
    ...items.map((item) =>
      item.parts.reduce((sum, part) => sum + part.amount, 0),
    ),
  );
  return (
    <ul className="desktop-hbars">
      {items.map((item) => {
        const total = item.parts.reduce((sum, part) => sum + part.amount, 0);
        const values = item.parts
          .map((part) => `${part.label} · ${money(part.amount)}`)
          .join(" / ");
        return (
          <li
            key={item.label}
            data-values={values}
            tabIndex={0}
            aria-label={`${item.label} · ${values}`}
          >
            <div>
              <strong>{item.label}</strong>
              <span>{money(total)}</span>
            </div>
            <div className="desktop-hbar-track" aria-label={values}>
              {item.parts.map((part) => (
                <span
                  key={part.label}
                  style={{
                    width: `${(part.amount / maximum) * 100}%`,
                    background: part.color,
                  }}
                />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
