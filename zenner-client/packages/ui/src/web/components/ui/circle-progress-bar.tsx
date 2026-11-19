import * as React from "react"
import { cn } from "../../lib/utils"

export interface CircleProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: "sm" | "md" | "lg" | "xl" | number
  strokeWidth?: number
  variant?: "default" | "secondary" | "accent" | "destructive" | "warm"
  showValue?: boolean
  label?: string
  trackClassName?: string
  indicatorClassName?: string
}

const sizeMap = {
  sm: 48,
  md: 72,
  lg: 96,
  xl: 128,
}

const strokeMap = {
  sm: 4,
  md: 6,
  lg: 7,
  xl: 8,
}

const variantStrokeColors = {
  default: "stroke-primary",
  secondary: "stroke-secondary-foreground/60",
  accent: "stroke-accent-foreground",
  destructive: "stroke-destructive",
  warm: "stroke-amber-600 dark:stroke-amber-400",
}

const CircleProgressBar = React.forwardRef<HTMLDivElement, CircleProgressBarProps>(
  (
    {
      value,
      max = 100,
      size = "md",
      strokeWidth,
      variant = "default",
      showValue = true,
      label,
      trackClassName,
      indicatorClassName,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const dimension = typeof size === "number" ? size : sizeMap[size]
    const actualStroke =
      strokeWidth !== undefined
        ? strokeWidth
        : typeof size === "number"
          ? 6
          : strokeMap[size]

    const radius = (dimension - actualStroke) / 2
    const circumference = 2 * Math.PI * radius
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex flex-col items-center justify-center select-none font-sans",
          className
        )}
        style={{ width: dimension, height: dimension }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="transform -rotate-90 origin-center"
        >
          {/* Subtle Zen Shadow Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="transparent"
            strokeWidth={actualStroke}
            className={cn(
              "stroke-muted/50 dark:stroke-muted/30 transition-colors duration-300",
              trackClassName
            )}
          />

          {/* Smooth Indicator Stroke */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="transparent"
            strokeWidth={actualStroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-700 ease-out",
              variantStrokeColors[variant],
              indicatorClassName
            )}
          />
        </svg>

        {/* Center Content / Percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1 text-center">
          {children ? (
            children
          ) : (
            <>
              {showValue && (
                <span
                  className={cn(
                    "font-semibold tracking-tight text-foreground transition-all leading-none",
                    dimension >= 96 ? "text-xl" : dimension >= 72 ? "text-sm" : "text-xs"
                  )}
                >
                  {Math.round(percentage)}%
                </span>
              )}
              {label && (
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5 line-clamp-1">
                  {label}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
)
CircleProgressBar.displayName = "CircleProgressBar"

export { CircleProgressBar }

