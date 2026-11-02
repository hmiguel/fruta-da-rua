export type Tier = 'eat' | 'prep' | 'excluded';

export interface Species {
	id: string;
	match: string[];
	tier: Tier;
	name_pt: string;
	name_en: string;
	ripe: number[];
	peak: number[];
	color: string;
	note_pt: string;
	note_en: string;
	/** The tree's name, [singular, plural]. */
	tree_pt: [string, string];
	tree_en: [string, string];
}

export interface TreeProps {
	id: string;
	species: string;
	address: string | null;
	parish: string | null;
	source: 'city' | 'community';
}

export type ReportKind = 'ripe' | 'unripe' | 'picked' | 'gone' | 'wrong_species';

/** A community report; `at` is an ISO timestamp. */
export interface Report {
	kind: ReportKind;
	at: string;
}

export type Status = 'ripe' | 'in_season' | 'picked' | 'soon' | 'out';
