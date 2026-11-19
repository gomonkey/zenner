import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

interface DropdownContextValue {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  close: () => void
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined)

function useDropdown() {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown")
  }
  return context
}

export interface DropdownProps {
  children: React.ReactNode
  className?: string
}

export function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const close = React.useCallback(() => setIsOpen(false), [])

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, close])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, close }}>
      <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { isOpen, setIsOpen } = useDropdown()

    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={(e) => {
          setIsOpen((prev) => !prev)
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
DropdownTrigger.displayName = "DropdownTrigger"

export interface DropdownContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"> {
  align?: "left" | "right" | "center"
  sideOffset?: number
}

export const DropdownContent = React.forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ align = "right", sideOffset = 6, className, children, ...props }, ref) => {
    const { isOpen } = useDropdown()

    const alignmentClasses = {
      left: "left-0 origin-top-left",
      right: "right-0 origin-top-right",
      center: "left-1/2 -translate-x-1/2 origin-top",
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: sideOffset }}
            className={cn(
              "absolute z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-zen-md backdrop-blur-md focus:outline-none",
              alignmentClasses[align],
              className
            )}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
DropdownContent.displayName = "DropdownContent"

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "zen"
  inset?: boolean
  closeOnClick?: boolean
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, variant = "default", inset, closeOnClick = true, onClick, children, ...props }, ref) => {
    const { close } = useDropdown()

    const variantStyles = {
      default: "text-foreground hover:bg-muted/70 hover:text-foreground active:bg-muted",
      destructive: "text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15",
      zen: "text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/15 font-medium",
    }

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        onClick={(e) => {
          onClick?.(e)
          if (closeOnClick) close()
        }}
        className={cn(
          "relative flex w-full select-none items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium outline-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
          inset && "pl-8",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownItem.displayName = "DropdownItem"

export const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("-mx-1 my-1 h-px bg-border/60", className)}
    {...props}
  />
))
DropdownSeparator.displayName = "DropdownSeparator"

export const DropdownLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground select-none",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownLabel.displayName = "DropdownLabel"

export const DropdownGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-0.5", className)} {...props} />
))
DropdownGroup.displayName = "DropdownGroup"
