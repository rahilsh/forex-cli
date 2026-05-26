#!/usr/bin/env node

const inquirer = require("inquirer");

const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY",
  "INR", "SAR", "AED", "HKD", "SGD", "NZD", "KRW", "SEK",
  "NOK", "MXN", "BRL", "ZAR", "TRY", "MYR", "THB", "PHP",
  "IDR", "ILS", "PLN", "CZK", "DKK", "HUF"
];

const API_BASE = "https://api.frankfurter.dev/v2";

async function run() {
  console.log("Forex");

  const { from, to, amount } = await askQuestions();

  console.log(`Fetching rate for ${from} → ${to}...`);
  const rate = await fetchRate(from, to);

  const value = (rate * amount).toFixed(2);
  console.log(`${amount} ${from} = ${value} ${to} (rate: ${rate})`);
}

function askQuestions() {
  const questions = [
    {
      name: "from",
      type: "list",
      message: "From:",
      choices: CURRENCIES,
    },
    {
      name: "to",
      type: "list",
      message: "To:",
      choices: CURRENCIES,
    },
    {
      name: "amount",
      type: "text",
      message: "Amount:",
      validate: (value) => {
        const n = parseFloat(value);
        if (isNaN(n) || n <= 0) return "Enter a positive number";
        return true;
      },
    },
  ];

  return inquirer.prompt(questions);
}

async function fetchRate(from, to) {
  const url = `${API_BASE}/rate/${from}/${to}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.rate;
}

run();
