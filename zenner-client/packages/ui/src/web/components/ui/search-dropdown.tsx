import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronDown, Check, X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface SearchDropdownOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SearchDropdownProps {
  options: SearchDropdownOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
}

export function SearchDropdown({
  options,
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder = "Select an item...",
  searchPlaceholder = "Search...",
  emptyMessage = "No matching results",
  disabled = false,
  clearable = true,
  className,
  triggerClassName,
  contentClassName,
}: SearchDropdownProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? controlledValue : internalValue

  const selectedOption = options.find((opt) => opt.value === currentValue)

  // Filter options
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    )
  }, [options, searchQuery])

  // Reset highlight index when filter changes
  React.useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions])

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery("")
    }
  }, [isOpen])

  // Click outside and keydown listeners
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (option: SearchDropdownOption) => {
    if (option.disabled) return
    if (!isControlled) {
      setInternalValue(option.value)
    }
    onChange?.(option.value)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) {
      setInternalValue("")
    }
    onChange?.("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex])
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn("relative inline-block w-full font-sans select-none", className)}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3.5 py-2 text-sm text-foreground shadow-zen-inner transition-all duration-200",
          "hover:border-border hover:bg-background/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-40",
          isOpen && "border-primary/80 ring-2 ring-ring/25",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 truncate pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0 text-muted-foreground">{selectedOption.icon}</span>
          )}
          <span className={cn("truncate", !selectedOption && "text-muted-foreground/70")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              isOpen && "transform rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute z-50 mt-1.5 w-full rounded-2xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-zen-md backdrop-blur-md",
              contentClassName
            )}
          >
            {/* Search Input Box */}
            <div className="relative mb-1 flex items-center px-2 py-1">
              <Search className="size-4 shrink-0 text-muted-foreground/70 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="my-1 h-px bg-border/60" />

            {/* Options List */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-56 overflow-y-auto p-0.5 space-y-0.5 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-muted-foreground font-sans italic">
                  {emptyMessage}
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === currentValue
                  const isHighlighted = index === highlightedIndex

                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors duration-150",
                        option.disabled && "pointer-events-none opacity-40",
                        isHighlighted && !isSelected && "bg-muted/70",
                        isSelected && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {option.icon && (
                          <span
                            className={cn(
                              "shrink-0",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {option.icon}
                          </span>
                        )}
                        <div className="flex flex-col truncate">
                          <span className="truncate">{option.label}</span>
                          {option.description && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

