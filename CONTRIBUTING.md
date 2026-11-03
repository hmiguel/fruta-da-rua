# Contributing to Fruta da Rua

Thank you for helping. You can write in Portuguese or English.

## Ways to help

- **A tree is wrong or missing:** open an issue with the address or a map link. Until community reports exist in the app, issues are how the map gets fixed.
- **A fruit's season is off:** open an issue saying which fruit, which months you see it ripe in Lisbon, and where.
- **Code:** pick an open issue or propose a change in a new one first, so we agree on it before you spend time.

## Before you open a pull request

```sh
npm install
npm test          # unit tests
npm run check     # types
npm run e2e       # browser and accessibility tests
```

All three must pass.

## House rules

These keep the app consistent. Reviewers will ask for them.

- **Phones first.** Most people use the map on a phone in the street. Check 360px and 390px widths; touch targets are at least 44px.
- **Accessible.** The browser tests run axe (WCAG 2.2 AA). Keep them green, keep keyboard focus visible, and give buttons labels.
- **Both languages.** Every text key exists in `src/lib/i18n/pt.json` and `en.json`. Portuguese is European Portuguese.
- **Plain writing.** No em or en dashes in app copy (a test checks this), no emojis. Short sentences, commas and full stops.
- **Field notebook look.** Paper, ink, watercolour fruit drawings and handwriting. Reuse the shared pieces in `src/lib/ui/kit/` (icons, icon button, panel header) instead of drawing new ones.
- **Only legal, safe fruit.** Before adding a species, check that picking it is legal in Portugal and that it is edible. Ornamental, toxic or protected species go under `x_excluded` in `data/species.json`.
- **Tests with changes.** A change in behaviour comes with a test that fails without it.

## Code of conduct

Be kind and assume good faith. We follow the [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Report problems to hugo@lixo.dev.
