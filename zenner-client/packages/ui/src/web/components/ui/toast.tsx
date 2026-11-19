import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "../../lib/utils"

export type ToastVariant = "default" | "success" | "destructive" | "warning" | "zen"

export interface ToastOptions {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastItem extends ToastOptions {
  id: string
}

// Global listener for standalone `toast()` calls
type ToastListener = (toasts: ToastItem[]) => void
let memoryToasts: ToastItem[] = []
const listeners = new Set<ToastListener>()

function notifyListeners() {
  listeners.forEach((listener) => listener([...memoryToasts]))
}

export function toast(options: ToastOptions) {
  const id = options.id || Math.random().toString(36).substring(2, 9)
  const newToast: ToastItem = { ...options, id }

  memoryToasts = [...memoryToasts, newToast]
  notifyListeners()

  if (options.duration !== Infinity) {
    const time = options.duration || 4500
    setTimeout(() => {
      dismissToast(id)
    }, time)
  }

  return id
}

export function dismissToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id)
  notifyListeners()
}

// React Hook
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(memoryToasts)

  React.useEffect(() => {
    listeners.add(setToasts)
    return () => {
      listeners.delete(setToasts)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: dismissToast,
  }
}

const variantStyles: Record<
  ToastVariant,
  { card: string; icon: React.ReactNode }
> = {
  default: {
    card: "border-border/80 bg-card/95 text-foreground",
    icon: <Info className="size-4.5 text-muted-foreground shrink-0 mt-0.5" />,
  },
  zen: {
    card: "border-primary/30 bg-card/95 text-foreground shadow-zen-md",
    icon: <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />,
  },
  success: {
    card: "border-emerald-500/25 bg-card/95 text-foreground",
    icon: <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
  },
  warning: {
    card: "border-amber-500/25 bg-card/95 text-foreground",
    icon: <AlertTriangle className="size-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
  },
  destructive: {
    card: "border-destructive/30 bg-card/95 text-foreground",
    icon: <AlertCircle className="size-4.5 text-destructive shrink-0 mt-0.5" />,
  },
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  item: ToastItem
  onDismiss: (id: string) => void
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ item, onDismiss, className, ...props }, ref) => {
    const config = variantStyles[item.variant || "default"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-zen-md backdrop-blur-md transition-all",
          config.card,
          className
        )}
        {...props}
      >
        {config.icon}

        <div className="flex-1 flex flex-col gap-1 pr-2">
          {item.title && (
            <h5 className="text-sm font-semibold leading-tight tracking-tight text-foreground">
              {item.title}
            </h5>
          )}
          {item.description && (
            <div className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </div>
          )}
          {item.action && (
            <button
              type="button"
              onClick={item.action.onClick}
              className="mt-1.5 self-start text-xs font-semibold text-primary hover:underline"
            >
              {item.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="rounded-lg p-1 text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors -mr-1 -mt-1"
          aria-label="Đóng thông báo"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }
)
Toast.displayName = "Toast"

export interface ToastContainerProps {
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center"
}

export function ToastContainer({ position = "bottom-right" }: ToastContainerProps) {
  const { toasts, dismiss } = useToast()

  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  }

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0",
        positionClasses[position]
      )}
    >
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full flex justify-end"
          >
            <Toast item={item} onDismiss={dismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

