import type { Species } from '../types.ts';

/**
 * Field-guide fruit illustrations: a watercolour wash in the fruit's colour, inked with a
 * slightly wobbly pen line. Everything is drawn in a 64×64 box.
 */

export type Shape =
	| 'round'
	| 'citrus'
	| 'lemon'
	| 'pomegranate'
	| 'persimmon'
	| 'fig'
	| 'pear'
	| 'plum'
	| 'cherry'
	| 'olive'
	| 'grape'
	| 'date'
	| 'loquat'
	| 'mulberry'
	| 'arbutus'
	| 'walnut'
	| 'chestnut'
	| 'almond'
	| 'pod'
	| 'avocado'
	| 'cherimoya'
	| 'feijoa';

export const SHAPES: Record<string, Shape> = {
	orange: 'citrus',
	mandarin: 'citrus',
	citrus: 'citrus',
	bitter_orange: 'citrus',
	lemon: 'lemon',
	loquat: 'loquat',
	fig: 'fig',
	mulberry: 'mulberry',
	pomegranate: 'pomegranate',
	plum: 'plum',
	apricot: 'round',
	peach: 'round',
	cherry: 'cherry',
	almond: 'almond',
	apple: 'round',
	pear: 'pear',
	quince: 'pear',
	persimmon: 'persimmon',
	avocado: 'avocado',
	strawberry_tree: 'arbutus',
	feijoa: 'feijoa',
	guava: 'feijoa',
	cherimoya: 'cherimoya',
	mango: 'avocado',
	grape: 'grape',
	walnut: 'walnut',
	chestnut: 'chestnut',
	hazelnut: 'walnut',
	olive: 'olive',
	carob: 'pod',
	date: 'date'
};

const INK = '#3a3226';
const LEAF = '#6f9150';
const OLIVE_LEAF = '#94a785';

/** Mixes a hex colour toward the ink colour by `t` (0–1). */
function darken(hex: string, t = 0.35): string {
	const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	const b = [1, 3, 5].map((i) => parseInt(INK.slice(i, i + 2), 16));
	return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** A painted, inked piece of fruit. */
function fruit(el: string, color: string): string {
	return (
		`<g fill="${color}" stroke="${darken(color)}" stroke-width="2.5" stroke-opacity=".45" filter="url(#wash)">${el}</g>` +
		`<g fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round" filter="url(#pen)">${el}</g>`
	);
}

function leaf(x: number, y: number, rot: number, color = LEAF, len = 22): string {
	const w = len * 0.32;
	const blade = `<path d="M0 0 C${len * 0.3} ${-w} ${len * 0.75} ${-w} ${len} 0 C${len * 0.75} ${w} ${len * 0.3} ${w} 0 0Z"/>`;
	return (
		`<g transform="translate(${x} ${y}) rotate(${rot})">` +
		`<g fill="${color}" filter="url(#wash)">${blade}</g>` +
		`<g fill="none" stroke="${INK}" stroke-width="1.1" filter="url(#pen)">${blade}<path d="M1 0 L${len - 2} 0"/></g></g>`
	);
}

function stem(d: string): string {
	return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" filter="url(#pen)"/>`;
}

function shine(x: number, y: number, r = 4): string {
	return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#fff" opacity=".45" filter="url(#soft)"/>`;
}

function dots(points: [number, number][], color: string, r = 0.9): string {
	return points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`).join('');
}

function draw(shape: Shape, c: string): string {
	const dark = darken(c, 0.5);
	switch (shape) {
		case 'round':
			return stem('M32 21 C32 17 33 14 35 12') + leaf(34, 14, -25) + fruit('<circle cx="32" cy="37" r="17"/>', c) + shine(25, 30);
		case 'citrus':
			return (
				stem('M32 19 L33 14') +
				leaf(33, 15, -35) +
				fruit('<circle cx="32" cy="37" r="18"/>', c) +
				dots([[26, 34], [36, 30], [40, 40], [30, 45], [24, 41], [38, 47]], dark, 0.7) +
				shine(25, 29)
			);
		case 'lemon':
			return (
				leaf(36, 18, -40) +
				fruit('<path d="M12 40 C12 30 24 22 36 23 C46 24 52 30 54 36 C55 38 54 40 52 40 C50 48 40 54 28 52 C20 51 14 48 12 44 Z"/>', c) +
				shine(26, 32)
			);
		case 'pomegranate':
			return (
				fruit('<path d="M27 23 L28 16 L31 21 L33 15 L35 21 L38 16 L38 23 Z"/>', c) +
				fruit('<circle cx="32" cy="38" r="17"/>', c) +
				shine(25, 32)
			);
		case 'persimmon':
			return (
				fruit('<ellipse cx="32" cy="38" rx="20" ry="15"/>', c) +
				fruit('<path d="M32 22 L38 25 L44 23 L40 28 L32 27 L24 28 L20 23 L26 25 Z"/>', LEAF) +
				shine(24, 34)
			);
		case 'fig':
			return (
				stem('M32 14 L32 9') +
				fruit('<path d="M32 13 C36 13 36 21 40 25 C50 33 48 53 32 54 C16 53 14 33 24 25 C28 21 28 13 32 13Z"/>', c) +
				shine(26, 36)
			);
		case 'pear':
			return (
				stem('M32 14 C32 10 33 8 35 6') +
				leaf(34, 9, -20, LEAF, 18) +
				fruit('<path d="M32 13 C38 13 38 24 42 28 C52 36 48 54 32 54 C16 54 12 36 22 28 C26 24 26 13 32 13Z"/>', c) +
				shine(25, 38)
			);
		case 'plum':
			return (
				stem('M32 18 L34 12') +
				fruit('<ellipse cx="32" cy="36" rx="15" ry="18"/>', c) +
				`<path d="M33 20 C28 30 28 42 33 53" fill="none" stroke="${dark}" stroke-width="1" opacity=".6"/>` +
				shine(26, 30)
			);
		case 'cherry':
			return (
				stem('M23 34 C26 22 32 14 38 10') +
				stem('M41 36 C40 24 39 16 38 10') +
				leaf(38, 10, -10, LEAF, 18) +
				fruit('<circle cx="22" cy="43" r="10"/>', c) +
				fruit('<circle cx="42" cy="45" r="10"/>', c) +
				shine(19, 39, 3) +
				shine(39, 41, 3)
			);
		case 'olive':
			return (
				stem('M8 18 C24 22 40 22 58 14') +
				leaf(20, 21, 160, OLIVE_LEAF, 16) +
				leaf(40, 20, -20, OLIVE_LEAF, 18) +
				fruit('<ellipse cx="22" cy="38" rx="7" ry="10" transform="rotate(-15 22 38)"/>', c) +
				fruit('<ellipse cx="36" cy="44" rx="7" ry="10"/>', c) +
				fruit('<ellipse cx="47" cy="33" rx="6.5" ry="9.5" transform="rotate(15 47 33)"/>', c) +
				shine(34, 40, 2.5)
			);
		case 'grape': {
			const g: [number, number][] = [[24, 22], [34, 22], [44, 23], [29, 31], [39, 31], [24, 40], [34, 40], [44, 40], [29, 48], [39, 48], [34, 56]];
			return stem('M34 16 L34 8') + leaf(35, 10, -15) + g.map(([x, y]) => fruit(`<circle cx="${x}" cy="${y}" r="6.5"/>`, c)).join('');
		}
		case 'date': {
			const d: [number, number][] = [[18, 36], [27, 40], [36, 40], [45, 36]];
			return (
				stem('M10 18 C24 24 40 24 54 18') +
				d.map(([x, y]) => stem(`M${x} ${y - 9} L${x} 22`) + fruit(`<ellipse cx="${x}" cy="${y}" rx="4.5" ry="9"/>`, c)).join('')
			);
		}
		case 'loquat':
			return (
				leaf(30, 16, -160, LEAF, 26) +
				stem('M32 16 L24 28 M32 16 L36 30 M32 16 L46 26') +
				fruit('<ellipse cx="23" cy="38" rx="9" ry="11"/>', c) +
				fruit('<ellipse cx="38" cy="42" rx="9" ry="11"/>', c) +
				fruit('<ellipse cx="47" cy="32" rx="8" ry="10"/>', c) +
				shine(35, 37, 3)
			);
		case 'mulberry': {
			const b: [number, number][] = [];
			for (let y = 22; y <= 50; y += 6) for (let x = 26; x <= 38; x += 6) if (!((y === 22 || y === 50) && x !== 32)) b.push([x, y]);
			return stem('M32 18 L33 10') + b.map(([x, y]) => fruit(`<circle cx="${x}" cy="${y}" r="4.2"/>`, c)).join('');
		}
		case 'arbutus':
			return (
				leaf(30, 18, -150, LEAF, 22) +
				fruit('<circle cx="22" cy="38" r="9"/>', c) +
				fruit('<circle cx="40" cy="42" r="10"/>', c) +
				fruit('<circle cx="43" cy="24" r="8"/>', c) +
				dots([[19, 35], [24, 41], [37, 39], [42, 45], [44, 38], [41, 22], [45, 26]], dark, 0.8)
			);
		case 'walnut':
			return (
				fruit('<circle cx="32" cy="35" r="17"/>', c) +
				`<path d="M32 18 C29 26 35 30 31 36 C28 42 34 46 32 52 M24 26 C26 30 22 34 25 38 M40 26 C38 31 42 35 39 40" fill="none" stroke="${dark}" stroke-width="1" opacity=".7"/>`
			);
		case 'chestnut':
			return (
				fruit('<path d="M32 15 C44 18 50 30 48 42 C47 50 17 50 16 42 C14 30 20 18 32 15Z"/>', c) +
				`<path d="M17 43 C26 47 38 47 47 43" fill="none" stroke="#e8dcc0" stroke-width="5" opacity=".8"/>` +
				stem('M32 15 L32 11') +
				shine(26, 26)
			);
		case 'almond':
			return (
				fruit('<path d="M32 12 C45 22 45 44 32 54 C19 44 19 22 32 12Z"/>', c) +
				dots([[30, 22], [34, 28], [29, 34], [35, 40], [31, 46], [27, 28], [37, 34]], dark, 0.8)
			);
		case 'pod':
			return (
				fruit('<path d="M8 46 C18 30 38 20 56 14 C59 18 57 23 52 25 C40 31 24 42 14 51 C10 54 6 50 8 46Z"/>', c) +
				`<path d="M14 46 C26 36 40 28 52 21" fill="none" stroke="${dark}" stroke-width="1" stroke-dasharray="4 3" opacity=".7"/>`
			);
		case 'avocado':
			return (
				stem('M34 13 L36 8') +
				fruit('<path d="M34 12 C44 14 50 34 46 46 C42 56 22 56 18 46 C14 34 24 12 34 12Z"/>', c) +
				shine(26, 38)
			);
		case 'cherimoya':
			return (
				stem('M32 15 L32 9') +
				fruit('<path d="M32 15 C46 15 52 30 46 44 C42 52 22 52 18 44 C12 30 18 15 32 15Z"/>', c) +
				`<path d="M22 28 q4 4 8 0 q4 4 8 0 q4 4 8 0 M19 37 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 6 0 M22 46 q4 4 8 0 q4 4 8 0 q4 4 8 0" fill="none" stroke="${dark}" stroke-width="1" opacity=".7"/>`
			);
		case 'feijoa':
			return (
				fruit('<ellipse cx="32" cy="34" rx="14" ry="19"/>', c) +
				`<path d="M28 53 L32 57 L36 53 M32 53 L32 58" fill="none" stroke="${INK}" stroke-width="1.4"/>` +
				shine(27, 26)
			);
	}
}

const DEFS =
	'<defs>' +
	'<filter id="wash" x="-20%" y="-20%" width="140%" height="140%">' +
	'<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/>' +
	'<feDisplacementMap in="SourceGraphic" in2="n" scale="4" result="d"/>' +
	'<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="8" result="t"/>' +
	'<feColorMatrix in="t" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 1.45" result="a"/>' +
	'<feComposite in="d" in2="a" operator="in"/></filter>' +
	'<filter id="pen"><feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="1" seed="5" result="n"/>' +
	'<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter>' +
	'<filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>' +
	'</defs>';

export function fruitSvg(sp: Species, size = 64): string {
	const shape = SHAPES[sp.id] ?? 'round';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${DEFS}${draw(shape, sp.color)}</svg>`;
}
