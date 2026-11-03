/** Keeps Tab inside `box` (a modal dialog) by wrapping from the last control to the first. */
export function trapTab(e: KeyboardEvent, box: HTMLElement): void {
	if (e.key !== 'Tab') return;
	const items = [...box.querySelectorAll<HTMLElement>('a[href], button, input')];
	const first = items[0];
	const last = items[items.length - 1];
	if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}
