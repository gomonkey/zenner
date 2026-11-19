// Base UI Components
export { Button, buttonVariants } from "./src/web/components/ui/button";
export type { ButtonProps } from "./src/web/components/ui/button";

export { Input } from "./src/web/components/ui/input";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./src/web/components/ui/card";

export { Label } from "./src/web/components/ui/label";

// Progress Bars
export { CircleProgressBar } from "./src/web/components/ui/circle-progress-bar";
export type { CircleProgressBarProps } from "./src/web/components/ui/circle-progress-bar";

export { ProgressBar } from "./src/web/components/ui/progress-bar";
export type { ProgressBarProps } from "./src/web/components/ui/progress-bar";

// Toast System
export { Toast, ToastContainer, useToast, toast, dismissToast } from "./src/web/components/ui/toast";
export type { ToastProps, ToastItem, ToastOptions, ToastVariant, ToastContainerProps } from "./src/web/components/ui/toast";

// Dropdown Menu
export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  DropdownGroup,
} from "./src/web/components/ui/dropdown";
export type {
  DropdownProps,
  DropdownTriggerProps,
  DropdownContentProps,
  DropdownItemProps,
} from "./src/web/components/ui/dropdown";

// Search Dropdown / Combobox
export { SearchDropdown } from "./src/web/components/ui/search-dropdown";
export type { SearchDropdownProps, SearchDropdownOption } from "./src/web/components/ui/search-dropdown";

// Notification System
export {
  NotificationBell,
  NotificationItem,
  NotificationList,
} from "./src/web/components/ui/notification";
export type {
  NotificationData,
  NotificationType,
  NotificationBellProps,
  NotificationItemProps,
  NotificationListProps,
} from "./src/web/components/ui/notification";

// Dialog / Modal
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./src/web/components/ui/dialog";
export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
} from "./src/web/components/ui/dialog";

// Utilities & Complex Widgets
export { cn } from "./src/web/lib/utils";
export { Timeblock } from "./src/web/components/Timeblock";
export type { TimeblockEvent } from "./src/web/components/Timeblock";

// Icons
export {
  Plus,
  Trash2,
  Upload,
  Download,
  Copy,
  Check,
  FileJson,
  AlertCircle,
  Sun,
  Moon,
  Settings,
  LogOut,
  X,
  Search,
  Bell,
} from "lucide-react";
