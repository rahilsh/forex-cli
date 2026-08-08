import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchRate,
  formatCurrency,
  parseAmount,
  run,
  validateAmount,
} from "../src/index.js";

test("parseAmount accepts complete positive finite numbers", () => {
  assert.equal(parseAmount(" 12.5 "), 12.5);
  assert.equal(parseAmount("1e3"), 1_000);
  assert.equal(validateAmount("0.01"), true);
});

test("parseAmount rejects malformed and non-positive values", () => {
  for (const value of ["", "12abc", "Infinity", "1e309", "0", "-1", null]) {
    assert.equal(parseAmount(value), null);
  }
  assert.equal(validateAmount("12abc"), "Enter a positive number");
});

test("fetchRate returns a validated rate and date", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "https://api.frankfurter.dev/v2/rate/USD/EUR");
    assert.equal(options.headers.accept, "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    return {
      ok: true,
      json: async () => ({ rate: 0.86, date: "2026-08-07" }),
    };
  };

  assert.deepEqual(
    await fetchRate("USD", "EUR", { fetchImpl }),
    { rate: 0.86, date: "2026-08-07" },
  );
});

test("fetchRate rejects HTTP errors", async () => {
  const fetchImpl = async () => ({ ok: false, status: 503 });

  await assert.rejects(
    fetchRate("USD", "EUR", { fetchImpl }),
    /HTTP 503/,
  );
});

test("fetchRate rejects invalid JSON and response data", async () => {
  await assert.rejects(
    fetchRate("USD", "EUR", {
      fetchImpl: async () => ({
        ok: true,
        json: async () => { throw new SyntaxError("bad JSON"); },
      }),
    }),
    /invalid JSON/,
  );

  await assert.rejects(
    fetchRate("USD", "EUR", {
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ rate: "0.86", date: "2026-08-07" }),
      }),
    }),
    /invalid response/,
  );
});

test("fetchRate reports timeouts and network failures", async () => {
  await assert.rejects(
    fetchRate("USD", "EUR", {
      timeoutMs: 25,
      fetchImpl: async () => {
        const error = new Error("aborted");
        error.name = "TimeoutError";
        throw error;
      },
    }),
    /timed out after 25ms/,
  );

  await assert.rejects(
    fetchRate("USD", "EUR", {
      fetchImpl: async () => { throw new Error("offline"); },
    }),
    /Could not reach/,
  );
});

test("formatCurrency keeps useful precision for small conversions", () => {
  const formatted = formatCurrency(0.000061, "USD");
  assert.match(formatted, /USD/);
  assert.match(formatted, /0\.000061/);
  assert.doesNotMatch(formatted, /0\.00$/);
});

test("formatCurrency uses customary precision for ordinary values", () => {
  assert.match(formatCurrency(8.6611, "EUR"), /8\.66$/);
});

test("run completes a conversion with injected boundaries", async () => {
  const output = [];
  await run({
    prompt: async () => ({ from: "USD", to: "EUR", amount: 10 }),
    getRate: async () => ({ rate: 0.86, date: "2026-08-07" }),
    log: (message) => output.push(message),
  });

  assert.deepEqual(output.slice(0, 2), [
    "Forex",
    "Fetching latest daily rate for USD to EUR...",
  ]);
  assert.match(output[2], /USD\s10\.00 = EUR\s8\.60/);
  assert.match(output[2], /date: 2026-08-07/);
});
