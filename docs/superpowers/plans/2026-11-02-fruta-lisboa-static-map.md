# Fruta Lisboa — Plan A: Static Season Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first, installable website showing Lisbon's edible fruit trees (from the city's open data) and highlighting which are in season right now.

**Architecture:** A build-time script pulls the city's Arvoredo FeatureServer, keeps only curated edible species, and writes `static/trees.geojson`. The SvelteKit app is fully static (adapter-static, `ssr=false`). It loads that file, works out each tree's season status in the browser for the current Lisbon month, and draws it with MapLibre GeoJSON clustering. There is no backend in Plan A. Plan B (Supabase community layer + deploy) builds on the `Report`/`seasonStatus` interfaces defined here.

**Tech Stack:** SvelteKit 2.x (`@sveltejs/kit@^2.70`), Svelte 5 (runes), Vite 7, TypeScript, `@sveltejs/adapter-static@^3`, `maplibre-gl@^5` (v5 or 6, whichever installs cleanly with Vite 7), OpenFreeMap tiles, Vitest, Playwright. Node 25 (runs `.ts` scripts natively).

**Spec:** `docs/superpowers/specs/2026-11-02-fruta-lisboa-design.md` (Phases 1–4).

## Global Constraints

- Source data: `https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services/Ambiente_DMEVAE/FeatureServer/0`, fields `COD_SIG_NEW, MORADA, ESPECIE_VA, NOME_VULGA, FREG_2012, GlobalID`, licence CC0. Credit "Câmara Municipal de Lisboa — Dados Abertos" in the UI.
- Never show toxic or ornamental species as fruit (Celtis, Pyrus calleryana, all Prunus cerasifera, P. serrulata, P. laurocerasus, P. lusitanica, P. avium plena, Phoenix canariensis/reclinata/sylvestris/sp., Morus 'Fruitless', Corylus colurna, Nerium, Taxus, Phytolacca, Persea indica).
- Two tiers: `eat` ("Colher e comer" / "Pick & eat") and `prep` ("Precisa de preparação" / "Needs prep").
- Season is always labelled as an estimate ("Estimativa" / "Estimate").
- Months are computed in the `Europe/Lisbon` timezone.
- PT is the default language, EN is the toggle, and the choice persists in localStorage (wrapped in try/catch).
- Phone-first: usable at 360px width, and all controls work by touch.
- Etiquette note visible on every tree sheet: PT "Colha só o que precisa, não parta ramos, não entre em propriedade privada." / EN "Pick only what you need, don't break branches, never enter private property."
- Working name: "Fruta Lisboa".

## Review Focus

1. Messy species strings from the city (double spaces, quotes, typos like `Prunus amigdalus`, `NULL`) should be normalised and matched, or skipped without crashing. → Task 1 tests.
2. Seasons that wrap past the new year (olive Oct–Jan, orange Dec–Apr) should be in season in January, and "soon" in December must look at January. → Task 2 tests.
3. Device clock near midnight or in another timezone: the month must be Lisbon's month, not the device's or UTC's. → Task 2 test.
4. Geolocation denied, or the user is outside Lisbon: the map stays on Lisbon with no error shown. → Task 6 e2e test.
5. City features with null or invalid geometry, or coordinates outside the Lisbon bbox, are dropped, and paging past 2000 records gets everything. → Task 3 tests.

---

### Task 1: Scaffold + curated species list + species matcher

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.d.ts`, `src/routes/+layout.ts`, `src/routes/+page.svelte` (placeholder), `.gitignore`, `.npmrc` (`engine-strict=false`)
- Create: `src/lib/types.ts`, `src/lib/species.ts`, `data/species.json`
- Test: `src/lib/species.test.ts`

**Interfaces:**
- Produces (`src/lib/types.ts`):
  ```ts
  export type Tier = 'eat' | 'prep' | 'excluded';
  export interface Species { id: string; match: string[]; tier: Tier; name_pt: string; name_en: string;
    ripe: number[]; peak: number[]; color: string; emoji: string; note_pt: string; note_en: string; }
  export interface TreeProps { id: string; species: string; address: string | null; parish: string | null; source: 'city' | 'community'; }
  export type ReportKind = 'ripe' | 'unripe' | 'picked' | 'gone' | 'wrong_species';
  export interface Report { kind: ReportKind; at: string } // ISO timestamp
  export type Status = 'ripe' | 'in_season' | 'picked' | 'soon' | 'out';
  ```
- Produces (`src/lib/species.ts`): `normalizeName(s: string): string` (lowercase, trim, collapse whitespace, strip `'"` quotes); `matchSpecies(scientific: string | null | undefined, list: Species[]): Species | null`, which picks the **longest** `match` prefix that the normalised name starts with (so `morus alba var. fruitless` beats `morus alba`); `SPECIES: Species[]` (typed import of `data/species.json`); `speciesById(id: string): Species | undefined`.

- [ ] **Step 1: Scaffold.** Create a minimal SvelteKit 2 + TS project by hand (do not use `sv create`, which pulls Kit 3). Install deps: `@sveltejs/kit@^2.70 @sveltejs/adapter-static@^3 @sveltejs/vite-plugin-svelte svelte@^5 vite@^7 typescript vitest @playwright/test maplibre-gl`. Use adapter-static with `fallback: 'index.html'`. `+layout.ts` exports `prerender = true; ssr = false`. Scripts: `dev`, `build`, `preview`, `test` (`vitest run`), `e2e` (`playwright test`), `import` (`node scripts/import-city.ts`), `check` (`svelte-check`). Vitest `include: ['src/**/*.test.ts', 'scripts/**/*.test.ts']`.
- [ ] **Step 2: Write `data/species.json`.** Use exactly these entries (`ripe` lists months 1–12; set `peak` to the middle 1–2 months of `ripe`). Pick distinct colours and an emoji per fruit. Write short PT/EN notes, and say "needs curing"/"marmalade" etc. for `prep`.

  | id | tier | match prefixes (normalised) | name_pt / name_en | ripe |
  |---|---|---|---|---|
  | orange | eat | `citrus sinensis` | Laranja / Orange | 12,1,2,3,4 |
  | mandarin | eat | `citrus reticulata` | Tangerina / Mandarin | 11,12,1,2 |
  | citrus | eat | `citrus sp` | Citrinos / Citrus | 12,1,2,3,4 |
  | bitter_orange | prep | `citrus x aurantium`, `citrus aurantium` | Laranja-amarga / Bitter orange | 1,2,3 |
  | lemon | prep | `citrus limon` | Limão / Lemon | 1–12 |
  | loquat | eat | `eriobotrya` | Nêspera / Loquat | 4,5,6 |
  | fig | eat | `ficus carica` | Figo / Fig | 6,7,8,9 |
  | mulberry | eat | `morus` | Amora / Mulberry | 5,6,7 |
  | pomegranate | eat | `punica granatum` | Romã / Pomegranate | 9,10,11 |
  | plum | eat | `prunus domestica`, `prunus spinosa` | Ameixa / Plum | 6,7,8 |
  | apricot | eat | `prunus armeniaca` | Damasco / Apricot | 6,7 |
  | peach | eat | `prunus persica` | Pêssego / Peach | 6,7,8,9 |
  | cherry | eat | `prunus avium`, `prunus cerasus` | Cereja / Cherry | 5,6 |
  | almond | eat | `prunus dulcis`, `prunus amigdalus`, `prunus amygdalus` | Amêndoa / Almond | 8,9 |
  | apple | eat | `malus` | Maçã / Apple | 8,9,10 |
  | pear | eat | `pyrus communis` | Pera / Pear | 7,8,9 |
  | quince | eat | `cydonia oblonga` | Marmelo / Quince | 9,10 |
  | persimmon | eat | `diospyros kaki` | Dióspiro / Persimmon | 10,11,12 |
  | avocado | eat | `persea americana` | Abacate / Avocado | 11,12,1,2,3,4 |
  | strawberry_tree | eat | `arbutus unedo` | Medronho / Strawberry tree | 10,11,12 |
  | feijoa | eat | `acca sellowiana`, `feijoa` | Feijoa / Feijoa | 10,11,12 |
  | guava | eat | `psidium guajava` | Goiaba / Guava | 9,10,11 |
  | cherimoya | eat | `annona` | Anona / Cherimoya | 11,12,1,2,3 |
  | mango | eat | `mangifera indica` | Manga / Mango | 8,9,10 |
  | grape | eat | `vitis vinifera` | Uva / Grape | 8,9 |
  | walnut | eat | `juglans` | Noz / Walnut | 9,10 |
  | chestnut | eat | `castanea sativa` | Castanha / Chestnut | 10,11 |
  | hazelnut | eat | `corylus avellana` | Avelã / Hazelnut | 8,9 |
  | olive | prep | `olea` | Azeitona / Olive | 10,11,12,1 |
  | carob | prep | `ceratonia siliqua` | Alfarroba / Carob | 8,9,10 |
  | pine_nut | prep | `pinus pinea` | Pinhão / Pine nut | 11,12,1,2,3 |
  | date | prep | `phoenix dactylifera` | Tâmara / Date | 9,10,11 |
  | x_excluded | excluded | `celtis`, `pyrus calleryana`, `pyrus sp`, `prunus cerasifera`, `prunus serrulata`, `prunus laurocerasus`, `prunus lusitanica`, `prunus avium plena`, `prunus sp`, `phoenix canariensis`, `phoenix reclinata`, `phoenix sylvestris`, `phoenix sp`, `morus alba var. fruitless`, `corylus colurna`, `nerium`, `taxus`, `phytolacca`, `persea indica` | — | [] |

- [ ] **Step 3: Write the failing tests** in `src/lib/species.test.ts`:
  ```ts
  test('matches basic and messy names', () => {
    expect(matchSpecies('Ficus carica', SPECIES)?.id).toBe('fig');
    expect(matchSpecies('Prunus domestica  subsp. insititia', SPECIES)?.id).toBe('plum');
    expect(matchSpecies('Prunus amigdalus', SPECIES)?.id).toBe('almond');
    expect(matchSpecies("Punica granatum 'Nana'", SPECIES)?.id).toBe('pomegranate');
    expect(matchSpecies('Citrus x aurantium', SPECIES)?.id).toBe('bitter_orange');
  });
  test('longest prefix wins for ornamentals', () => {
    expect(matchSpecies("Morus alba var. 'Fruitless'", SPECIES)?.tier).toBe('excluded');
    expect(matchSpecies('Morus alba', SPECIES)?.id).toBe('mulberry');
    expect(matchSpecies('Prunus avium plena', SPECIES)?.tier).toBe('excluded');
    expect(matchSpecies('Prunus avium', SPECIES)?.id).toBe('cherry');
  });
  test('excluded/toxic never edible', () => {
    for (const n of ['Celtis australis', 'Nerium oleander', 'Taxus baccata', 'Pyrus calleryana var. Chanticleer',
      'Prunus cerasifera subsp. pissardii', 'Phoenix canariensis', 'Corylus colurna', 'Persea indica'])
      expect(matchSpecies(n, SPECIES)?.tier ?? 'excluded').toBe('excluded');
  });
  test('null/unknown → null', () => {
    expect(matchSpecies(null, SPECIES)).toBeNull();
    expect(matchSpecies('NULL', SPECIES)).toBeNull();
    expect(matchSpecies('Platanus x hispanica', SPECIES)).toBeNull();
  });
  test('species data is valid', () => {
    for (const s of SPECIES.filter(s => s.tier !== 'excluded')) {
      expect(s.ripe.length).toBeGreaterThan(0);
      expect(s.ripe.every(m => m >= 1 && m <= 12)).toBe(true);
      expect(s.peak.every(m => s.ripe.includes(m))).toBe(true);
    }
    expect(new Set(SPECIES.map(s => s.id)).size).toBe(SPECIES.length);
  });
  ```
  Also test `normalizeName('  Prunus   Avium ') === 'prunus avium'`.
- [ ] **Step 4:** Run `npx vitest run src/lib/species.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 5:** Implement `src/lib/types.ts` and `src/lib/species.ts` as specified in Interfaces.
- [ ] **Step 6:** Run `npx vitest run` → PASS, then `npm run build` → succeeds.
- [ ] **Step 7: Commit** `feat: scaffold SvelteKit app and curated species list`.

---

### Task 2: Season logic

**Files:**
- Create: `src/lib/season.ts`
- Test: `src/lib/season.test.ts`

**Interfaces:**
- Consumes: `Species`, `Report`, `Status` from Task 1.
- Produces: `lisbonMonth(d: Date): number` (1–12, via `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', month: 'numeric' })`); `inMonths(months: number[], m: number): boolean`; `seasonStatus(sp: Species, now: Date, latest?: Report | null): Status`; `REPORT_TTL_DAYS = 14`; `isPickable(s: Status): boolean` (true for `ripe`, `in_season`).

Rules for `seasonStatus`. First, if `latest` is within 14 days of `now`: `ripe` gives `'ripe'`, and `picked` or `unripe` give `'picked'` (`gone`/`wrong_species` are ignored here; Plan B hides those). Otherwise, using the calendar with m = lisbonMonth(now): if m is in `ripe` the result is `'in_season'`; if `(m % 12) + 1` is in `ripe` it is `'soon'`; otherwise it is `'out'`.

- [ ] **Step 1: Write the failing tests:**
  ```ts
  const olive = speciesById('olive')!, fig = speciesById('fig')!, orange = speciesById('orange')!, loquat = speciesById('loquat')!;
  test('calendar', () => {
    expect(seasonStatus(fig, new Date('2026-08-10T12:00Z'))).toBe('in_season');
    expect(seasonStatus(fig, new Date('2026-11-15T12:00Z'))).toBe('out');
    expect(seasonStatus(loquat, new Date('2026-03-15T12:00Z'))).toBe('soon');
  });
  test('wraps across new year', () => {
    expect(seasonStatus(olive, new Date('2027-01-10T12:00Z'))).toBe('in_season');
    expect(seasonStatus(orange, new Date('2026-11-20T12:00Z'))).toBe('soon');
    expect(seasonStatus(orange, new Date('2027-01-20T12:00Z'))).toBe('in_season');
  });
  test('uses Lisbon month, not UTC', () => {
    expect(lisbonMonth(new Date('2026-07-31T23:30:00Z'))).toBe(8); // Lisbon is UTC+1 in summer
    expect(lisbonMonth(new Date('2026-12-31T23:30:00Z'))).toBe(12); // UTC+0 in winter
  });
  test('fresh reports override calendar; stale ones do not', () => {
    const now = new Date('2026-11-15T12:00Z');
    expect(seasonStatus(fig, now, { kind: 'ripe', at: '2026-11-10T09:00Z' })).toBe('ripe');
    expect(seasonStatus(olive, now, { kind: 'picked', at: '2026-11-14T09:00Z' })).toBe('picked');
    expect(seasonStatus(olive, now, { kind: 'picked', at: '2026-10-01T09:00Z' })).toBe('in_season');
    expect(seasonStatus(olive, now, { kind: 'gone', at: '2026-11-14T09:00Z' })).toBe('in_season');
  });
  test('isPickable', () => { expect(isPickable('ripe') && isPickable('in_season') && !isPickable('soon')).toBe(true); });
  ```
- [ ] **Step 2:** Run `npx vitest run src/lib/season.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `src/lib/season.ts` per Interfaces.
- [ ] **Step 4:** Run `npx vitest run` → all PASS.
- [ ] **Step 5: Commit** `feat: season status with Lisbon month and report override`.

---

### Task 3: City data import → `static/trees.geojson`

**Files:**
- Create: `scripts/import-lib.ts`, `scripts/import-city.ts`
- Test: `scripts/import-lib.test.ts`
- Generated + committed: `static/trees.geojson`, `static/meta.json`

**Interfaces:**
- Consumes: `matchSpecies`, `SPECIES`, `TreeProps` (import via relative paths `../src/lib/...`; Node 25 strips types, so use `.ts` extensions in imports and set `allowImportingTsExtensions` + `noEmit` in tsconfig).
- Produces:
  - `interface ArcFeature { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] } | null; properties: Record<string, unknown> }`
  - `LISBON_BBOX = [-9.235, 38.69, -9.085, 38.80] as const` (minLon, minLat, maxLon, maxLat)
  - `toTreeFeature(f: ArcFeature, list: Species[]): GeoJSON.Feature<GeoJSON.Point, TreeProps> | null`. Drops null/non-finite geometry, out-of-bbox points, and unmatched or `excluded` species. `id` = `COD_SIG_NEW ?? GlobalID`. Coordinates are rounded to 6 decimals. `address` = `MORADA`, `parish` = `FREG_2012` (the string `'NULL'` or empty → `null`). `source: 'city'`.
  - `fetchAllCity(fetchFn: typeof fetch, pageSize = 2000): Promise<ArcFeature[]>` loops `query?where=1%3D1&outFields=COD_SIG_NEW,MORADA,ESPECIE_VA,FREG_2012,GlobalID&outSR=4326&f=geojson&orderByFields=OBJECTID&resultOffset=N&resultRecordCount=pageSize` until a page returns fewer than `pageSize` features and `exceededTransferLimit` is not true. Throws on non-OK HTTP.
  - `summarize(features): { generated_at: string; count: number; by_species: Record<string, number> }`
- `scripts/import-city.ts` (CLI) fetches, maps, writes a `FeatureCollection` to `static/trees.geojson` (compact JSON) and the summary to `static/meta.json`, and logs the count. If the result has fewer than 500 trees it exits non-zero without overwriting (protects against an API outage).

- [ ] **Step 1: Write the failing tests** (all with fixtures, no network):
  ```ts
  const f = (sp: unknown, coords: [number, number] | null, extra = {}) => ({ type: 'Feature', geometry: coords && { type: 'Point', coordinates: coords },
    properties: { COD_SIG_NEW: 'A1', ESPECIE_VA: sp, MORADA: 'Rua X', FREG_2012: 'Arroios', GlobalID: 'g', ...extra } }) as ArcFeature;
  test('keeps edible in Lisbon', () => {
    const t = toTreeFeature(f('Ficus carica', [-9.1401234567, 38.7223456789]), SPECIES)!;
    expect(t.properties).toEqual({ id: 'A1', species: 'fig', address: 'Rua X', parish: 'Arroios', source: 'city' });
    expect(t.geometry.coordinates).toEqual([-9.140123, 38.722346]);
  });
  test('drops excluded, unknown, null species, bad geometry, outside bbox', () => {
    expect(toTreeFeature(f('Celtis australis', [-9.14, 38.72]), SPECIES)).toBeNull();
    expect(toTreeFeature(f(null, [-9.14, 38.72]), SPECIES)).toBeNull();
    expect(toTreeFeature(f('Ficus carica', null), SPECIES)).toBeNull();
    expect(toTreeFeature(f('Ficus carica', [NaN, 38.72]), SPECIES)).toBeNull();
    expect(toTreeFeature(f('Ficus carica', [-8.61, 41.15]), SPECIES)).toBeNull(); // Porto
  });
  test('falls back to GlobalID and nulls "NULL" strings', () => {
    const t = toTreeFeature(f('Ficus carica', [-9.14, 38.72], { COD_SIG_NEW: null, FREG_2012: 'NULL' }), SPECIES)!;
    expect(t.properties.id).toBe('g'); expect(t.properties.parish).toBeNull();
  });
  test('pages until short page', async () => {
    const pages = [Array(2000).fill(0), Array(2000).fill(0), Array(5).fill(0)];
    const calls: string[] = [];
    const fake = (async (url: string) => { calls.push(url); const p = pages[calls.length - 1];
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: p.map(() => f('Ficus carica', [-9.14, 38.72])) })); }) as typeof fetch;
    expect((await fetchAllCity(fake)).length).toBe(4005);
    expect(calls[2]).toContain('resultOffset=4000');
  });
  test('throws on HTTP error', async () => {
    await expect(fetchAllCity((async () => new Response('x', { status: 500 })) as typeof fetch)).rejects.toThrow();
  });
  ```
- [ ] **Step 2:** Run `npx vitest run scripts` → FAIL.
- [ ] **Step 3:** Implement `scripts/import-lib.ts` and `scripts/import-city.ts`.
- [ ] **Step 4:** Run `npx vitest run` → PASS.
- [ ] **Step 5:** Run `npm run import` against the live API. Expected: it logs a count of roughly 2,500–4,500. Check `static/meta.json`: `by_species` has no excluded ids, and does include `olive`, `bitter_orange`, `loquat`, `fig`, `mulberry`, `pomegranate`, `pine_nut`. File size under 1.5 MB.
- [ ] **Step 6: Commit** `feat: import Lisbon open-data fruit trees` (including the generated files).

---

### Task 4: i18n + app state

**Files:**
- Create: `src/lib/i18n/pt.json`, `src/lib/i18n/en.json`, `src/lib/i18n/index.svelte.ts`, `src/lib/state.svelte.ts`
- Test: `src/lib/i18n/i18n.test.ts`

**Interfaces:**
- Produces:
  - `i18n.lang: 'pt' | 'en'` (a rune-backed object), `setLang(l)`, `t(key: string, vars?: Record<string, string | number>): string` (`{name}` interpolation; a missing key returns the key), `speciesName(s: Species): string`, `speciesNote(s: Species): string`, `monthShort(m: number): string` (from `Intl`, in the current lang).
  - `app` (in `state.svelte.ts`): `{ onlyPickable: boolean (default true); selectedSpecies: string | null; selectedTreeId: string | null; aboutOpen: boolean }`.
  - Keys used by later tasks (must exist in both files): `app.title, app.estimate, filter.onlyPickable, filter.all, panel.title, panel.empty, panel.soon, tier.eat, tier.prep, status.ripe, status.in_season, status.picked, status.soon, status.out, sheet.directions, sheet.etiquette, sheet.months, sheet.parish, locate, lang.toggle, about.title, about.body, about.credit, about.close`.
- [ ] **Step 1: Failing tests:** both JSON files have identical key sets; `t('status.ripe')` differs between pt and en; `t('nope')==='nope'`; interpolation `t('panel.soon', {n: 3})` contains `3`; `setLang` survives `localStorage` throwing (stub `globalThis.localStorage` with a throwing getter).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (PT default; read the saved lang in try/catch). **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `feat: PT/EN strings and app state`.

---

### Task 5: Map with season-coloured, clustered trees

**Files:**
- Create: `src/lib/map/enrich.ts`, `src/lib/map/MapView.svelte`
- Modify: `src/routes/+page.svelte`
- Test: `src/lib/map/enrich.test.ts`

**Interfaces:**
- Consumes: `seasonStatus`, `isPickable`, `speciesById`, `app`, `t`.
- Produces:
  - `enrich(fc: FeatureCollection<Point, TreeProps>, now: Date): FeatureCollection<Point, TreeProps & { status: Status; color: string; pickable: boolean }>`. `color` is the species colour when pickable, otherwise `#9ca3af`.
  - `matchesFilter(props: { species: string; pickable: boolean }, onlyPickable: boolean, speciesId: string | null): boolean`, the JS predicate used to pre-filter features before `setData` (cluster counts ignore layer filters, so filtering happens in JS).
  - `MapView.svelte` props: `{ trees: enriched FC; onBounds: (b: [number, number, number, number]) => void }`. Style: `https://tiles.openfreemap.org/styles/positron`. Initial view fits `LISBON_BBOX` (import from a shared `src/lib/geo.ts`; move the constant there and re-export from `scripts/import-lib.ts`). `maxBounds` is the bbox padded by 0.05°. The GeoJSON source has `cluster: true, clusterRadius: 40, clusterMaxZoom: 15`. Layers: cluster circle + count, unclustered circle (`circle-color: ['get','color']`, white stroke, radius 7 → 10 at z17). Re-run `source.setData(features.filter(matchesFilter…))` when `app.onlyPickable`/`app.selectedSpecies` change. Click on a cluster → `getClusterExpansionZoom` + easeTo. Click on a tree → `app.selectedTreeId = id`. Add a `GeolocateControl`; on load, if `navigator.permissions.query({name:'geolocation'})` is `granted` and the position is inside `LISBON_BBOX`, trigger it so the map centres on the user (otherwise stay on the Lisbon view, silently). Add and attribution "© Câmara Municipal de Lisboa (CC0) · OpenFreeMap © OpenStreetMap". Emit `onBounds` on `load` and `moveend`.
  - `+page.svelte` fetches `/trees.geojson` once, runs `enrich(fc, new Date())`, and holds `bounds` state.
- [ ] **Step 1: Failing tests** for `enrich` and `matchesFilter`. With `now = 2026-11-15`, a fig gets `status 'out'`, `pickable false`, colour grey; a persimmon gets `'in_season'`, `pickable true`, its species colour. `matchesFilter({species:'fig', pickable:false}, true, null) === false`; `matchesFilter({species:'fig', pickable:false}, false, 'fig') === true`; `matchesFilter({species:'olive', pickable:true}, true, 'fig') === false`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `enrich.ts`, `geo.ts`, `MapView.svelte`, `+page.svelte`. **Step 4:** Run `npx vitest run` → PASS. Run `npm run dev` and check visually: coloured dots cover Lisbon and clusters split on zoom.
- [ ] **Step 5: Commit** `feat: MapLibre map with in-season trees`.

---

### Task 6: Season panel, tree sheet, controls + e2e

**Files:**
- Create: `src/lib/counts.ts`, `src/lib/ui/SeasonPanel.svelte`, `src/lib/ui/TreeSheet.svelte`, `src/lib/ui/MonthsBar.svelte`, `src/lib/ui/TopBar.svelte`
- Modify: `src/routes/+page.svelte`
- Test: `src/lib/counts.test.ts`, `e2e/map.spec.ts`, `playwright.config.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `countInBounds(features, bounds: [w,s,e,n]): { pickable: { species: string; count: number }[]; soon: { species: string; count: number }[] }`. Both lists are sorted by count descending. `soon` holds features with status `'soon'`.
  - `TopBar`: title, "Estimativa" badge, a `onlyPickable` toggle (`data-testid="toggle-pickable"`), and a PT/EN toggle (`data-testid="lang"`).
  - `SeasonPanel`: a bottom sheet on phones and a left sidebar at ≥768px (`data-testid="season-panel"`). Each fruit row (`data-testid="fruit-{id}"`) shows emoji, name, tier badge and count. Tapping a row toggles `app.selectedSpecies`. A "Em breve / Coming soon" sub-list shows `soon`. If there are no pickable fruits, show `panel.empty`.
  - `TreeSheet` (`data-testid="tree-sheet"`): name, scientific `match[0]` in italics, tier, status, `MonthsBar` (12 cells; ripe months filled, peak months darker, current month outlined), address, parish, species note, etiquette text, and a directions link `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` (`target=_blank rel=noopener`). Closes on Escape, swipe-down or the ✕ button.
  - Design: use the frontend-design skill for visual direction (warm, legible, outdoor-readable; avoid generic templates).
- [ ] **Step 1: Failing unit tests** for `countInBounds`: features in and out of bounds; sort order; `soon` separation.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `counts.ts` → PASS.
- [ ] **Step 4: Write the e2e tests** (`playwright.config.ts` uses `webServer: npm run build && npm run preview`, a mobile viewport 390×844, and the `Europe/Lisbon` timezone):
  ```ts
  test.beforeEach(async ({ page, context }) => {
    await context.clearPermissions(); // geolocation denied by default
    await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'));
  });
  test('November shows persimmon/pomegranate/olive, not fig', async ({ page }) => {
    await page.goto('/');
    const panel = page.getByTestId('season-panel');
    await expect(panel.getByTestId('fruit-pomegranate')).toBeVisible();
    await expect(panel.getByTestId('fruit-olive')).toBeVisible();
    await expect(panel.getByTestId('fruit-fig')).toHaveCount(0);
  });
  test('language toggle', async ({ page }) => {
    await page.goto('/'); await expect(page.getByText('Estimativa')).toBeVisible();
    await page.getByTestId('lang').click(); await expect(page.getByText('Estimate')).toBeVisible();
    await page.reload(); await expect(page.getByText('Estimate')).toBeVisible();
  });
  test('geolocation denied keeps Lisbon and no error', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('/'); await page.getByRole('button', { name: /localiza|locate|find my location/i }).click();
    await expect(page.getByTestId('season-panel')).toBeVisible(); expect(errors).toEqual([]);
  });
  test('tapping a fruit row filters, tree sheet opens', async ({ page }) => {
    await page.goto('/'); await page.getByTestId('fruit-olive').click();
    await expect(page.getByTestId('fruit-olive')).toHaveAttribute('aria-pressed', 'true');
    // open the sheet for a known tree via the test hook
    await page.evaluate(() => (window as any).__openFirstTree?.());
    await expect(page.getByTestId('tree-sheet')).toContainText(/Colha só o que precisa/);
  });
  ```
  Expose `window.__openFirstTree` only when `import.meta.env.MODE !== 'production'` or `?e2e=1` is in the URL (use `?e2e=1` in the test's `goto`).
- [ ] **Step 5:** Run `npx playwright install chromium && npm run e2e` → FAIL. **Step 6:** Implement the components, wire them in `+page.svelte` (counts recompute on `bounds`/`onlyPickable` change), and use frontend-design. **Step 7:** Run `npm test && npm run e2e && npm run check` → all PASS.
- [ ] **Step 8: Commit** `feat: season panel, tree sheet, language toggle`.

---

### Task 7: Installable PWA + About/etiquette page

**Files:**
- Create: `static/manifest.webmanifest`, `static/icons/icon-192.png`, `static/icons/icon-512.png`, `static/icons/maskable-512.png`, `src/service-worker.ts`, `src/lib/ui/About.svelte`, `README.md`
- Modify: `src/app.html` (manifest link, theme-color, apple-touch-icon), `src/lib/ui/TopBar.svelte` (ⓘ button opens About)
- Test: `e2e/pwa.spec.ts`

**Interfaces:**
- The service worker uses the SvelteKit `$service-worker` module. It pre-caches `build` + `files` (including `trees.geojson`) under cache `fruta-${version}`. Map tiles get stale-while-revalidate with a 300-entry cap. Old caches are cleaned up on `activate`.
- About (`data-testid="about"`) contains: what the app is; that seasons are estimates; the etiquette rules; the credits — "Dados: Câmara Municipal de Lisboa — Dados Abertos (CC0)", links to Falling Fruit (`https://fallingfruit.org`) and Muita Fruta; and the data date from `/meta.json` (`generated_at`).
- Icons: generate simple fruit-mark PNGs with a script or by hand (sharp or an SVG→PNG via Playwright screenshot are both fine).
- [ ] **Step 1: Failing e2e test:** `/manifest.webmanifest` returns JSON with `name: 'Fruta Lisboa'`, `display: 'standalone'`, and 192/512 icons; after load, `navigator.serviceWorker.ready` resolves; the About dialog shows "CC0" and a date.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run `npm test && npm run e2e && npm run build` → PASS. Do a manual check on a phone over LAN (`npm run preview -- --host`): the "Add to Home Screen" prompt appears and the app works offline after the first load (tiles may be missing).
- [ ] **Step 5:** In `README.md`, cover: what it is, `npm run import` to refresh the data, dev/test commands, the data licence, and that Plan B (community features) is next.
- [ ] **Step 6: Commit** `feat: installable PWA and about page`.

---

## Next: Plan B (written after Plan A ships)
Supabase schema (PostGIS, `tree_status` view, flags auto-hide), Edge Functions `add-tree`/`report`/`flag` with `client_hash` + rate limits, add-tree/report UI, import writing to the DB, Cloudflare Pages deploy, monthly import GitHub Action, and the privacy note. It reuses `Report`, `seasonStatus`, `toTreeFeature` and `LISBON_BBOX` from this plan.
