import { it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
it("locks down executable sources and embedding without blocking required services", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const headers = config.headers.find(
    (h: { source: string }) => h.source === "/(.*)",
  ).headers;
  const get = (key: string) =>
    headers.find((h: { key: string }) => h.key === key)?.value;
  const csp = get("Content-Security-Policy");
  assert.ok(csp.includes("script-src 'self'"));
  assert.ok(!csp.includes("'unsafe-eval'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("https://api.frankfurter.dev"));
  assert.equal(get("X-Frame-Options"), "DENY");
  assert.ok(get("Permissions-Policy").includes("camera=()"));
});
it("ships separate maskable assets and accurate install screenshots", () => {
  const config = readFileSync("vite.config.ts", "utf8");
  assert.ok(
    config.includes("purpose:'maskable'") ||
      config.includes('purpose: "maskable"'),
  );
  for (const file of [
    "public/icon-maskable-512.png",
    "public/screenshots/mobile.png",
    "public/screenshots/desktop.png",
  ]) {
    const b = readFileSync(file);
    assert.equal(b.readUInt32BE(0), 0x89504e47);
    assert.ok(b.readUInt32BE(16) > 0);
  }
  assert.ok(!config.includes("navigateFallbackDenylist"));
});
