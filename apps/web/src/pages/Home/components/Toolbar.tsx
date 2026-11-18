import { useState, useEffect } from 'react';
import { Button, Plus, Trash2 } from '@zenner/ui';
import { ThemeConfig, getThemeList, deleteCustomTheme } from '@zenner/core/theme/themeConfig';
import { CustomThemeModal } from './CustomThemeModal';

// SVG Icons cho Toolbar
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

interface ToolbarProps {
  currentLanguage: string;
  resolvedTheme: string;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  logout: () => void;
  logoutLabel: string;
  themeBoost: string;
  toggleThemeBoost: (theme: string) => void;
  themeConfig: ThemeConfig;
}

export function Toolbar({
  currentLanguage,
  resolvedTheme,
  toggleLanguage,
  toggleTheme,
  logout,
  logoutLabel,
  themeBoost,
  toggleThemeBoost,
  themeConfig
}: ToolbarProps) {
  const [isOpenSettings, setIsOpenSettings] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [themes, setThemes] = useState<ThemeConfig[]>(() => getThemeList());

  // Lắng nghe sự kiện cập nhật theme để refresh danh sách
  useEffect(() => {
    const handleThemeUpdate = () => {
      setThemes(getThemeList());
    };

    window.addEventListener('zenner:theme-updated', handleThemeUpdate);
    return () => {
      window.removeEventListener('zenner:theme-updated', handleThemeUpdate);
    };
  }, []);

  const handleDeleteTheme = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa theme tùy biến này?')) {
      deleteCustomTheme(themeId);
      if (themeBoost === themeId) {
        toggleThemeBoost('default');
      }
      setThemes(getThemeList());
    }
  };

  return (
    <>
      <div className={themeConfig.toolbar}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className={themeConfig.toolbarButton}
        >
          {currentLanguage === 'vi' ? 'EN' : 'VI'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={themeConfig.toolbarButton}
        >
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
        
        {/* Nút Setting có Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpenSettings(!isOpenSettings)}
            className={`${themeConfig.toolbarButton} ${isOpenSettings && themeConfig.toolbarButtonActive ? themeConfig.toolbarButtonActive : ''}`}
            aria-label="Settings"
          >
            <SettingsIcon />
          </Button>

          {isOpenSettings && (
            <>
              {/* Overlay vô hình để click ra ngoài đóng menu */}
              <div className="fixed inset-0 z-40" onClick={() => setIsOpenSettings(false)} />
              
              {/* Dropdown Menu Box */}
              <div className={themeConfig.dropdownMenu}>
                {/* Header với nút Thêm Theme (+) */}
                <div className="flex items-center justify-between px-2 py-1 select-none border-b border-border/50 pb-1.5 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Boost Theme
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                      setIsOpenSettings(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors p-1 rounded-lg hover:bg-muted"
                    title="Thêm Theme mới bằng file JSON"
                  >
                    <Plus className="size-3.5" />
                    <span>Thêm theme</span>
                  </button>
                </div>
                
                {/* Render danh sách theme động */}
                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {themes.map((themeItem) => {
                    const isActive = themeBoost === themeItem.id;
                    const isCustom = themeItem.id !== 'default';
                    
                    return (
                      <div
                        key={themeItem.id}
                        className="group flex items-center justify-between rounded-xl hover:bg-muted/60 transition-colors"
                      >
                        <button
                          onClick={() => {
                            toggleThemeBoost(themeItem.id);
                            setIsOpenSettings(false);
                          }}
                          className={`${isActive ? themeConfig.dropdownItemActive : themeConfig.dropdownItemInactive} flex-1`}
                        >
                          <span className="truncate pr-1">{themeItem.name}</span>
                          {isActive && <CheckIcon />}
                        </button>

                        {/* Nút xóa dành cho custom themes */}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTheme(e, themeItem.id)}
                            className="p-1.5 mr-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Xóa theme này"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Nút dấu cộng nổi bật dưới đáy menu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsOpenSettings(false);
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-xl text-[11px] font-medium text-primary hover:bg-primary/10 border border-dashed border-primary/30 transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>Tạo Theme từ JSON...</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="w-[1px] h-4 bg-border self-center mx-0.5" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={themeConfig.toolbarLogout}
          aria-label={logoutLabel}
        >
          <LogOutIcon />
        </Button>
      </div>

      {/* Modal Tạo/Nhập Theme Custom bằng file JSON */}
      <CustomThemeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onThemeSaved={(newThemeId) => {
          toggleThemeBoost(newThemeId);
          setThemes(getThemeList());
        }}
      />
    </>
  );
}
