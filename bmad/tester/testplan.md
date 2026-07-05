# Testing Plan & Quality Assurance Document

**Phiên bản**: 1.0  
**Tác giả**: QA/Tester AI Agent (BMAD Method)  
**Ngày**: 2026-07-05  

---

## 1. Kế hoạch Kiểm thử Tổng quát
Mục tiêu là đảm bảo tất cả tính năng của ứng dụng (Tiếng Anh, Toán Lớp 2, Quản lý đa người dùng và đồng bộ Firebase) hoạt động hoàn hảo, không có lỗi logic, giao diện responsive và các thuật toán hoạt động chính xác.

---

## 2. Danh sách các Ca kiểm thử (Testcases)

### 2.1. Quản lý Đa Người dùng (Multi-user & Account)
*   **TC01: Đăng ký mã học sinh mới thành công**
    *   *Các bước*: Mở ứng dụng -> Nhập mã học sinh `binh_2026` và Họ tên -> Nhấn Đăng ký.
    *   *Mong đợi*: Tài khoản được tạo trên Firebase, ứng dụng tự động đăng nhập và hiển thị tên "Nguyễn Văn Bình".
*   **TC02: Đăng ký mã học sinh đã tồn tại**
    *   *Các bước*: Nhập mã học sinh trùng với mã đã có -> Nhấn Đăng ký.
    *   *Mong đợi*: Hệ thống báo lỗi "Mã học sinh đã tồn tại" và yêu cầu nhập mã khác.
*   **TC03: Đăng nhập mã cũ thành công**
    *   *Các bước*: Đăng xuất -> Nhập mã học sinh cũ `binh_2026` -> Nhấn Đăng nhập.
    *   *Mong đợi*: Ứng dụng khôi phục thành công toàn bộ tiến trình học tập của học sinh đó.

### 2.2. Chọn môn học & Chương trình học Toán lớp 2
*   **TC04: Chuyển đổi môn học trên Trang chủ**
    *   *Các bước*: Click chọn tab "Toán học" -> Click chọn tab "Tiếng Anh".
    *   *Mong đợi*: Danh sách bài học thay đổi tương ứng. Màu sắc chủ đạo của trang web thay đổi mượt mà.
*   **TC05: Đọc danh sách 75 bài học từ Firebase**
    *   *Các bước*: Kiểm tra giao diện bài học Toán.
    *   *Mong đợi*: Hiển thị đầy đủ 75 bài học chia theo 14 chủ đề bám sát mục lục SGK.

### 2.3. Trải nghiệm học Toán & Giải thích trực quan
*   **TC06: Sinh câu hỏi tự động đúng theo bài học**
    *   *Các bước*: Vào Bài 39 (Bảng nhân 2) để làm quiz.
    *   *Mong đợi*: Các câu hỏi tạo ra đều thuộc bảng nhân 2 (Ví dụ: `2 x 4`, `2 x 8`).
*   **TC07: Hiển thị Đặt tính dọc khi tính sai phép cộng/trừ**
    *   *Các bước*: Làm sai câu hỏi phép cộng có nhớ `47 + 28`.
    *   *Mong đợi*: Hiện bảng giải thích đặt dọc, hiển thị chi tiết các bước cộng hàng đơn vị (7 + 8 = 15 viết 5 nhớ 1) và hàng chục.
*   **TC08: Hiển thị giải thích đồng hồ SVG khi xem giờ sai**
    *   *Các bước*: Làm bài tập xem giờ đồng hồ và chọn sai đáp án.
    *   *Mong đợi*: Hiện đồng hồ minh họa rõ kim giờ, kim phút kèm giải thích vì sao là đáp án đúng.

### 2.4. Lưu tiến độ & Spaced Repetition
*   **TC09: Đồng bộ tiến trình lên Firebase**
    *   *Các bước*: Hoàn thành trả lời 1 câu hỏi -> Mở Firebase Console.
    *   *Mong đợi*: Node `users/{username}/progress` xuất hiện bản ghi mới chứa biểu thức toán vừa làm.
*   **TC10: Ôn tập Spaced Repetition (Lặp lại ngắt quãng)**
    *   *Các bước*: Cố tình trả lời sai phép tính `5 x 9 = 45` -> Vào phần Ôn tập của bài bảng nhân.
    *   *Mong đợi*: Phép tính `5 x 9` xuất hiện sớm nhất để kiểm tra lại kiến thức của bé.

### 2.5. Trang thống kê (Dashboard)
*   **TC11: Dashboard hiển thị đầy đủ 2 môn học**
    *   *Các bước*: Mở trang Tiến độ học tập -> Chuyển đổi giữa 2 tab Tiếng Anh và Toán.
    *   *Mong đợi*: Thống kê và biểu đồ ngày cập nhật chính xác tiến trình của học sinh đang đăng nhập.
