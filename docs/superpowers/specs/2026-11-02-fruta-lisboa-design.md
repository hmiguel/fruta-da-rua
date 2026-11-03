# Fruta Lisboa — community map of Lisbon fruit trees in season

## Context

The user wants a community social project: a map of fruit trees in Lisbon showing which ones can be picked **right now**, based on the season. It serves two kinds of people (user's answer: "Both"): someone out walking who opens it on their phone to see what's ripe nearby, and locals who add trees the map is missing and report what they find.

Recon findings that shape the design:
- **Lisbon's open tree inventory** (Arvoredo, CC0) is a live ArcGIS FeatureServer:
  `https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services/Ambiente_DMEVAE/FeatureServer/0`. It has 81,575 trees with fields `COD_SIG_NEW, MORADA, ESPECIE_VA (scientific), NOME_VULGA (common PT), FREG_2012 (parish), LOCAL, TIPOLOGIA, PAP, MANUTENCAO, OCUPACAO, GlobalID`, and was last edited Oct 2026. It supports `f=geojson` and paging.
- About 21k of those trees are fruit-bearing species. Many are **not worth picking**: hackberry *Celtis* (10k), stone pine, ornamental *Pyrus calleryana*, *Prunus cerasifera* 'pissardii', Japanese cherry, oleander (toxic), yew (toxic). Worthwhile ones include bitter orange (388), sweet orange, lemon, mandarin, loquat (~250), fig (164), mulberry (~320), pomegranate (~230), olive, carob, almond, plum, apricot, peach, quince, persimmon, avocado, strawberry tree, walnut, chestnut, date palm, feijoa, guava, cherimoya.
- Prior art: Falling Fruit (global, ~34k Lisbon points) and Muita Fruta (a Lisbon harvesting collective). Our angle is "**what's ripe near me today**", phone-first, seeded with official city data. Partnering with them is left open, and the "about" page credits them.

## Goals
1. Open on a phone → map centred on you → trees **in season now** are bright and grouped by fruit; out-of-season trees are dimmed or hidden (toggle).
2. "What's in season this month" panel: a list of fruits with counts nearby; tapping one filters the map.
3. Tree detail sheet: fruit name (PT/EN), scientific name, address, ripening months bar, recent community reports, "how to pick/etiquette" note, and a directions link.
4. Community, **anonymous and instant** (user's choice): add a missing tree (pin + species + optional note; **no photos in v1**, user's choice); report on any tree ("ripe now", "not ripe yet", "picked clean", "tree gone/wrong species"); flag abuse. No login.
5. Day one is not empty: seeded from the city inventory, filtered to edible species.
6. Bilingual PT/EN with PT as the default, installable as a PWA, and free to run at the start.

## Non-goals (v1)
- User accounts, profiles, gamification, social feed, chat.
- Native iOS/Android apps.
- Harvest event organisation (that's Muita Fruta's domain; link out instead).
- Coverage outside the Lisbon municipality.

## Anti-goals (would be failure even if it works)
- Sending people into private property, or encouraging stripping trees/damaging branches. Every tree needs an etiquette note, and community-added trees get a required "on public ground?" checkbox.
- Showing toxic or non-edible species as "fruit to collect" (oleander, yew, ornamental pear, etc.).
- Showing fruit whose collection is restricted by law (e.g. stone-pine cones, DL 77/2015: forbidden Apr–Nov), or encouraging acts Lisbon's Regulamento Municipal do Arvoredo art. 9.º forbids (climbing, beating branches — *trepar e varejar*).
- A map that looks authoritative but is wrong. Season is an estimate and must say so, and fresh community reports override the calendar.

## How it's built (my calls; user approved the stack)
- **Frontend:** SvelteKit (static adapter / SSR on edge) + MapLibre GL JS, OpenFreeMap or MapTiler free tiles, `vite-plugin-pwa`. i18n via a simple `pt.json`/`en.json`.
- **Backend:** Supabase (Postgres + PostGIS, free tier). The browser reads views with the anon key (RLS: select-only). All writes go through Edge Functions (see Abuse handling).
- **Hosting:** Cloudflare Pages.

### Data model
- `species` (curated, checked into repo as `data/species.json`, seeded to DB): `id, scientific_patterns[], name_pt, name_en, edible bool, worth_picking bool, ripe_months int[] (1–12), peak_months int[], notes_pt, notes_en, emoji/icon, color`.
- `trees`: `id, geom (Point 4326), species_id, source ('city'|'community'), city_id (COD_SIG_NEW/GlobalID), address, parish, public_ground bool, note, created_at, hidden bool`.
- `reports`: `id, tree_id, kind ('ripe'|'unripe'|'picked'|'gone'|'wrong_species'), created_at, client_hash`.
- `flags`: `id, tree_id|report_id, reason, created_at, client_hash`.
- View `tree_status`: per tree → `in_season` (calendar for current Lisbon month) overridden by the latest report within 14 days (ripe → ripe; picked/unripe → not now; gone ×2 → hidden). Auto-hide a community tree after 3 flags from distinct `client_hash`.

### City data import
`scripts/import-city.ts`: page through the FeatureServer (`resultOffset`, 2000/page, `outSR=4326`), match `ESPECIE_VA` against `species.scientific_patterns`, and keep only `edible && worth_picking`. Upsert by `city_id` (idempotent). Run manually and by a monthly GitHub Action. Trees removed from the city data get marked `hidden`, not deleted (so their reports survive).

### Which species count *(my call)*
`worth_picking` = edible raw or with simple home prep. There are two tiers, shown with different badges:
- **Pick & eat**: citrus (sweet), loquat, fig, mulberry, pomegranate, plum, apricot, peach, cherry (*P. avium* only), apple, pear (*P. communis* only), quince, persimmon, avocado, strawberry tree, feijoa, guava, cherimoya, mango, almond, walnut, chestnut, hazel (*C. avellana*).
- **Needs prep**: olive (curing), bitter orange (marmalade), carob (flour), lemon, stone pine (pine nuts; cones are high up, so the note says so), true date palm *Phoenix dactylifera* only.
- **Excluded**: Celtis, ornamental Pyrus calleryana, Prunus cerasifera (all forms), P. serrulata, P. laurocerasus, P. lusitanica, Phoenix canariensis/reclinata/sylvestris, Morus 'Fruitless', Corylus colurna, Nerium, Taxus, Phytolacca.

### Ripening calendar
Hand-curated for Lisbon's climate in `data/species.json`, based on Portuguese horticultural sources. Examples (my estimates, to verify during build): loquat Apr–May, mulberry May–Jul, cherry/apricot May–Jun, plum/peach Jun–Aug, fig Jul–Sep, almond Aug–Sep, carob Aug–Oct, pomegranate Sep–Nov, persimmon Oct–Dec, strawberry tree Oct–Dec, chestnut/walnut Oct–Nov, olive Oct–Jan, sweet orange/mandarin Dec–Apr, bitter orange Jan–Mar (good for marmalade), lemon ~all year, avocado Nov–Apr.

### Abuse handling (since adds are anonymous)
- **All writes go through Supabase Edge Functions** (`add-tree`, `report`, `flag`); the anon role has **no** direct insert on any table (RLS: select-only on views). *(my call)*
- `client_hash` is computed server-side in the Edge Function = SHA-256(device id from localStorage + IP + **daily-rotating salt**). The raw IP is never stored. A short privacy note on the about page covers this (GDPR). *(my call)* Rate limit: ≤10 trees/day and ≤50 reports/day per hash, enforced in the Edge Function.
- **Moderation tooling (v1):** the owner moderates via the Supabase dashboard (toggle `hidden` on trees/reports). There is no admin page in v1. *(my call)*
- New community trees must be inside the Lisbon municipality polygon (PostGIS check) and must not sit <3 m from an existing same-species tree (dedupe).
- Community-flag auto-hide is handled by the view above.

## Phases
1. **Spec + scaffold**: commit this design as `docs/superpowers/specs/2026-11-02-fruta-lisboa-design.md`, then set up SvelteKit + MapLibre + PWA, i18n, and lint/test (Vitest + Playwright).
2. **Species + season logic**: `data/species.json`, plus a pure `seasonStatus(species, date, latestReport)` function with unit tests (month wrap e.g. Nov–Feb, report override, expiry).
3. **City import**: the script that matches species and writes `static/trees.geojson` (works without a backend), with tests on species matching.
4. **Map UI**: clustered markers coloured by fruit, a "ripe now" toggle, the season panel, the detail sheet, geolocate, and PT/EN.
5. **Supabase**: schema migration, RLS, views, rate-limit trigger, and the import writing to the DB. The frontend reads `tree_status` by bbox.
6. **Community**: add-tree flow, reports, flags (via Edge Functions).
7. **Deploy**: Cloudflare Pages + Supabase project, plus a monthly import GitHub Action, an about/etiquette page crediting the city open data (CC0), Falling Fruit and Muita Fruta, plus the privacy note.

Phases 1–4 alone already give a useful static map.

## Left to the builder
Exact visual design (use frontend-design skill), the icon set, the clustering approach, the tile provider, and the bbox-loading strategy vs a single GeoJSON for city trees (~10k points is fine as one file).

## Manual items for the user (batched)
1. Create the Supabase project (or give an access token) and the Cloudflare account/connection.
2. Pick the public name/domain (working name: "Fruta Lisboa").
3. Optional: reach out to Muita Fruta / Falling Fruit about sharing data.

## Verification
- `npm test`: season logic and species-matching unit tests.
- Run the import against the live FeatureServer; assert no oleander/yew/Celtis/ornamental Pyrus/Prunus cerasifera, every tree has a species with ripe_months, and the count matches the sum of included species (~3–4k expected; no fixed target).
- `npm run dev`, then Playwright: map loads, "ripe now" in November shows persimmons/pomegranates/strawberry trees/olives and not figs. Add a tree inside Lisbon (succeeds) and outside (rejected). A "picked" report flips status. 3 flags hide a community tree.
- Lighthouse PWA/mobile check, and manual phone test over LAN.
