import { useState, useEffect } from 'react';
import { 
  initialMockData, 
  MockHomeData 
} from '../mockData';

export function useHomeData() {
  // Khởi tạo state với mock data
  const [pageData, setPageData] = useState<MockHomeData>(initialMockData);
  const [, setThemesTick] = useState(0);

  // Boost theme: Đọc trạng thái từ localStorage, mặc định là 'default'
  const [themeBoost, setThemeBoost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('zenner-boost-theme-selected');
      if (savedTheme) return savedTheme;
    }
    return 'default';
  });

  // Lắng nghe sự kiện cập nhật/xóa custom theme
  useEffect(() => {
    const handleThemeUpdate = (e: Event) => {
      setThemesTick((t) => t + 1);
      const detail = (e as CustomEvent).detail;
      if (detail && detail.deleted && detail.id === themeBoost) {
        toggleThemeBoost('default');
      }
    };

    window.addEventListener('zenner:theme-updated', handleThemeUpdate);
    return () => {
      window.removeEventListener('zenner:theme-updated', handleThemeUpdate);
    };
  }, [themeBoost]);

  const toggleThemeBoost = (theme: string) => {
    setThemeBoost(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenner-boost-theme-selected', theme);
    }
  };

  // Toggle trạng thái Y/N của nhắc nhở (Silent Save)
  const handleToggleReminder = (reminderId: string) => {
    setPageData((prev) => {
      const updatedReminders = prev.reminders.map((rem) => {
        if (rem.id === reminderId) {
          return { ...rem, value: rem.value === 'Y' ? 'N' : ('Y' as 'Y' | 'N') };
        }
        return rem;
      });
      return { ...prev, reminders: updatedReminders };
    });
  };

  // Toggle trạng thái hoàn thành task trong bảng Do (Silent Save)
  const handleToggleDoTask = (taskId: string) => {
    setPageData((prev) => {
      const updatedDo = prev.matrix.do.map((task) => {
        if (task.id === taskId) {
          return { ...task, done: !task.done };
        }
        return task;
      });
      return {
        ...prev,
        matrix: {
          ...prev.matrix,
          do: updatedDo
        }
      };
    });
  };

  // Cập nhật hoạt động ghi chép tự do (Silent Save)
  const handleTimeGoalChange = (value: string) => {
    setPageData((prev) => ({ ...prev, dailyGoal: value }));
  };

  // Chọn tuần
  const handleSelectWeek = (week: string) => {
    setPageData((prev) => ({ ...prev, selectedWeek: week }));
  };

  // Chọn tháng
  const handleSelectMonth = (month: string) => {
    setPageData((prev) => ({ ...prev, selectedMonth: month }));
  };

  return {
    pageData,
    setPageData,
    themeBoost,
    toggleThemeBoost,
    handleToggleReminder,
    handleToggleDoTask,
    handleTimeGoalChange,
    handleSelectWeek,
    handleSelectMonth
  };
}
