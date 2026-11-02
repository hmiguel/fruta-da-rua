/** Lisbon municipality bounding box: minLon, minLat, maxLon, maxLat. */
export const LISBON_BBOX = [-9.235, 38.69, -9.085, 38.8] as const;

export type BBox = readonly [number, number, number, number];

export function inBBox([lon, lat]: number[], [w, s, e, n]: BBox): boolean {
	return lon >= w && lon <= e && lat >= s && lat <= n;
}
