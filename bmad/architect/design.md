# Software Architecture & System Design Document

**Phiên bản**: 1.0  
**Tác giả**: Architect AI Agent (BMAD Method)  
**Ngày**: 2026-07-05  

---

## 1. Kiến trúc Hệ thống Tổng quan
Ứng dụng sử dụng mô hình **Serverless (Client-side Heavy)**:
*   **Frontend**: HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+).
*   **Database & Auth**: Firebase Realtime Database & Firebase Auth (Anonymous & Custom Account Management).
*   **Cache**: LocalStorage để lưu trữ tạm thời tiến độ học tập và thông tin người dùng, đảm bảo ứng dụng chạy mượt mà ngay cả khi kết nối mạng chậm.

---

## 2. Thiết kế Cơ sở Dữ liệu (Firebase Realtime Database Schema)

```json
{
  "lessons": {
    "english": [
      {
        "id": 0,
        "title": "Lesson 0: Getting Started",
        "description": "Chào hỏi và các hiệu lệnh trong lớp",
        "words": [
          {
            "word": "Hello",
            "meaning": "Xin chào",
            "images": ["data/images/hello_1.png"],
            "sentences": [
              {
                "en": "Hello, teacher.",
                "vi": "Em chào cô ạ."
              }
            ]
          }
        ]
      }
    ],
    "math": [
      {
        "id": "M1",
        "title": "Bài 1. Ôn tập các số đến 100",
        "chapter": "Chủ đề 1: ÔN TẬP VÀ BỔ SUNG",
        "type": "arr_count_100",
        "range": { "min": 0, "max": 100 }
      }
    ]
  },
  "users": {
    "username_ma_hoc_sinh": {
      "fullName": "Nguyễn Văn Bình",
      "createdAt": "2026-07-05T15:00:00.000Z",
      "progress": [
        {
          "lessonId": "M39",
          "mathExpression": "2 x 5",
          "correct": 4,
          "wrong": 0,
          "type": "math",
          "subtype": "multiplication",
          "lastReviewed": "2026-07-05T15:00:00.000Z",
          "interval": 6,
          "easeFactor": 2.6,
          "repetitions": 2,
          "nextReview": "2026-07-11T15:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 3. Sơ đồ các Component & Luồng dữ liệu

### 3.1. Quản lý Tài khoản (Account Switcher)
1. Người dùng mở trang chủ `index.html`.
2. `ProgressManager.init()` kiểm tra LocalStorage xem có `current_student_username` không.
3. Nếu không có, hiển thị **Login/Register Modal** yêu cầu tạo mã học sinh mới hoặc đăng nhập mã cũ.
4. Khi nhập username:
   - Đăng nhập: Tải `users/{username}` từ Firebase. Lưu vào LocalStorage cache.
   - Đăng ký: Kiểm tra xem username đã tồn tại trên Firebase chưa, nếu chưa thì tạo bản ghi mới `fullName`, `createdAt`, `progress: []`.

### 3.2. Nạp dữ liệu bài học (Lesson Loader)
1. `LessonLoader.loadAllLessons()` kiểm tra dữ liệu `lessons/` trên Firebase.
2. Nếu Firebase chưa có dữ liệu bài học:
   - Tải file Tiếng Anh cục bộ (`data/lessons_index.json` + `data/lessons/lesson_*.json`).
   - Đọc danh sách 75 bài học Toán từ file định nghĩa `data/math_lessons.json` (hoặc khởi tạo tĩnh).
   - Đẩy toàn bộ lên Firebase dưới node `lessons/english` và `lessons/math`.
3. Nếu Firebase đã có dữ liệu, tải trực tiếp từ Firebase về lưu vào biến toàn cục và LocalStorage cache.

### 3.3. Sinh câu hỏi & Quản lý tiến độ (Spaced Repetition)
1. Khi học sinh học bài `M39`:
   - Lọc các tiến độ cũ trên Firebase có `lessonId === 'M39'` và `nextReview <= hiện tại` để làm pool ưu tiên.
   - `MathQuestionGenerator` sinh ngẫu nhiên các câu hỏi bảng nhân 2 theo cấu hình bài học.
   - Lồng các câu hỏi bé làm sai ở pool ưu tiên vào bài quiz.
2. Khi bé click chọn đáp án:
   - Hệ thống chấm đúng/sai.
   - Nếu sai, hiển thị bảng giải thích từng bước (bằng hình ảnh hoặc đặt tính dọc SVG).
   - Gọi `ProgressManager.update(question, isCorrect)` để tính toán chỉ số SM-2 mới (`interval`, `easeFactor`, `repetitions`) và cập nhật đồng thời lên Firebase + LocalStorage cache.

---

## 4. Đặc tả kỹ thuật mô-đun sinh câu hỏi Toán Lớp 2 (`math-question-gen.js`)
Mỗi bài học trong 75 bài được liên kết với một `type` (Loại bài học). File `math-question-gen.js` sẽ định nghĩa các hàm sinh tương ứng:
- `generateArithmeticQuestion(range, type, hasCarry)`: Phép cộng/trừ phạm vi 100/1000 có nhớ hoặc không nhớ.
- `generateMultiplicationQuestion(multipliers)`: Nhân các số từ 1 đến 10 với thừa số trong danh sách.
- `generateDivisionQuestion(divisors)`: Phép chia hết tương ứng của bảng nhân.
- `generateComparisonQuestion(range)`: So sánh 2 số hoặc biểu thức.
- `generateMeasurementQuestion(type)`: Tạo các bài toán đổi đơn vị đo lường hoặc cộng trừ đơn vị đo.
- `generateTimeQuestion(type)`: Đọc giờ đồng hồ ảo, tính ngày trong tuần/tháng.
- `generateGeometryQuestion(type)`: Đếm hình tam giác/tứ giác, đếm khối trụ/khối cầu hoặc nhận dạng đường thẳng/đường cong.
- `generateStatisticsQuestion(type)`: Trả lời câu hỏi dựa trên bảng số liệu/biểu đồ tranh hoặc xác suất (chắc chắn, có thể, không thể).
