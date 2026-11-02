import { expect, test } from 'vitest';
import { isPickable, lisbonMonth, seasonStatus } from './season.ts';
import { speciesById } from './species.ts';

const olive = speciesById('olive')!;
const fig = speciesById('fig')!;
const orange = speciesById('orange')!;
const loquat = speciesById('loquat')!;

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
	expect(seasonStatus(olive, now, { kind: 'unripe', at: '2026-11-14T09:00Z' })).toBe('picked');
	expect(seasonStatus(olive, now, { kind: 'picked', at: '2026-10-01T09:00Z' })).toBe('in_season');
	expect(seasonStatus(olive, now, { kind: 'gone', at: '2026-11-14T09:00Z' })).toBe('in_season');
});

test('isPickable', () => {
	expect(isPickable('ripe')).toBe(true);
	expect(isPickable('in_season')).toBe(true);
	expect(isPickable('soon')).toBe(false);
	expect(isPickable('picked')).toBe(false);
	expect(isPickable('out')).toBe(false);
});
