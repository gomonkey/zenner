export interface RawEvent {
	startTime: string; // Format "HH:mm"
	endTime: string; // Format "HH:mm"
}

export interface PositionedEvent {
	top: number; // Top position in px
	height: number; // Event height in px
	width: number; // Width as a percentage (0-100)
	left: number; // Left offset as a percentage (0-100)
}

/**
 * Converts a time string formatted as "HH:mm" to total minutes from the beginning of the day.
 */
export function parseTimeToMinutes(timeStr: string): number {
	const [hours, minutes] = timeStr.split(':').map(Number);
	if (isNaN(hours) || isNaN(minutes)) return 0;
	return hours * 60 + minutes;
}

/**
 * Calculates absolute positions and column distribution for overlapping calendar events (Google Calendar style).
 * Returns an array of PositionedEvent matching the original order of the input events array.
 *
 * @param events List of events to compute positions for.
 * @param startHour Calendar display start hour (defaults to 7 AM).
 * @param hourHeight Display height of one hour in pixels (defaults to 60px).
 */
export function calculateEventPositions(
	events: RawEvent[],
	startHour: number = 7,
	hourHeight: number = 60,
): PositionedEvent[] {
	const startOfDayMinutes = startHour * 60;

	interface ExtendedEvent extends RawEvent {
		originalIndex: number;
		start: number;
		end: number;
	}

	// Prepare data and sort by start time
	const sortedEvents: ExtendedEvent[] = [...events]
		.map((event, index) => ({
			...event,
			originalIndex: index,
			start: parseTimeToMinutes(event.startTime),
			end: parseTimeToMinutes(event.endTime),
		}))
		.sort((a, b) => a.start - b.start);

	const positioned: (PositionedEvent & { originalIndex: number })[] = [];

	// Group overlapping events into clusters
	const groups: ExtendedEvent[][] = [];
	for (const event of sortedEvents) {
		let placed = false;
		for (const group of groups) {
			// Place event in group if it overlaps with any event in this group
			const hasOverlap = group.some(
				(e) =>
					(event.start >= e.start && event.start < e.end) ||
					(e.start >= event.start && e.start < event.end),
			);
			if (hasOverlap) {
				group.push(event);
				placed = true;
				break;
			}
		}
		if (!placed) {
			groups.push([event]);
		}
	}

	// Within each group, assign events into columns so they do not overlap
	for (const group of groups) {
		const columns: ExtendedEvent[][] = [];
		for (const event of group) {
			let colIdx = 0;
			while (true) {
				if (!columns[colIdx]) {
					columns[colIdx] = [];
				}
				// Check whether current column has any conflicting event
				const hasOverlapInCol = columns[colIdx].some(
					(e) =>
						(event.start >= e.start && event.start < e.end) ||
						(e.start >= event.start && e.start < event.end),
				);
				if (!hasOverlapInCol) {
					columns[colIdx].push(event);
					break;
				}
				colIdx++;
			}
		}

		// Calculate width and left offset based on total columns in the group
		const totalCols = columns.length;
		for (let colIdx = 0; colIdx < totalCols; colIdx++) {
			for (const event of columns[colIdx]) {
				const offsetMinutes = event.start - startOfDayMinutes;
				const top = Math.max(0, (offsetMinutes / 60) * hourHeight);

				// Event duration
				const duration = Math.max(15, event.end - event.start); // Minimum 15 minutes for clickability
				const height = (duration / 60) * hourHeight;

				const width = 100 / totalCols;
				const left = colIdx * width;

				positioned.push({
					originalIndex: event.originalIndex,
					top,
					height,
					width,
					left,
				});
			}
		}
	}

	// Restore original array order and strip originalIndex
	return positioned
		.sort((a, b) => a.originalIndex - b.originalIndex)
		.map(({ top, height, width, left }) => ({ top, height, width, left }));
}
