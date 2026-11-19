import { ThemeConfig } from '@zenner/core/theme/themeConfig';

interface GratitudeCardProps {
  quote: string;
  themeConfig: ThemeConfig;
}

export function GratitudeCard({ quote, themeConfig }: GratitudeCardProps) {
  return (
    <div className={themeConfig.gratitudeCard}>
      <p className="text-xs font-medium text-muted-foreground italic leading-relaxed px-3">
        "{quote}"
      </p>
    </div>
  );
}
