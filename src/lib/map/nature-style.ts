/**
 * Redraws OpenFreeMap's Liberty basemap as a field-notebook map: paper ground, watercolour
 * water and parks, pencil-cased roads and ink labels, so the fruit illustrations stand out.
 * Returns the paint properties to set for a layer, or null to leave it as it is.
 */
export const PAPER = '#eef0e4';

const FILLS: Record<string, string> = {
	water: '#c5dbd6',
	park: '#d3e3c1',
	landcover_grass: '#d3e3c1',
	landcover_wood: '#c6dbb0',
	landuse_residential: '#e8eadc',
	landuse_hospital: '#e5e7d8',
	landuse_school: '#e5e7d8',
	landuse_pitch: '#e5e7d8',
	landuse_track: '#e5e7d8',
	landuse_cemetery: '#e5e7d8',
	landcover_sand: '#e5e7d8',
	aeroway_fill: '#e5e7d8',
	building: '#dfe0d0'
};

/** Bus stops, shops and one-way arrows are noise on a fruit map. */
export function keepLayer(id: string): boolean {
	return !id.startsWith('poi') && !id.startsWith('road_one_way');
}

export function naturePaint(id: string, type: string): [string, string][] | null {
	if (type === 'background') return [['background-color', PAPER]];
	if (type === 'symbol')
		return [
			['text-color', '#4a4334'],
			['text-halo-color', PAPER]
		];
	if (type === 'fill-extrusion') return [['fill-extrusion-color', '#dcdccb']];
	if (type === 'fill') return FILLS[id] ? [['fill-color', FILLS[id]]] : null;
	if (type !== 'line') return null;
	if (id.startsWith('waterway')) return [['line-color', '#c5dbd6']];
	if (!/^(road|bridge|tunnel)_/.test(id) || /rail|path|pedestrian/.test(id)) return null;
	return [['line-color', id.endsWith('_casing') ? '#c9c6b4' : '#fbfbf5']];
}
