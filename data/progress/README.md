# 📁 Thư mục Progress - Tự động backup tiến độ học tập

## 🎯 Mục đích
Thư mục này chứa các file backup tiến độ học tập được tạo tự động.

## 📝 Format file
- **Tên file:** `progress_YYYY-MM-DDTHH-MM-SS.json`
- **Ví dụ:** `progress_2025-10-24T11-30-45.json`

## 🔄 Cách hoạt động

### Lần đầu tiên sử dụng:
1. Click nút **"📁 Chọn thư mục lưu"** trong app
2. Chọn thư mục `data/progress/` này
3. Cho phép quyền ghi file

### Sau khi đã chọn thư mục:
- ✅ App tự động lưu progress mỗi khi học xong
- ✅ Tự động load file mới nhất khi mở app
- ✅ Giữ lại nhiều phiên bản backup

## 🗂️ Quản lý file

### File được tạo tự động khi:
- Hoàn thành một quiz
- Click nút "💾 Lưu progress ngay"
- Thoát khỏi quiz giữa chừng

### Dọn dẹp file cũ:
- App giữ tất cả file backup
- Bạn có thể xóa file cũ thủ công nếu muốn
- Khuyến nghị giữ lại ít nhất 7-10 file gần nhất

## 💡 Mẹo

### Load file cũ hơn:
1. Đổi tên file cũ thành format mới hơn (để app load nó)
2. Hoặc dùng "📥 Import tiến độ" trong app

### Backup an toàn:
- Copy toàn bộ thư mục này ra nơi khác
- Hoặc sync với cloud (Dropbox, Google Drive, etc.)

## 🔧 Yêu cầu kỹ thuật
- **Trình duyệt:** Chrome 86+, Edge 86+
- **API:** File System Access API
- **Quyền:** Cần cho phép ghi file vào thư mục này

## ⚠️ Lưu ý
- Không đổi tên hoặc di chuyển thư mục này khi app đang chạy
- File có timestamp mới nhất sẽ được load tự động
- Nếu không chọn thư mục, app vẫn hoạt động với localStorage

---

**Cập nhật:** 2025-10-24  
**Phiên bản:** 2.1 - Tự động backup với File System Access API

