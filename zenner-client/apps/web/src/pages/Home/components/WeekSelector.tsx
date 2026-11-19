import { ThemeConfig } from '@zenner/core/theme/themeConfig';

interface WeekSelectorProps {
  weeks: number[];
  selectedWeek: string;
  onSelectWeek: (week: string) => void;
  currentLanguage: string;
  themeConfig: ThemeConfig;
}

export function WeekSelector({
  weeks,
  selectedWeek,
  onSelectWeek,
  currentLanguage,
  themeConfig
}: WeekSelectorProps) {
  return (
    <div className={themeConfig.weekSelector}>
      {weeks.map((wNum) => {
        const wKey = `Week ${wNum}`;
        const wLabel = currentLanguage === 'vi' ? `Tuần ${wNum}` : `Week ${wNum}`;
        const isActive = selectedWeek === wKey;

        return (
          <button
            key={wKey}
            onClick={() => onSelectWeek(wKey)}
            className={isActive ? themeConfig.weekButtonActive : themeConfig.weekButtonInactive}
          >
            {wLabel}
          </button>
        );
      })}
    </div>
  );
}
