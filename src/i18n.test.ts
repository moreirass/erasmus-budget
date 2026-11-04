import { afterEach, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import {
  appLocale,
  getLanguage,
  readLanguage,
  setLanguage,
  tr,
  trCount,
} from "./i18n.ts";
import { portuguese } from "./locales/pt.ts";
import { freshData, money, monthLabel } from "./model.ts";
import { currencyName, searchCurrencies } from "./fx.ts";
import { toCSV } from "./transfer.ts";

afterEach(() => setLanguage("en"));

it("defaults to English and switches copy, dates, money and currency names together", () => {
  assert.equal(getLanguage(), "en");
  assert.equal(tr("Transactions"), "Transactions");
  assert.equal(monthLabel("2026-11"), "November 2026");
  assert.match(money(123456), /1,234\.56/);
  setLanguage("pt");
  assert.equal(appLocale(), "pt-PT");
  assert.equal(tr("Transactions"), "Movimentos");
  assert.match(monthLabel("2026-11"), /novembro.*2026/);
  assert.match(money(123456), /1234,56|1\s234,56/);
  assert.match(currencyName("USD"), /dólar/i);
  assert.equal(
    searchCurrencies([{ code: "USD", name: "US Dollar" }], "dolar").length,
    1,
  );
  assert.equal(tr("{0} transactions", [3]), "3 movimentos");
  assert.equal(trCount("{0} transactions", [1]), "1 movimento");
  assert.equal(trCount("{0} transactions", [0]), "0 movimentos");
  assert.equal(
    tr("Unclosed CSV quote."),
    "O ficheiro CSV contém aspas por fechar.",
  );
  assert.equal(
    tr(
      "Laundry credit would be negative on 2026-11-04. Add the missing top-up or opening credit first.",
    ),
    "O crédito da lavandaria ficaria negativo em 2026-11-04. Adiciona primeiro o carregamento em falta ou o crédito inicial.",
  );
});

it("persists a supported language and tolerates unavailable storage", () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const saved = new Map<string, string>();
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => saved.set(key, value),
      },
    });
    assert.equal(readLanguage(), "en");
    setLanguage("pt");
    assert.equal(saved.get("pocket-language"), "pt");
    assert.equal(readLanguage(), "pt");
    saved.set("pocket-language", "fr");
    assert.equal(readLanguage(), "en");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Blocked");
      },
    });
    assert.equal(readLanguage(), "en");
    assert.doesNotThrow(() => setLanguage("pt"));
    assert.equal(getLanguage(), "pt");
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});

it("keeps financial data and machine-readable exports unchanged when switching language", () => {
  const data = freshData();
  const json = JSON.stringify(data),
    csv = toCSV(data);
  setLanguage("pt");
  assert.equal(JSON.stringify(data), json);
  assert.equal(toCSV(data), csv);
  assert.equal(
    tr("A personal note not in the catalog"),
    "A personal note not in the catalog",
  );
});

it("covers every literal translation key and preserves interpolation placeholders", () => {
  for (const [english, translated] of Object.entries(portuguese)) {
    assert.deepEqual(
      [...translated.matchAll(/\{\d+\}/g)].map((x) => x[0]).sort(),
      [...english.matchAll(/\{\d+\}/g)].map((x) => x[0]).sort(),
      english,
    );
  }
  for (const file of readdirSync("src", { recursive: true })
    .map(String)
    .filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith(".test.ts"))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(`src/${file}`, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === "tr"
      ) {
        const key = node.arguments[0];
        if (key && ts.isStringLiteral(key))
          assert.ok(
            Object.hasOwn(portuguese, key.text),
            `${file}: ${key.text}`,
          );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
