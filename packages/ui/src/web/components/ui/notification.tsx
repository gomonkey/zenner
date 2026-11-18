import * as React from "react"
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "../../lib/utils"

export type NotificationType = "info" | "success" | "warning" | "error" | "zen"

export interface NotificationData {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type?: NotificationType
  link?: string
}

/* ==========================================================================
   1. Notification Bell & Badge
   ========================================================================== */
export interface NotificationBellProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  unreadCount?: number
  hasUnread?: boolean
}

export const NotificationBell = React.forwardRef<HTMLButtonElement, NotificationBellProps>(
  ({ unreadCount = 0, hasUnread, className, ...props }, ref) => {
    const showDot = hasUnread !== undefined ? hasUnread : unreadCount > 0

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground transition-all duration-200",
          "hover:bg-muted/70 hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          className
        )}
        aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ""}`}
        {...props}
      >
        <Bell className="size-4.5" />
        {showDot && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        )}
        {unreadCount > 0 && unreadCount <= 99 && (
          <span className="sr-only">{unreadCount} thông báo mới</span>
        )}
      </button>
    )
  }
)
NotificationBell.displayName = "NotificationBell"

/* ==========================================================================
   2. Notification Item
   ========================================================================== */
const typeIconMap: Record<NotificationType, React.ReactNode> = {
  info: <Info className="size-4 text-muted-foreground" />,
  zen: <CheckCircle2 className="size-4 text-primary" />,
  success: <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
  warning: <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />,
  error: <AlertCircle className="size-4 text-destructive" />,
}

export interface NotificationItemProps extends React.HTMLAttributes<HTMLDivElement> {
  notification: NotificationData
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onClickItem?: (notification: NotificationData) => void
}

export const NotificationItem = React.forwardRef<HTMLDivElement, NotificationItemProps>(
  ({ notification, onMarkAsRead, onDelete, onClickItem, className, ...props }, ref) => {
    const { id, title, message, timestamp, read, type = "zen" } = notification

    return (
      <div
        ref={ref}
        onClick={() => onClickItem?.(notification)}
        className={cn(
          "group relative flex items-start gap-3 rounded-xl p-3 transition-all duration-200 cursor-pointer font-sans select-none",
          read
            ? "bg-transparent text-muted-foreground hover:bg-muted/40"
            : "bg-muted/30 text-foreground hover:bg-muted/60 border border-border/70",
          className
        )}
        {...props}
      >
        {/* Type Icon */}
        <div className="mt-0.5 shrink-0 rounded-lg bg-background p-1.5 shadow-zen-sm border border-border/50">
          {typeIconMap[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-baseline justify-between gap-2">
            <h6
              className={cn(
                "text-xs truncate font-medium",
                !read && "font-semibold text-foreground"
              )}
            >
              {title}
            </h6>
            <span className="text-[10px] text-muted-foreground shrink-0 font-sans">
              {timestamp}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Quick action buttons on hover */}
        <div className="absolute right-2 top-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {!read && onMarkAsRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(id)
              }}
              title="Đánh dấu đã đọc"
              className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              <Check className="size-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(id)
              }}
              title="Xóa thông báo"
              className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
NotificationItem.displayName = "NotificationItem"

/* ==========================================================================
   3. Notification List Container
   ========================================================================== */
export interface NotificationListProps {
  notifications: NotificationData[]
  title?: string
  emptyMessage?: string
  onMarkAllAsRead?: () => void
  onClearAll?: () => void
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  onClickItem?: (notification: NotificationData) => void
  className?: string
}

export function NotificationList({
  notifications,
  title = "Thông báo",
  emptyMessage = "Tâm hồn tĩnh lặng, không có thông báo mới.",
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
  onDelete,
  onClickItem,
  className,
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-sm rounded-2xl border border-border/80 bg-popover/95 shadow-zen-lg backdrop-blur-md overflow-hidden font-sans",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">{title}</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Đã đọc tất cả
            </button>
          )}
          {notifications.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              Xóa hết
            </button>
          )}
        </div>
      </div>

      {/* Notifications Body */}
      <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="mb-2 rounded-full bg-muted/60 p-3 text-muted-foreground">
              <Bell className="size-5" />
            </div>
            <p className="text-xs text-muted-foreground font-sans italic max-w-[200px]">
              {emptyMessage}
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              onClickItem={onClickItem}
            />
          ))
        )}
      </div>
    </div>
  )
}
