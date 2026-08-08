#!/usr/bin/env node

import { input, select } from "@inquirer/prompts";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY",
  "INR", "SAR", "AED", "HKD", "SGD", "NZD", "KRW", "SEK",
  "NOK", "MXN", "BRL", "ZAR", "TRY", "MYR", "THB", "PHP",
  "IDR", "ILS", "PLN", "CZK", "DKK", "HUF",
];

const API_BASE = "https://api.frankfurter.dev/v2";
const REQUEST_TIMEOUT_MS = 10_000;

export function parseAmount(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const normalized = String(value).trim();
  if (normalized === "") return null;

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function validateAmount(value) {
  return parseAmount(value) === null ? "Enter a positive number" : true;
}

export async function askQuestions() {
  const from = await select({
    message: "From:",
    choices: CURRENCIES.map((currency) => ({ value: currency })),
  });
  const to = await select({
    message: "To:",
    choices: CURRENCIES.map((currency) => ({ value: currency })),
  });
  const amountInput = await input({
    message: "Amount:",
    validate: validateAmount,
  });

  return { from, to, amount: parseAmount(amountInput) };
}

export async function fetchRate(
  from,
  to,
  { fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS } = {},
) {
  const url = `${API_BASE}/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
  let response;

  try {
    response = await fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      throw new Error(`Exchange-rate request timed out after ${timeoutMs}ms`, {
        cause: error,
      });
    }

    throw new Error("Could not reach the exchange-rate service", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`Exchange-rate service returned HTTP ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error("Exchange-rate service returned invalid JSON", { cause: error });
  }

  if (
    typeof data !== "object"
    || data === null
    || typeof data.rate !== "number"
    || !Number.isFinite(data.rate)
    || data.rate <= 0
    || typeof data.date !== "string"
    || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
  ) {
    throw new Error("Exchange-rate service returned an invalid response");
  }

  return { rate: data.rate, date: data.date };
}

export function formatCurrency(value, currency) {
  const defaults = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).resolvedOptions();
  const isTinyValue = value !== 0 && Math.abs(value) < 0.01;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: defaults.minimumFractionDigits,
    maximumFractionDigits: isTinyValue
      ? Math.max(defaults.maximumFractionDigits, 8)
      : defaults.maximumFractionDigits,
  }).format(value);
}

export function formatRate(rate) {
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 10,
  }).format(rate);
}

export async function run({
  prompt = askQuestions,
  getRate = fetchRate,
  log = console.log,
} = {}) {
  log("Forex");

  const { from, to, amount } = await prompt();
  log(`Fetching latest daily rate for ${from} to ${to}...`);

  const { rate, date } = await getRate(from, to);
  const value = rate * amount;
  log(
    `${formatCurrency(amount, from)} = ${formatCurrency(value, to)} `
    + `(rate: ${formatRate(rate)}, date: ${date})`,
  );
}

export async function main() {
  try {
    await run();
  } catch (error) {
    if (error?.name === "ExitPromptError") {
      console.error("Cancelled.");
      process.exitCode = 130;
      return;
    }

    console.error(`Error: ${error?.message ?? "Unexpected failure"}`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  await main();
}
