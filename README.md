# Fruta da Rua

A community map of Lisbon's fruit trees that shows what's in season right now. Open it on your phone while you're out: search for a fruit or tap one of the chips, and the map shows the trees with fruit to pick this month, each with its harvest months, a picking tip and directions.

**Live:** https://fruta-da-rua.lixo.dev · Made in Europe · Free and open source (MIT)

> **Em português:** a Fruta da Rua é um mapa comunitário das árvores de fruto de Lisboa que mostra o que está na época. É software livre: qualquer pessoa pode usar, estudar, melhorar e partilhar. Contribuições em português são bem-vindas.

## Where the data comes from

The trees come from the city's open tree inventory ([Arvoredo, Câmara Municipal de Lisboa, Dados Abertos](https://dadosabertos.cm-lisboa.pt/dataset/arvoredo), CC0), filtered to species worth picking. Seasons are estimates for Lisbon's climate. Fruit whose collection is forbidden by law (stone pine cones, DL 77/2015) is never shown, and the app reminds people that Lisbon forbids climbing and beating public trees (Regulamento Municipal do Arvoredo, art. 9.º).

## Run it locally

You need Node.js 22 or newer.

```sh
npm install
npm run dev -- --port 8080          # http://localhost:8080
npm run dev -- --port 8080 --host   # also reachable from your phone on the same Wi-Fi
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run preview` | Static production build in `build/` and a local preview of it |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | Browser tests with accessibility checks (Playwright; run `npx playwright install chromium` once) |
| `npm run check` | Type check |
| `npm run import` | Refresh `static/trees.json` from the city's live data |

## How it works

- `data/species.json` is the curated list: which species count as fruit (`eat` or `prep`), their harvest months, colours and notes. Ornamental, toxic and protected species are listed under `x_excluded` so they never show.
- `scripts/import-city.ts` pages through the city FeatureServer, keeps edible species inside Lisbon and writes `static/trees.json` (compact format, see `src/lib/trees-format.ts`) and `static/meta.json`. It refuses to overwrite the data if fewer than 500 trees come back.
- The app is SvelteKit, prerendered to static files, with MapLibre and OpenFreeMap tiles. It works out each tree's status for the current month in Lisbon time, filters on the device and works offline once visited.
- Every fruit has its own page (`/fruta/figo`, `/en/fruit/fig`) listing its trees by parish, so the content is readable without JavaScript and by search engines.

## Contributing

Ideas, bug reports, wrong trees and missing species are all welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support the project

If Fruta da Rua is useful to you, you can [sponsor it on GitHub](https://github.com/sponsors/hmiguel).

## Licence

Code: [MIT](LICENSE). Tree data: Câmara Municipal de Lisboa, CC0. Map: © OpenStreetMap contributors, tiles by OpenFreeMap.
