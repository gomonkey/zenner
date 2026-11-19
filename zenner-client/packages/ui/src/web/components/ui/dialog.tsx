import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface DialogContextValue {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  close: () => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog compound components must be used within a Dialog")
  }
  return context
}

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const setIsOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const next = typeof value === "function" ? value(isOpen) : value
      if (!isControlled) {
        setUncontrolledOpen(next)
      }
      onOpenChange?.(next)
    },
    [isControlled, isOpen, onOpenChange]
  )

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  // Lock body scroll when open
  React.useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen, close }}>
      {children}
    </DialogContext.Provider>
  )
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { setIsOpen } = useDialog()

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          setIsOpen(true)
          onClick?.(e)
        }}
        className={cn("inline-flex items-center justify-center focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = "DialogTrigger"

export interface DialogContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"> {
  size?: "sm" | "md" | "lg" | "xl" | "full"
  closeOnClickOutside?: boolean
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] h-[90vh]",
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      size = "md",
      closeOnClickOutside = true,
      showCloseButton = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isOpen, close } = useDialog()

    // Escape key listener
    React.useEffect(() => {
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          close()
        }
      }

      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown)
      }
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }, [isOpen, close])

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop with Zen Shoji mist blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (closeOnClickOutside) close()
              }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Dialog Card */}
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className={cn(
                "relative z-50 w-full overflow-hidden rounded-3xl border border-border/80 bg-card/98 p-6 text-card-foreground shadow-zen-lg backdrop-blur-md select-none font-sans",
                sizeClasses[size],
                className
              )}
              {...props}
            >
              {showCloseButton && (
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Đóng hộp thoại"
                >
                  <X className="size-4" />
                </button>
              )}

              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  }
)
DialogContent.displayName = "DialogContent"

export const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

export const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6", className)}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, children, ...props }, ref) => {
  const { close } = useDialog()

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e)
        close()
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DialogClose.displayName = "DialogClose"
