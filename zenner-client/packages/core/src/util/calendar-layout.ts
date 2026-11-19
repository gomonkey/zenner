export interface RawEvent {
	startTime: string; // Định dạng "HH:mm"
	endTime: string; // Định dạng "HH:mm"
}

export interface PositionedEvent {
	top: number; // Vị trí px từ phía trên
	height: number; // Chiều cao px của event
	width: number; // Chiều rộng tính bằng % (0-100)
	left: number; // Vị trí px lệch trái tính bằng % (0-100)
}

/**
 * Chuyển đổi định dạng giờ "HH:mm" thành số phút kể từ đầu ngày.
 */
export function parseTimeToMinutes(timeStr: string): number {
	const [hours, minutes] = timeStr.split(':').map(Number);
	if (isNaN(hours) || isNaN(minutes)) return 0;
	return hours * 60 + minutes;
}

/**
 * Thuật toán tính toán vị trí tuyệt đối và chia cột cho các sự kiện trùng giờ (Google Calendar style).
 * Trả về mảng PositionedEvent tương ứng với thứ tự ban đầu của mảng events đầu vào.
 *
 * @param events Danh sách các sự kiện cần tính toán vị trí.
 * @param startHour Giờ bắt đầu hiển thị trên lịch (mặc định là 7h sáng).
 * @param hourHeight Chiều cao hiển thị của một tiếng (mặc định là 60px).
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

	// Chuẩn bị dữ liệu và sắp xếp theo thời gian bắt đầu
	const sortedEvents: ExtendedEvent[] = [...events]
		.map((event, index) => ({
			...event,
			originalIndex: index,
			start: parseTimeToMinutes(event.startTime),
			end: parseTimeToMinutes(event.endTime),
		}))
		.sort((a, b) => a.start - b.start);

	const positioned: (PositionedEvent & { originalIndex: number })[] = [];

	// Gom các sự kiện bị trùng giờ (overlap) vào các nhóm (groups)
	const groups: ExtendedEvent[][] = [];
	for (const event of sortedEvents) {
		let placed = false;
		for (const group of groups) {
			// Nếu sự kiện này giao thời gian với bất kỳ sự kiện nào trong nhóm, cho vào nhóm đó
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

	// Trong mỗi nhóm, chia các sự kiện vào các cột dọc (columns) để không bị đè khuất nhau
	for (const group of groups) {
		const columns: ExtendedEvent[][] = [];
		for (const event of group) {
			let colIdx = 0;
			while (true) {
				if (!columns[colIdx]) {
					columns[colIdx] = [];
				}
				// Kiểm tra xem cột hiện tại đã có sự kiện nào trùng giờ chưa
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

		// Tính toán chiều rộng (width) và vị trí lệch trái (left) dựa trên tổng số cột
		const totalCols = columns.length;
		for (let colIdx = 0; colIdx < totalCols; colIdx++) {
			for (const event of columns[colIdx]) {
				const offsetMinutes = event.start - startOfDayMinutes;
				const top = Math.max(0, (offsetMinutes / 60) * hourHeight);

				// Độ dài sự kiện
				const duration = Math.max(15, event.end - event.start); // Tối thiểu 15 phút để dễ click
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

	// Sắp xếp lại đúng theo thứ tự ban đầu của mảng input và loại bỏ thông tin originalIndex
	return positioned
		.sort((a, b) => a.originalIndex - b.originalIndex)
		.map(({ top, height, width, left }) => ({ top, height, width, left }));
}
