import { useTranslation } from 'react-i18next';
import { useAuthStore, useThemeStore } from '@zenner/core/store/index';
import { Timeblock } from '@zenner/ui';
import { useHomeData } from './hooks/useHomeData';
import { Toolbar } from './components/Toolbar';
import { ReminderList } from './components/ReminderList';
import { GratitudeCard } from './components/GratitudeCard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { getThemeList, defaultTheme } from '@zenner/core/theme/themeConfig';

export function Home() {
	const logout = useAuthStore((state) => state.logout);
	const { resolvedTheme, toggleTheme } = useThemeStore();
	const { t, i18n } = useTranslation();

	const toggleLanguage = () => {
		i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
	};

	const {
		pageData,
		isLoading,
		isError,
		error,
		refetch,
		themeBoost,
		toggleThemeBoost,
		handleToggleReminder,
		handleToggleDoTask,
		handleTimeGoalChange,
	} = useHomeData();

	// Resolve selected theme from dynamic theme list
	const availableThemes = getThemeList();
	const themeConfig =
		availableThemes.find((t) => t.id === themeBoost) || defaultTheme;

	if (isLoading) {
		return (
			<div className="h-screen w-screen bg-background flex items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					<span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
						{t('home.loading', 'Loading Day...')}
					</span>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="h-screen w-screen bg-background flex items-center justify-center p-4">
				<div className="max-w-md w-full p-6 bg-card border border-destructive/30 rounded-2xl shadow-lg flex flex-col items-center text-center gap-3">
					<span className="text-sm font-semibold text-destructive">
						{t('home.errorLoading', 'Failed to connect to Zenner server')}
					</span>
					<p className="text-xs text-muted-foreground">
						{error instanceof Error ? error.message : 'Unable to reach backend service.'}
					</p>
					<button
						onClick={() => refetch()}
						className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:brightness-105 transition-all cursor-pointer"
					>
						{t('home.retry', 'Retry Connection')}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen max-h-screen w-screen overflow-hidden bg-background text-foreground p-3 md:p-4 flex flex-col items-center justify-center relative font-sans transition-colors duration-200">
			{/* Root Planner Wrapper */}
			<div className="w-full h-full max-h-full flex items-stretch gap-0 relative overflow-hidden">
				{/* Main Planner Frame */}
				<div className={themeConfig.plannerWrapper}>
					{/* ---------------- LEFT COLUMN: TIMEBLOCK ---------------- */}
					<div className="w-full lg:w-[40%] h-full max-h-full flex flex-col gap-3 overflow-hidden">
						<div className={themeConfig.headerDivider}>
							<div className="flex flex-col gap-0.5">
								<span className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-foreground select-none">
									{t('home.selectedMonth')}: {pageData.selectedMonth}
								</span>
								<div className="flex items-baseline gap-2">
									<span className="font-bold text-xs uppercase tracking-wider text-foreground select-none font-sans">
										{t('home.date')}:
									</span>
									<span className="font-sans text-xs text-foreground/90 pb-0.5 leading-none pr-8 select-none">
										{pageData.date}
									</span>
								</div>
							</div>

							{/* System controls integrated as Toolbar widget */}
							<Toolbar
								currentLanguage={i18n.language}
								resolvedTheme={resolvedTheme}
								toggleLanguage={toggleLanguage}
								toggleTheme={toggleTheme}
								logout={logout}
								logoutLabel={t('home.logout')}
								themeBoost={themeBoost}
								toggleThemeBoost={toggleThemeBoost}
								themeConfig={themeConfig}
							/>
						</div>

						{/* Shared Timeblock component */}
						<div className="flex-1 min-h-0 overflow-hidden">
							<Timeblock
								events={pageData.events}
								startHour={0}
								endHour={23}
								hourHeight={40}
								title={t('home.todayTimeblock')}
								themeConfig={themeConfig}
							/>
						</div>
					</div>

					{/* ---------------- RIGHT COLUMN: REMINDERS, MATRIX, NOTES ---------------- */}
					<div className="w-full lg:w-[60%] h-full max-h-full flex flex-col gap-2 overflow-hidden">
						{/* 1. REMINDER LABELS */}
						<ReminderList
							reminders={pageData.reminders}
							selectedWeek={pageData.selectedWeek}
							onToggleReminder={handleToggleReminder}
							currentLanguage={i18n.language}
							titleLabel={t('home.reminders')}
							themeConfig={themeConfig}
						/>

						{/* 2. GRATITUDE CARD */}
						<GratitudeCard
							quote={pageData.gratitudeQuote}
							themeConfig={themeConfig}
						/>

						{/* 3. EISENHOWER MATRIX */}
						<EisenhowerMatrix
							matrix={pageData.matrix}
							onToggleDoTask={handleToggleDoTask}
							t={t}
							themeConfig={themeConfig}
						/>

						{/* 4. DAILY GOAL INPUT */}
						<div className="flex flex-col flex-shrink-0">
							<input
								type="text"
								value={pageData.dailyGoal || ''}
								onChange={(e) => handleTimeGoalChange(e.target.value)}
								className={themeConfig.dailyGoalInput}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
