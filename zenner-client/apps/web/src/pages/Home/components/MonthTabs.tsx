import { ThemeConfig } from '@zenner/core/theme/themeConfig';

interface MonthTabsProps {
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  themeConfig: ThemeConfig;
}

export function MonthTabs({
  months,
  selectedMonth,
  onSelectMonth,
  themeConfig
}: MonthTabsProps) {
  return (
    <div className={themeConfig.monthTabsContainer}>
      {months.map((m) => {
        const isActive = selectedMonth === m;

        return (
          <button
            key={m}
            onClick={() => onSelectMonth(m)}
            className={isActive ? themeConfig.monthButtonActive : themeConfig.monthButtonInactive}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
