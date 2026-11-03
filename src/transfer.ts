import {
  type Data,
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
const fields = [...orderedFields, "rateDate", "rateSource"] as const;
export function toCSV(d: Data) {
  return [
    fields.join(","),
    ...d.transactions.map((t) =>
      fields
        .map((k) => {
          let s = String(t[k] ?? "");
          if (k === "note" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(","),
    ),
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
  const columns =
    head?.length === legacyFields.length
      ? legacyFields
      : head?.length === previousFields.length
        ? previousFields
        : head?.length === orderedFields.length
          ? orderedFields
          : fields;
  if (
    !head ||
    columns.some((f, i) => head[i] !== f) ||
    head.length !== columns.length
  )
    throw new Error(
      "Use a CSV exported by Pocket. Amounts are integer cents; credit is in CZK cents.",
    );
  const tx = rows.map((row) => {
    if (row.length !== columns.length)
      throw new Error("A CSV row has the wrong number of columns.");
    const o = Object.fromEntries(
      columns.map((f, i) => [
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
    return migrateTransaction(o);
  });
  const byId = new Map(d.transactions.map((t) => [t.id, t]));
  for (const t of tx) {
    const existing = byId.get(t.id);
    if (existing && !t.addedOrder) t.addedOrder = existing.addedOrder;
    if (existing && fields.some((f) => existing[f] !== t[f]))
      throw new Error(
        "CSV contains a changed transaction with an existing ID. Use a full JSON restore or remove that duplicate first.",
      );
    byId.set(t.id, t);
  }
  return validateData({ ...d, transactions: [...byId.values()] });
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
