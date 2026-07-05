# Product Requirements Document (PRD) - English & Math Fun

**Phiên bản**: 1.0  
**Tác giả**: PM AI Agent (BMAD Method)  
**Ngày**: 2026-07-05  

---

## 1. Tổng quan Sản phẩm
English & Math Fun là một nền tảng học tập trực tuyến tích hợp dành cho học sinh tiểu học, kết hợp học **Tiếng Anh (Lớp 1)** và **Toán học (Lớp 2)**. Ứng dụng được thiết kế tối giản, trực quan giúp trẻ em tự học dễ dàng mà không cần sự giám sát liên tục của phụ huynh, đồng thời lưu trữ và đồng bộ tiến độ học tập trên nền tảng đám mây Firebase Realtime Database để hỗ trợ nhiều người học độc lập.

---

## 2. Mục tiêu Dự án
1. **Dễ hiểu & Tự học**: Xây dựng cơ chế giải thích trực quan (đặt tính dọc, hình ảnh SVG sinh động) mỗi khi bé làm sai để bé tự sửa lỗi và học tập một cách tự nhiên.
2. **Đa người dùng (Multi-user)**: Cho phép tạo tài khoản bằng Mã học sinh thân thiện (không cần email phức tạp) để lưu trữ tiến độ độc lập cho nhiều người dùng.
3. **Đồng bộ hóa đám mây (Firebase)**: Loại bỏ các file JSON lưu cục bộ, chuyển toàn bộ chương trình học và tiến trình của học sinh lên Firebase.
4. **Chuẩn chương trình SGK**: Thiết kế 75 bài học Toán lớp 2 bám sát 100% mục lục sách giáo khoa mới của Nhà xuất bản Giáo dục Việt Nam.

---

## 3. Đối tượng sử dụng
*   **Học sinh Lớp 1 & Lớp 2**: Người trực tiếp tương tác, làm quiz, xem hình ảnh minh họa.
*   **Phụ huynh học sinh**: Người thiết lập tài khoản, theo dõi báo cáo tiến độ học tập và điểm yếu của con để hỗ trợ khi cần thiết.

---

## 4. Yêu cầu Chức năng Chi tiết

### 4.1. Quản lý Tài khoản Học sinh (Multi-user)
*   **Đăng ký tài khoản**: Bé hoặc phụ huynh nhập một **Mã học sinh** (Ví dụ: `binh_lop2`, `mai_2a`) và Họ tên để bắt đầu. Hệ thống sẽ kiểm tra xem mã đã tồn tại chưa.
*   **Đăng nhập bằng mã cũ**: Nhập mã học sinh để khôi phục toàn bộ tiến trình học tập từ Firebase trên bất kỳ thiết bị nào.
*   **Chuyển đổi tài khoản**: Nút Đăng xuất/Đổi tài khoản hiển thị rõ trên màn hình chính để các bé học chung máy có thể chuyển đổi nhanh chóng.

### 4.2. Lựa chọn Môn học (English / Math)
*   Trang chủ (`index.html`) hiển thị bộ chọn môn học nổi bật:
    *   **🇬🇧 Tiếng Anh**: Hiển thị danh sách bài học tiếng Anh lớp 1.
    *   **🔢 Toán học**: Hiển thị danh sách 75 bài học Toán lớp 2.
*   Hiệu ứng chuyển đổi mượt mà, màu sắc rực rỡ (màu tím/xanh cho Tiếng Anh, màu cam/vàng vui tươi cho Toán).

### 4.3. Mô-đun Học Toán Lớp 2 (75 Bài học)
*   Tải 75 bài học từ Firebase (chia làm 14 chủ đề bám sát SGK NXB Giáo dục).
*   Mỗi bài học hỗ trợ:
    *   **🎮 Luyện tập (Quiz)**: Sinh 10-20 câu hỏi ngẫu nhiên phù hợp với loại bài học (Cộng, trừ, nhân, chia, đo lường, hình học, thời gian).
    *   **🔁 Ôn tập**: Tập trung ôn luyện các câu hỏi hoặc phép tính mà bé đã làm sai trước đó (áp dụng Spaced Repetition).
*   **Giải thích trực quan khi làm sai**:
    *   *Số học*: Đặt tính dọc và ghi chú hướng dẫn từng cột (đơn vị, chục, trăm) rõ ràng.
    *   *Đo lường/Hình học/Thời gian*: Vẽ hình minh họa SVG dễ hiểu giải thích đáp án.

### 4.4. Mô-đun Học Tiếng Anh
*   Học từ vựng và câu qua các kỹ năng Nghe (Listen), Đọc (Read), Viết (Write).
*   Áp dụng thuật toán tính độ ưu tiên dựa trên số lần sai, thời gian chưa ôn tập và độ chính xác để đưa từ vựng cần học lên trước.

### 4.5. Báo cáo Tiến độ (Dashboard)
*   Màn hình thống kê học tập cho từng học sinh đang đăng nhập:
    *   Thống kê Tiếng Anh: Số từ đã thuộc, số câu đã học, từ vựng cần ôn.
    *   Thống kê Toán học: Tỷ lệ làm đúng các phép tính, danh sách phép tính con hay làm sai.
    *   Biểu đồ tiến độ học tập hàng ngày.

---

## 5. Yêu cầu Phi chức năng
*   **Giao diện & Trải nghiệm (UI/UX)**: Premium, vui tươi, sử dụng phông chữ bo tròn thân thiện với trẻ em (như Outfit, Comic Sans MS), các nút bấm lớn dễ click.
*   **Tốc độ phản hồi**: Tải bài học và lưu tiến độ tức thì, tối ưu hóa bằng LocalStorage cache.
*   **Tính ổn định**: Hoạt động tốt trên cả máy tính và thiết bị di động (Responsive Layout).
*   **Bảo mật dữ liệu**: Tiến trình của học sinh nào chỉ ghi đè lên tài khoản của học sinh đó.
