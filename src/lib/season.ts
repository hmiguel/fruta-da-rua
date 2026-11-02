import type { Report, Species, Status } from './types.ts';

export const REPORT_TTL_DAYS = 14;

const monthFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', month: 'numeric' });

export function lisbonMonth(d: Date): number {
	return Number(monthFormat.format(d));
}

export function inMonths(months: number[], m: number): boolean {
	return months.includes(m);
}

/** A report fresher than REPORT_TTL_DAYS overrides the ripening calendar. */
export function seasonStatus(sp: Species, now: Date, latest?: Report | null): Status {
	if (latest) {
		const age = now.getTime() - new Date(latest.at).getTime();
		if (age >= 0 && age <= REPORT_TTL_DAYS * 86_400_000) {
			if (latest.kind === 'ripe') return 'ripe';
			if (latest.kind === 'picked' || latest.kind === 'unripe') return 'picked';
		}
	}
	const m = lisbonMonth(now);
	if (inMonths(sp.ripe, m)) return 'in_season';
	if (inMonths(sp.ripe, (m % 12) + 1)) return 'soon';
	return 'out';
}

export function isPickable(s: Status): boolean {
	return s === 'ripe' || s === 'in_season';
}
