# forex-cli

An interactive command-line currency converter using the latest daily exchange
rates from the [Frankfurter API](https://frankfurter.dev).

## Requirements

- Node.js 20.17+, 22.13+, or 23.5+
- An internet connection when converting currencies

## Install

The package is not currently published to npm. Install it directly from GitHub:

```sh
npm install --global github:rahilsh/forex-cli
```

Then run:

```sh
forex
```

### New Mac Setup

1. Install Node.js 22 LTS from [nodejs.org](https://nodejs.org).
2. Open Terminal and verify the installation:

```sh
node --version
npm --version
```

3. Install forex-cli directly from GitHub:

```sh
npm install --global github:rahilsh/forex-cli
```

4. Run the CLI:

```sh
forex
```

An internet connection is required to fetch exchange rates.

To install a local clone instead:

```sh
git clone https://github.com/rahilsh/forex-cli.git
cd forex-cli
npm install --global .
```

## Currencies

USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SAR, AED, HKD, SGD, NZD,
KRW, SEK, NOK, MXN, BRL, ZAR, TRY, MYR, THB, PHP, IDR, ILS, PLN, CZK,
DKK, HUF

Rates are daily reference rates rather than real-time market quotes. Each result
includes the rate date supplied by Frankfurter.

## Development

```sh
npm install
npm run check
node src/index.js
```

`npm run check` runs ESLint and the automated test suite.
