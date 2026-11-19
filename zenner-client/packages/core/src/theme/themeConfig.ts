import defaultThemes from './default-themes.json';

export interface ThemeConfig {
  id: string;
  name: string;
  plannerWrapper: string;
  headerDivider: string;
  toolbar: string;
  toolbarButton: string;
  toolbarButtonActive?: string;
  toolbarLogout: string;
  weekSelector: string;
  weekButtonActive: string;
  weekButtonInactive: string;
  reminderList: string;
  reminderToggleContainer: string;
  reminderToggleSeparator?: string;
  reminderToggleActiveY: string;
  reminderToggleActiveN: string;
  reminderToggleInactive: string;
  gratitudeCard: string;
  gratitudeStrip: string;
  matrixContainer: string;
  matrixUrgentHeader: string;
  matrixNotUrgentHeader: string;
  matrixImportantRow: string;
  matrixUnimportantRow: string;
  matrixCell: string;
  matrixTableHeader: string;
  matrixRowHover: string;
  matrixCheckboxActive: string;
  matrixCheckboxInactive: string;
  monthTabsContainer: string;
  monthButtonActive: string;
  monthButtonInactive: string;
  dailyGoalInput: string;
  timeblockContainer: string;
  timeblockHeader: string;
  timeblockModeLabel: string;
  timeblockTimeAxis: string;
  timeblockGridLine: string;
  timeblockEventCard: string;
  dropdownMenu: string;
  dropdownItemActive: string;
  dropdownItemInactive: string;
}

// Interface phục vụ riêng cho gói UI Timeblock độc lập
export interface TimeblockThemeConfig {
  id: string;
  timeblockContainer: string;
  timeblockHeader: string;
  timeblockModeLabel: string;
  timeblockTimeAxis: string;
  timeblockGridLine: string;
  timeblockEventCard: string;
}

// Cast array defaultThemes thành kiểu dữ liệu cụ thể
const defaultThemesCast = defaultThemes as ThemeConfig[];

// Fallback theme mặc định
export const defaultTheme = defaultThemesCast[0];

// Key lưu trữ localStorage
export const CUSTOM_THEMES_STORAGE_KEY = 'zenner-boost-themes';

// Hàm đọc danh sách theme gộp từ JSON mặc định, localStorage hoặc custom JSON đầu vào
export function getThemeList(customThemesJson?: string): ThemeConfig[] {
  const defaults = defaultThemesCast;

  // 1. Nạp JSON trực tiếp (Dành cho Mobile load từ AsyncStorage/DB hoặc Desktop đọc file)
  if (customThemesJson) {
    try {
      const customThemes = JSON.parse(customThemesJson) as ThemeConfig[];
      if (Array.isArray(customThemes)) {
        const filteredCustoms = customThemes.filter(
          ct => ct && ct.id && !defaults.some(d => d.id === ct.id)
        );
        return [...defaults, ...filteredCustoms];
      }
    } catch (e) {
      console.error("Lỗi parse customThemesJson trong getThemeList:", e);
    }
  }

  // 2. Fallback sang localStorage nếu chạy trên Web Browser
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawThemes = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      if (rawThemes) {
        const customThemes = JSON.parse(rawThemes) as ThemeConfig[];
        if (Array.isArray(customThemes)) {
          const filteredCustoms = customThemes.filter(
            ct => ct && ct.id && !defaults.some(d => d.id === ct.id)
          );
          return [...defaults, ...filteredCustoms];
        }
      }
    } catch (err) {
      console.error("Lỗi khi đọc zenner-boost-themes từ localStorage:", err);
    }
  }

  return defaults;
}

/**
 * Lưu theme mới do người dùng tạo/import từ JSON plugin
 */
export function saveCustomTheme(input: Partial<ThemeConfig>): {
  success: boolean;
  error?: string;
  theme?: ThemeConfig;
} {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Dữ liệu JSON không hợp lệ' };
  }

  const id = input.id?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!id) {
    return { success: false, error: 'Theme cần có trường "id" hợp lệ' };
  }

  if (id === 'default') {
    return { success: false, error: 'Không thể ghi đè theme mặc định ("default")' };
  }

  const name = input.name?.trim() || id;

  // Kết hợp với theme mặc định để tự động bổ sung các trường còn thiếu nếu JSON chỉ định nghĩa một phần
  const completeTheme: ThemeConfig = {
    ...defaultTheme,
    ...input,
    id,
    name,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      let list: ThemeConfig[] = [];
      if (raw) {
        list = JSON.parse(raw) as ThemeConfig[];
        if (!Array.isArray(list)) list = [];
      }

      // Xóa bản cũ nếu trùng id rồi thêm bản mới
      list = list.filter((t) => t.id !== id);
      list.push(completeTheme);

      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(list));

      // Bắn sự kiện window để các component lắng nghe cập nhật ngay lập tức
      window.dispatchEvent(new CustomEvent('zenner:theme-updated', { detail: completeTheme }));

      return { success: true, theme: completeTheme };
    } catch (e) {
      return { success: false, error: 'Không thể lưu vào localStorage: ' + String(e) };
    }
  }

  return { success: false, error: 'Môi trường không hỗ trợ localStorage' };
}

/**
 * Xóa custom theme đã tạo
 */
export function deleteCustomTheme(themeId: string): boolean {
  if (themeId === 'default') return false;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      if (!raw) return false;

      let list = JSON.parse(raw) as ThemeConfig[];
      if (!Array.isArray(list)) return false;

      const filtered = list.filter((t) => t.id !== themeId);
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(filtered));

      window.dispatchEvent(new CustomEvent('zenner:theme-updated', { detail: { id: themeId, deleted: true } }));
      return true;
    } catch (e) {
      console.error('Lỗi khi xóa custom theme:', e);
      return false;
    }
  }
  return false;
}

/**
 * Xuất mẫu file JSON plugin để người dùng dễ dàng tùy biến
 */
export function getDefaultThemeTemplate(): string {
  const template: Partial<ThemeConfig> = {
    id: "my-custom-theme",
    name: "My Custom Theme",
    plannerWrapper: "flex-1 h-full max-h-full bg-card/95 text-card-foreground border border-border/80 rounded-3xl shadow-zen-lg p-4 md:p-6 flex flex-col lg:flex-row gap-6 select-none overflow-hidden",
    headerDivider: "flex items-center justify-between gap-4 flex-shrink-0 border-b border-border/80 pb-3",
    toolbar: "flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/70 relative",
    toolbarButton: "text-muted-foreground hover:text-foreground hover:bg-card/80 w-7 h-7 p-0 rounded-lg font-medium text-[10px] flex items-center justify-center transition-all",
    toolbarButtonActive: "bg-card text-foreground shadow-zen-sm font-semibold",
    toolbarLogout: "text-destructive/80 hover:text-destructive hover:bg-destructive/10 w-7 h-7 p-0 rounded-lg flex items-center justify-center transition-colors",
    weekSelector: "flex flex-wrap items-center justify-between gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/70",
    weekButtonActive: "flex-1 min-w-[80px] py-1.5 text-center text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-zen-sm",
    weekButtonInactive: "flex-1 min-w-[80px] py-1.5 text-center text-xs font-medium rounded-xl text-muted-foreground hover:bg-card/70 hover:text-foreground",
    reminderList: "border border-border/80 bg-card/90 rounded-2xl p-3.5 md:p-4 shadow-zen-sm flex flex-col gap-2 flex-shrink-0",
    gratitudeCard: "border border-primary/25 rounded-2xl p-3 bg-accent/40 text-center relative overflow-hidden flex-shrink-0",
    matrixContainer: "flex-1 min-h-0 matrix-grid border border-border/80 rounded-2xl overflow-hidden shadow-zen-inner bg-card/40",
    matrixCell: "bg-card/90 p-2.5 flex flex-col gap-1 min-h-0 overflow-hidden",
    timeblockContainer: "flex flex-col h-full bg-card/90 text-card-foreground rounded-2xl border border-border/80 shadow-zen-sm overflow-hidden select-none",
    timeblockHeader: "px-4 py-2.5 border-b border-border/80 bg-muted/30 flex justify-between items-center",
  };

  return JSON.stringify(template, null, 2);
}
