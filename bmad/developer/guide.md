# Coding & Implementation Guide for Developers

**Phiên bản**: 1.0  
**Tác giả**: Developer AI Agent (BMAD Method)  
**Ngày**: 2026-07-05  

---

## 1. Nguyên tắc Lập trình chung
1.  **Vanilla Technology**: Chỉ sử dụng HTML, CSS thuần túy và JavaScript ES6. Tránh import các framework lớn hoặc thư viện bên ngoài không cần thiết.
2.  **Đồng bộ hóa Firebase**: Firebase Realtime Database là nguồn chân lý. LocalStorage chỉ dùng để cache. Khi có thay đổi tiến độ, lập tức đồng bộ lên Firebase.
3.  **Bảo toàn Mã nguồn cũ**: Giữ lại các phần comment, logic cũ trong `backup/` để đối chiếu. Đảm bảo phần tiếng Anh hoạt động bình thường, không bị lỗi khi tích hợp môn Toán.
4.  **UI/UX Thân thiện**: Dành cho trẻ em Lớp 1 và Lớp 2. Nút bấm phải to, phản hồi trực quan bằng màu sắc (xanh = đúng, đỏ = sai), hiệu ứng pháo hoa, âm thanh động viên.

---

## 2. Chi tiết các tệp cần sửa đổi & tạo mới

### 2.1. [NEW] `data/math_lessons.json`
Chứa danh sách 75 bài học Toán lớp 2 với cấu trúc gồm: `id`, `title`, `chapter`, `type` và các tham số cấu hình phép tính (`range`, `multipliers`, `divisors`...).

### 2.2. [NEW] `js/math-question-gen.js`
Định nghĩa đối tượng `MathQuestionGenerator` hỗ trợ sinh câu hỏi cho các dạng bài:
*   `generateAdditionCarry(range)`: Phép cộng phạm vi 100 có nhớ (Ví dụ: `35 + 27`, `8 + 6`).
*   `generateSubtractionBorrow(range)`: Phép trừ phạm vi 100 có nhớ (Ví dụ: `63 - 25`, `12 - 5`).
*   `generateMultiplication(multipliers)`: Các phép nhân trong bảng nhân 2 và 5.
*   `generateDivision(divisors)`: Các phép chia tương ứng trong bảng chia 2 và 5.
*   `generateComparison(range)`: So sánh 2 biểu thức hoặc số (Ví dụ: `35 + 12 ... 50`).
*   `generateMeasurement(type)`: Câu hỏi đổi đơn vị đo độ dài (`3 dm = ... cm`) hoặc cộng trừ đơn vị (`5 kg + 8 kg = ... kg`, `15 l - 7 l = ... l`).
*   `generateTime(type)`: Đọc giờ đồng hồ ảo (kim ngắn chỉ số 3, kim dài chỉ số 6 là mấy giờ?) hoặc xem lịch ngày tháng.
*   `generateGeometry(type)`: Câu hỏi đếm hình phẳng hoặc nhận diện khối trụ, khối cầu.
*   `generateStatistics(type)`: Đọc biểu đồ tranh đơn giản hoặc xác suất (chắc chắn, có thể, không thể).

### 2.3. [MODIFY] `js/quiz-progress.js`
*   Thay đổi `userId` thành `username` để dùng Mã học sinh thân thiện.
*   Bổ sung hàm `login(username)`: Đọc `users/{username}` trên Firebase, nếu có thì lưu username vào LocalStorage và cập nhật trạng thái đăng nhập.
*   Bổ sung hàm `register(username, fullName)`: Tạo bản ghi học sinh mới trên Firebase.
*   Cập nhật hàm `update(question, isCorrect)` để hỗ trợ `type: 'math'`. Khi làm toán, lấy `question.expression` làm khóa chính lưu tiến độ của biểu thức toán đó.
*   Loại bỏ toàn bộ File System Access API ghi đè file JSON offline.

### 2.4. [MODIFY] `index.html`
*   Thêm Modal Login/Register khi vào ứng dụng nếu chưa có tài khoản.
*   Thêm Account Widget hiển thị Họ tên học sinh hiện tại, nút "Đăng xuất" hoặc "Đổi tài khoản".
*   Thêm Switcher Môn học (Tiếng Anh / Toán học) với CSS bắt mắt.
*   Đọc `lessons/math` từ Firebase để hiển thị danh sách 75 bài học Toán theo cấu trúc chủ đề.

### 2.5. [MODIFY] `pages/hoctoan.html`
*   Lấy tham số `lesson` từ URL, đọc thông tin bài học từ Firebase.
*   Hiển thị màn hình giới thiệu bài học sinh động (bài học dạy về cái gì, ví dụ ngắn gọn) trước khi làm quiz.
*   Khi bé làm bài:
    *   Gọi `MathQuestionGenerator.generate()` để lấy bộ câu hỏi.
    *   Sau mỗi câu trả lời, gọi `ProgressManager.update` để lưu kết quả lên Firebase.
    *   Nếu trả lời sai, vẽ sơ đồ **đặt tính đặt dọc** hoặc hiển thị hình minh họa giải thích chi tiết đáp án.

### 2.6. [MODIFY] `pages/dashboard.html`
*   Thêm Tab Switcher hiển thị Tiến độ Tiếng Anh / Tiến độ Toán.
*   Vẽ biểu đồ số câu làm đúng/sai hàng ngày cho từng môn học.
*   Hiển thị danh sách các phép toán bé hay làm sai và cần ôn tập.
