# Fruta da Rua

A community map of Lisbon's fruit trees that shows what's in season right now. Open it on your phone while you're out: trees with fruit to pick this month are highlighted, and each one comes with its harvest months, a short picking tip and directions.

The trees come from the city's open tree inventory ([Arvoredo, Câmara Municipal de Lisboa — Dados Abertos](https://dadosabertos.cm-lisboa.pt/dataset/arvoredo), CC0), filtered to species that are worth picking. Seasons are estimates for Lisbon's climate.

## Run it locally

```sh
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also reachable from your phone on the same Wi-Fi
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run preview` | Static production build in `build/` and a local preview of it |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | Browser tests (Playwright; run `npx playwright install chromium` once) |
| `npm run check` | Type check |
| `npm run import` | Refresh `static/trees.json` from the city's live data |

## How it works

- `data/species.json` is the curated list: which species count as fruit (`eat` or `prep`), their harvest months, colours and notes. Ornamental and toxic species are listed under `x_excluded` so they never show.
- `scripts/import-city.ts` pages through the city FeatureServer, keeps edible species inside Lisbon and writes `static/trees.json` (compact format, see `src/lib/trees-format.ts`) + `static/meta.json`. It refuses to overwrite the data if fewer than 500 trees come back.
- The app (SvelteKit, static, MapLibre) works out each tree's status for the current month in Lisbon time and clusters the map.

## Next

Plan B adds the community layer — adding missing trees and reporting "ripe / picked / gone" — on Supabase, plus deployment. See `docs/superpowers/specs/`.
