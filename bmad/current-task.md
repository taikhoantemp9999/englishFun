# Current Task: Nâng cấp Tiếng Anh & Toán Lớp 2 Đa Người Dùng (Firebase)

- **Trạng thái**: `COMPLETED & VERIFIED`
- **Môn học**: Tiếng Anh Lớp 2 (Global Success) & Toán Lớp 2 (NXB Giáo dục)
- **Đồng bộ**: Đám mây Firebase Realtime Database

---

## 📋 Nhật Ký Điều Phối Công Việc (Agent Log)

### 1. Planner Agent (Antigravity)
- **Công việc**:
  - Nghiên cứu mục lục SGK Tiếng Anh lớp 2 Global Success và Toán lớp 2.
  - Phân tích và viết yêu cầu trong `bmad/pm/prd.md`.
  - Thiết kế cấu trúc dữ liệu Firebase và giải pháp Spaced Repetition trong `bmad/architect/design.md`.
  - Định nghĩa luồng làm việc cho Builder trong `bmad/developer/guide.md`.
- **Trạng thái**: `DONE` -> Chuyển sang `BUILD_READY`

### 2. Builder Agent (Developer)
- **Công việc**:
  - Cập nhật trang chủ `index.html` với Login/Register Modal và Switcher 2 môn học.
  - Sửa `js/lesson-loader.js` để đọc ghi bài học từ Firebase Realtime Database.
  - Viết dữ liệu 16 bài học tiếng Anh lớp 2 vào `data/english_lessons.json`.
  - Nâng cấp màn hình học toán `pages/hoctoan.html` tích hợp `MathQuestionGenerator`, vẽ SVG kim đồng hồ động, thước đo cm và làm đặt tính dọc chi tiết từng bước khi bé trả lời sai.
  - Nâng cấp `pages/dashboard.html` hiển thị thống kê 2 môn học, Chart.js tiến trình học 7 ngày và danh sách câu hay làm sai.
- **Trạng thái**: `DONE` -> Chuyển sang `REVIEW_READY`

### 3. Reviewer Agent
- **Công việc**:
  - Đọc lại code trong `index.html`, `hoctoan.html`, `dashboard.html`.
  - Đảm bảo giữ nguyên các comment cũ của người dùng.
  - Kiểm tra việc bảo mật Firebase và các hàm đồng bộ tiến trình theo tài khoản.
- **Trạng thái**: `APPROVED` -> Chuyển sang `TEST_READY`

### 4. Tester Agent
- **Công việc**:
  - So khớp các chức năng với kịch bản kiểm thử trong `bmad/tester/testplan.md`.
  - Đảm bảo các ca kiểm thử: đăng nhập, đổi tài khoản, chuyển môn học, vẽ SVG trực quan, lưu Firebase, vẽ biểu đồ Chart.js hoạt động hoàn hảo không phát sinh lỗi Console.
- **Trạng thái**: `VERIFIED`

---

## 🛠️ Trạng Thái Danh Sách File Cập Nhật

- `[x]` [index.html](file:///c:/Users/Admin/Desktop/eng/englishFun/index.html) (Cập nhật giao diện trang chủ đa học sinh)
- `[x]` [lesson-loader.js](file:///c:/Users/Admin/Desktop/eng/englishFun/js/lesson-loader.js) (Chuyển đổi nạp bài học lên Firebase)
- `[x]` [english_lessons.json](file:///c:/Users/Admin/Desktop/eng/englishFun/data/english_lessons.json) (Tạo dữ liệu Tiếng Anh lớp 2 mới)
- `[x]` [hoctoan.html](file:///c:/Users/Admin/Desktop/eng/englishFun/pages/hoctoan.html) (Cập nhật học toán trực quan đặt tính dọc & SVG)
- `[x]` [dashboard.html](file:///c:/Users/Admin/Desktop/eng/englishFun/pages/dashboard.html) (Thống kê 2 môn học & biểu đồ Chart.js)
- `[x]` [AGENTS.md](file:///c:/Users/Admin/Desktop/eng/englishFun/AGENTS.md) (Quy trình phối hợp 4 agent)
