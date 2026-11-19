import { useMemo, useEffect, useState } from 'react';
import { calculateEventPositions, RawEvent } from '@zenner/core/util/calendar-layout';
import { TimeblockThemeConfig } from '@zenner/core/theme/themeConfig';

export interface TimeblockEvent extends RawEvent {
  id: string;
  title: string;
  note?: string; // Event note (optional alternative display)
  color?: string; // Tailwind CSS classes for background, border, and text color
}

const defaultTimeblockTheme: TimeblockThemeConfig = {
  id: 'default',
  timeblockContainer: "flex flex-col h-full bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden select-none",
  timeblockHeader: "px-4 py-2.5 border-b border-border bg-muted/40 flex justify-between items-center",
  timeblockModeLabel: "text-[9px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase tracking-wider",
  timeblockTimeAxis: "w-16 border-r border-border/80 bg-muted/20 flex flex-col",
  timeblockGridLine: "absolute left-0 right-0 border-b border-border/40",
  timeblockEventCard: "absolute rounded-lg overflow-hidden flex flex-col transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer shadow-xs"
};

interface TimeblockProps {
  events: TimeblockEvent[];
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  title?: string;
  dayModeLabel?: string;
  themeConfig?: TimeblockThemeConfig;
}

export function Timeblock({
  events,
  startHour = 0,
  endHour = 23,
  hourHeight = 40,
  title = "Today's Timeblock",
  dayModeLabel,
  themeConfig
}: TimeblockProps) {
  const config = themeConfig || defaultTimeblockTheme;
  const isJournal = config.id === 'journal';

  // Sync current time to update real-time indicator line
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Compute event layout positions
  const positionedEvents = useMemo(() => {
    return calculateEventPositions(events, startHour, hourHeight);
  }, [events, startHour, hourHeight]);

  // Generate displayed hours axis
  const hours = useMemo(() => {
    const list = [];
    for (let h = startHour; h <= endHour; h++) {
      list.push(h);
    }
    return list;
  }, [startHour, endHour]);

  const contentHeight = hours.length * hourHeight;

  // Calculate current time line position
  const currentTimePosition = useMemo(() => {
    const hoursNow = now.getHours();
    const minutesNow = now.getMinutes();
    
    if (hoursNow < startHour || hoursNow > endHour) {
      return null;
    }
    
    const offsetMinutes = (hoursNow * 60 + minutesNow) - (startHour * 60);
    return (offsetMinutes / 60) * hourHeight;
  }, [now, startHour, endHour, hourHeight]);

  return (
    <div className={`${config.timeblockContainer} font-sans`}>
      {/* Schedule Header */}
      <div className={config.timeblockHeader}>
        <span className="font-sans font-bold text-foreground text-sm tracking-wider uppercase select-none">
          {title}
        </span>
        {dayModeLabel && (
          <span className={config.timeblockModeLabel}>
            {dayModeLabel}
          </span>
        )}
      </div>

      {/* Schedule Grid */}
      <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex relative" style={{ height: `${contentHeight}px` }}>
          
          {/* Vertical Time Axis */}
          <div className={config.timeblockTimeAxis}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="text-right pr-3 text-[11px] font-semibold text-muted-foreground/80 font-sans relative select-none tracking-tight"
                style={{
                  height: `${hourHeight}px`,
                  lineHeight: '22px', // Align text with top of hour mark
                }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Time Grid and Events */}
          <div className="flex-1 relative bg-muted/5">
            {/* Horizontal grid line separating each hour */}
            {hours.map((_, idx) => (
              <div
                key={`grid-line-${idx}`}
                className={config.timeblockGridLine}
                style={{
                  top: `${(idx + 1) * hourHeight}px`,
                }}
              />
            ))}

            {/* Render Events */}
            {events.map((event, idx) => {
              const pos = positionedEvents[idx];
              if (!pos) return null;

              // Display event on a single row if height is 48px or less to prevent text overflow
              const isSingleRow = pos.height <= 48;

              // Monochrome sophisticated event colors with high contrast and architectural depth
              const getModernMinimalColor = (rawColor?: string) => {
                if (!rawColor) {
                  return 'bg-zinc-800 dark:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-xs hover:opacity-90';
                }

                const c = rawColor.toLowerCase();

                if (c.includes('primary')) {
                  return 'bg-foreground text-background font-semibold hover:opacity-90 shadow-xs';
                }
                if (c.includes('sky') || c.includes('blue') || c.includes('cyan')) {
                  return 'bg-card text-foreground border border-border hover:border-foreground shadow-xs';
                }
                if (c.includes('emerald') || c.includes('green') || c.includes('teal')) {
                  return 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900 shadow-xs hover:opacity-90';
                }
                if (c.includes('amber') || c.includes('yellow') || c.includes('orange')) {
                  return 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-border shadow-xs hover:opacity-90';
                }
                if (c.includes('purple') || c.includes('violet') || c.includes('indigo')) {
                  return 'bg-muted/90 text-foreground border-l-4 border-l-foreground border-y border-r border-border shadow-xs';
                }
                if (c.includes('rose') || c.includes('pink') || c.includes('red')) {
                  return 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-border shadow-xs';
                }

                return 'bg-zinc-800 dark:bg-zinc-200 text-zinc-50 dark:text-zinc-900 shadow-xs hover:opacity-90';
              };

              const modernColorClass = getModernMinimalColor(event.color);
              const eventCardClass = `${config.timeblockEventCard} ${modernColorClass}`;

              // Calculate formatted time strings and durations
              const parseTime = (t: string) => {
                const [hStr, mStr] = t.split(':');
                const h = parseInt(hStr, 10);
                const m = parseInt(mStr, 10);
                return { h, m, totalMinutes: h * 60 + m };
              };

              const tStart = parseTime(event.startTime);
              const tEnd = parseTime(event.endTime);

              const formatPart = (t: { h: number; m: number }) => {
                if (t.m === 0) return `${t.h}:00`;
                return `${t.h}:${t.m < 10 ? '0' + t.m : t.m}`;
              };

              const startFormatted = formatPart(tStart);
              const endFormatted = formatPart(tEnd);

              const diffMin = tEnd.totalMinutes - tStart.totalMinutes;
              const diffH = Math.floor(diffMin / 60);
              const diffM = diffMin % 60;

              let durationFormatted = '';
              if (diffH > 0 && diffM > 0) {
                durationFormatted = `${diffH}h${diffM}m`;
              } else if (diffH > 0) {
                durationFormatted = `${diffH}h`;
              } else {
                durationFormatted = `${diffM}m`;
              }

              return (
                <div
                  key={event.id}
                  className={`${eventCardClass} ${
                    isSingleRow ? 'px-3 py-1 justify-center' : 'px-3 py-1.5 justify-start gap-1'
                  }`}
                  style={{
                    top: `${pos.top + 2}px`,
                    height: `${Math.max(22, pos.height - 4)}px`,
                    left: `${isJournal ? pos.left : pos.left + 0.5}%`,
                    width: `calc(${isJournal ? pos.width : pos.width - 1}% - 6px)`,
                    marginRight: '3px',
                    marginLeft: '3px',
                    zIndex: isSingleRow ? 10 : 1,
                  }}
                  title={`${event.title} (${startFormatted} - ${endFormatted})`}
                >
                  {isSingleRow ? (
                    // Single row: Title + Time range (12:00 - 13:00) + Duration badge (1h)
                    <div className="flex items-center justify-between gap-2 w-full min-w-0 h-full font-sans">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-bold text-xs truncate">
                          {event.title}
                        </span>
                        {pos.height >= 30 && (
                          <span className="text-[10px] font-sans font-medium opacity-85 shrink-0">
                            {startFormatted} – {endFormatted}
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] font-sans font-bold px-1.5 py-0.5 rounded bg-black/20 text-current shrink-0 leading-none">
                        {durationFormatted}
                      </span>
                    </div>
                  ) : (
                    // Multi-row (> 48px): Displays tiered information comfortably
                    <div className="flex flex-col gap-1 w-full min-w-0 font-sans">
                      <div className="flex items-start justify-between gap-1 w-full min-w-0">
                        <span className="font-bold text-xs tracking-tight leading-snug truncate">
                          {event.title}
                        </span>
                        <span className="text-[9.5px] font-sans font-bold px-1.5 py-0.5 rounded bg-black/20 text-current shrink-0 leading-none">
                          {durationFormatted}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-sans font-medium opacity-85 leading-tight">
                        <span>{startFormatted} – {endFormatted}</span>
                      </div>
                      {pos.height >= 60 && event.note && (
                        <p className="text-[10px] font-medium opacity-75 truncate leading-tight mt-0.5">
                          {event.note}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current Time Indicator Line (Monochrome Minimalist) */}
            {currentTimePosition !== null && (
              <div 
                className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-foreground shadow-xs -ml-1 flex-shrink-0 ring-2 ring-background" />
                <div className="flex-1 h-[1.5px] bg-foreground/90 shadow-xs" />
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
