# HealthKernel

## Reports & Analytics prototype

A front-end-only, interactive prototype of HealthKernel's reporting module, built for a management demonstration. **All data is fictional** and generated in the browser — there is no backend, API or real patient data.

### Run it

Requires Node.js 20.19+ or 22.12+ (`node -v` to check; `nvm use` picks up `.nvmrc`).

```bash
git checkout claude/charming-rubin-5t33ww   # the reports module lives on this branch
npm install
npm run dev
# open http://localhost:5173/reports   (the bare http://localhost:5173 opens the pricing page)
```

`npm run build && npm run preview` serves the production build at http://localhost:4173/reports. The existing pricing pages are unchanged at `/pricing`.

### What's included

| Page | Route |
| --- | --- |
| Overview dashboard (KPIs, patient balances, trends, facility comparison, exceptions) | `/reports` |
| All Reports catalogue (238 templates, 23 modules, search & filters) | `/reports/catalogue` |
| Report Builder (period, relevant filters, grouping, summary/detailed) | `/reports/builder` |
| Generated report view (KPIs, charts, summary & detailed tables, CSV, print) | `/reports/view?r=<report-id>` |
| Saved Reports, Report History, Scheduled Reports | `/reports/saved`, `/history`, `/scheduled` |
| Regulatory & Compliance (illustrative templates, simulated workflow) | `/reports/regulatory` |
| Audit Trail | `/reports/audit` |

Only the Reports & Analytics section of the sidebar is interactive; the other HealthKernel menu items are shown for context.

### How it works

- `src/features/reports/data/generate.ts` simulates 12 months (1 Nov 2025 – 27 Oct 2026) of activity across four fictional facilities. Records are linked: visits create lab orders, prescriptions and invoices; dispensing draws down stock, which triggers LPOs and deliveries; HMO invoices become claims whose remittances become payments; admissions occupy beds, which drives the ward census and nursing workload. A fixed seed makes every load identical.
- `engine/sources.ts` defines data sources with columns, dimensions and measures; `engine/catalogue.ts` declares every report; `engine/run.ts` turns a report + configuration into KPIs, trends, breakdowns and tables. The overview uses the same engine, so its numbers match the reports it links to.
- Patient balances: wallet balances (prepaid top-ups spent at the till), admission deposits (applied to the final bill, excess refunded or moved to the wallet) and pay-later credit accounts (charged to credit within a limit, repaid later). Each reconciles with its own ledger and with the invoice and payment records.
- Report configurations live in the URL; saved reports, history, schedules, regulatory returns and the audit trail persist in `localStorage`.

### Limitations

- Demo "today" is fixed at 27 Oct 2026; data volumes are scaled down (≈15k visits a year).
- Scheduling, email delivery and regulatory submissions are simulated. Regulatory templates are illustrative and are **not** official forms.
- Print output shows the current table page; PDF export is not implemented (CSV is).
- No authentication, permissions or subscription gating.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
