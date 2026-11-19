# Git Branch Conventions for Zenner Client

Quy định đặt tên các nhánh tính năng (Git Branches) cho dự án `zenner-client` để đảm bảo tính nhất quán và dễ theo dõi:

## Định dạng chung (General Format)

```bash
feat/<tên màn hình hoặc trang>/<tên tính năng cụ thể>
```

## Ví dụ (Examples)

- Đối với các tính năng thuộc trang chủ (Home Page):
  - Nhánh gốc của trang chủ: `feat/home-page`
  - Nhánh thêm tính năng bộ lọc lịch: `feat/home-page/calendar-filter`
  - Nhánh thêm tính năng ghi chú nhanh: `feat/home-page/quick-notes`
  - Nhánh sửa lỗi ma trận Eisenhower: `bugfix/home-page/matrix-rendering` (Sử dụng `bugfix` hoặc `fix` thay cho `feat` đối với các nhánh sửa lỗi).

- Đối với các trang khác:
  - Trang đăng nhập: `feat/login/sso-integration`
  - Trang cài đặt: `feat/settings/dark-mode-toggle`

---
*Lưu ý: Luôn tuân thủ quy định này khi tạo nhánh mới để các thành viên khác trong nhóm và AI Agent dễ dàng nắm bắt ngữ cảnh phát triển.*
