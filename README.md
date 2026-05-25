# Daikin Install Cost Estimator

A locally-hosted web application that replicates the Daikin Install Cost Estimator Excel tool for HVAC contractors and Daikin dealers.

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Vite
- localStorage (auto-save, project save/load)
- jsPDF (PDF export)

## Source Spreadsheet

Equipment models, labor/material lookup tables, and calculation rules are aligned with:

`Copy of Daikin-Install-Cost-Estimator-(2026-01-15).xlsm`

VRV catalog rows are generated from that file into `src/data/vrvFromExcel.ts` (regenerate via `scripts/excel-extract.json`).

## Getting Started

```bash
cd daikin-install-estimator
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Features

- **Project Info** — header fields with auto-filled date
- **VRV Equipment** — outdoor units, branch selectors, FCUs, REFNET, refrigerant, controllers
- **Other Equipment** — RTU/DOAS, SkyAir, multi/mini splits, zoning, general line items
- **Piping & Insulation** — footage by size, brazed/ACR/insulation settings, condensate
- **Controls & Wiring** — qty-based labor and materials
- **Summary** — direct costs, subcontractors, misc, markup/gross margin, metrics
- **Admin** — editable labor rates and lookup tables (password: `daikin2026`)

### Extras

- Sticky running total bar
- Auto-save to localStorage
- Save/load multiple projects
- Duplicate project
- Change log
- Bulk model entry (VRV outdoor & indoor)
- PDF export on Summary page
- Print-friendly layout

## Build for Production

```bash
npm run build
npm run preview
```

Works fully offline — no API calls required.
