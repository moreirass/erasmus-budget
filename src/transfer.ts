import {
  type Data,
  laundryPrice,
  laundryServices,
  migrateTransaction,
  type Transaction,
  validateData,
} from "./model.ts";
const legacyFields = [
  "id",
  "date",
  "kind",
  "category",
  "amount",
  "currency",
  "rate",
  "eur",
  "credit",
  "note",
] as const;
const previousFields = [
  ...legacyFields,
  "travelType",
  "legacyCategory",
] as const;
const orderedFields = [...previousFields, "addedOrder"] as const;
const rateFields = [...orderedFields, "rateDate", "rateSource"] as const;
const timeFields = [...rateFields, "time"] as const;
const fields = [...timeFields, "service"] as const;
const prices = ["washPriceCzk", "dryPriceCzk"] as const;
const exportFields = [...fields, ...prices] as const;
const legacyLaundryFields = [...rateFields, "service", ...prices] as const;
const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
export function toCSV(d: Data) {
  return [
    exportFields.join(","),
    ...d.transactions.map((t) =>
      [
        ...fields.map((k) => {
          let s = String(t[k] ?? "");
          if (k === "note" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
          return quote(s);
        }),
        '""',
        '""',
      ].join(","),
    ),
    // A separate record keeps configuration distinct from transactions, even in an empty export.
    [
      ...fields.map(() => '""'),
      ...laundryServices.map((service) =>
        quote(String(laundryPrice(d.settings, service))),
      ),
    ].join(","),
  ].join("\r\n");
}
export function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Unclosed CSV quote.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function importCSV(text: string, d: Data): Data {
  const [head, ...rows] = parseCSV(text);
  const columns = [
    legacyFields,
    previousFields,
    orderedFields,
    rateFields,
    timeFields,
    legacyLaundryFields,
    exportFields,
  ].find(
    (layout) =>
      head?.length === layout.length &&
      layout.every((field, i) => head[i] === field),
  );
  if (!columns)
    throw new Error(
      "Use a CSV exported by Pocket. Amounts are integer cents; credit is in CZK cents.",
    );
  const settings = { ...d.settings };
  const hasPrices = columns === exportFields || columns === legacyLaundryFields;
  const txnFields = hasPrices ? columns.slice(0, -prices.length) : columns;
  let foundPrices = false;
  const tx = rows.flatMap((row) => {
    if (row.length !== columns.length)
      throw new Error("A CSV row has the wrong number of columns.");
    if (hasPrices) {
      const metadata = row.slice(txnFields.length);
      if (metadata.some(Boolean)) {
        if (
          foundPrices ||
          row.slice(0, txnFields.length).some(Boolean) ||
          !metadata.every((value) => value.trim())
        )
          throw new Error("Invalid laundry settings record in CSV.");
        foundPrices = true;
        prices.forEach((field, i) => {
          settings[field] = Number(metadata[i]);
        });
        return [];
      }
    }
    const o = Object.fromEntries(
      txnFields.map((f, i) => [
        f,
        ["amount", "rate", "eur", "credit", "addedOrder"].includes(f)
          ? row[i].trim() === ""
            ? NaN
            : Number(row[i])
          : row[i],
      ]),
    ) as Transaction;
    if (/^'[=+\-@\t\r]/.test(o.note)) o.note = o.note.slice(1);
    if (!o.travelType) delete o.travelType;
    if (!o.legacyCategory) delete o.legacyCategory;
    if (!o.addedOrder) delete o.addedOrder;
    if (!o.rateDate) delete o.rateDate;
    if (!o.rateSource) delete o.rateSource;
    if (!o.time) delete o.time;
    if (!o.service) delete o.service;
    return [migrateTransaction(o)];
  });
  const byId = new Map(d.transactions.map((t) => [t.id, t]));
  for (const t of tx) {
    const existing = byId.get(t.id);
    if (existing?.time && !columns.some((field) => field === "time"))
      t.time = existing.time;
    if (existing && !t.addedOrder) t.addedOrder = existing.addedOrder;
    if (existing && fields.some((f) => existing[f] !== t[f]))
      throw new Error(
        "CSV contains a changed transaction with an existing ID. Use a full JSON restore or remove that duplicate first.",
      );
    byId.set(t.id, t);
  }
  return validateData({ ...d, settings, transactions: [...byId.values()] });
}
export function download(
  name: string,
  body: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
