import * as React from "react"
import { cn } from "../../lib/utils"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  variant?: "default" | "secondary" | "accent" | "destructive" | "warm"
  showValue?: boolean
  label?: string
  indicatorClassName?: string
}

const heightMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
}

const variantBgColors = {
  default: "bg-primary",
  secondary: "bg-secondary-foreground/70",
  accent: "bg-accent-foreground",
  destructive: "bg-destructive",
  warm: "bg-amber-600 dark:bg-amber-500",
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      variant = "default",
      showValue = false,
      label,
      indicatorClassName,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div ref={ref} className={cn("w-full flex flex-col gap-1.5 font-sans", className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground select-none">
            {label && <span className="font-medium text-foreground tracking-tight">{label}</span>}
            {showValue && (
              <span className="font-sans text-[11px] font-medium ml-auto">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-muted/60 dark:bg-muted/40 shadow-zen-inner p-0.5 border border-border/40",
            heightMap[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantBgColors[variant],
              indicatorClassName
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar }

