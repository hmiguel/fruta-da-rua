import { writeFileSync } from 'node:fs';
import { SPECIES } from '../src/lib/species.ts';
import { packTrees } from '../src/lib/trees-format.ts';
import { fetchAllCity, summarize, toTreeFeature, type TreeFeature } from './import-lib.ts';

const MIN_TREES = 500;

const raw = await fetchAllCity(fetch);
const trees = raw.map((f) => toTreeFeature(f, SPECIES)).filter((f): f is TreeFeature => f !== null);
const meta = summarize(trees);

console.log(`Fetched ${raw.length} city trees, kept ${trees.length} edible.`);
if (trees.length < MIN_TREES) {
	console.error(`Only ${trees.length} trees (< ${MIN_TREES}); not overwriting existing data.`);
	process.exit(1);
}
writeFileSync('static/trees.json', JSON.stringify(packTrees({ type: 'FeatureCollection', features: trees })));
writeFileSync('static/meta.json', JSON.stringify(meta, null, 1));
console.log(meta.by_species);
