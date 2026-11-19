import { ThemeConfig } from '@zenner/core/theme/themeConfig';

interface Reminder {
	id: string;
	label: string;
	value: 'Y' | 'N';
}

interface ReminderListProps {
	reminders: Reminder[];
	selectedWeek: string;
	onToggleReminder: (reminderId: string) => void;
	currentLanguage: string;
	titleLabel: string;
	themeConfig: ThemeConfig;
}

export function ReminderList({
	reminders,
	selectedWeek,
	onToggleReminder,
	currentLanguage,
	titleLabel,
	themeConfig,
}: ReminderListProps) {
	// Dịch động nhãn tuần trong tiêu đề nhắc nhở
	const translatedWeek =
		currentLanguage === 'vi'
			? selectedWeek.replace('Week', 'Tuần')
			: selectedWeek;

	const completedCount = reminders.filter((r) => r.value === 'Y').length;

	return (
		<div className={themeConfig.reminderList}>
			{/* Tiêu đề & Chỉ số hoàn thành */}
			<div className="flex items-center justify-between pb-1 border-b border-border/50 flex-shrink-0 select-none">
				<span className="text-xs font-bold uppercase tracking-wider text-foreground">
					{titleLabel} ({translatedWeek})
				</span>
				<span className="text-[11px] font-sans font-medium text-muted-foreground">
					{completedCount}/{reminders.length} hoàn thành
				</span>
			</div>

			{/* Hiển thị 2 cột trên desktop: Không bao giờ bị cắt hay phải cuộn trang */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 pt-0.5">
				{reminders.map((rem) => {
					const isYes = rem.value === 'Y';
					const isNo = rem.value === 'N';

					return (
						<div
							key={rem.id}
							className="flex items-center justify-between gap-3 py-1 px-1.5 rounded-lg border-b border-border/30 hover:bg-muted/40 transition-colors select-none"
						>
							<span
								className={`text-xs leading-snug truncate pr-2 ${
									isYes
										? 'line-through text-muted-foreground/60'
										: 'font-medium text-foreground'
								}`}
								title={rem.label}
							>
								• {rem.label}
							</span>

							{/* Nút toggle Y/N được cấu hình hoàn toàn từ theme config */}
							<div className={themeConfig.reminderToggleContainer}>
								<button
									onClick={() => onToggleReminder(rem.id)}
									className={
										isYes
											? themeConfig.reminderToggleActiveY
											: themeConfig.reminderToggleInactive
									}
								>
									Y
								</button>

								{themeConfig.reminderToggleSeparator && (
									<div className={themeConfig.reminderToggleSeparator} />
								)}

								<button
									onClick={() => onToggleReminder(rem.id)}
									className={
										isNo
											? themeConfig.reminderToggleActiveN
											: themeConfig.reminderToggleInactive
									}
								>
									N
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
