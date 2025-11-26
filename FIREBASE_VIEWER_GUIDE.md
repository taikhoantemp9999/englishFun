# 🔥 FIREBASE DATA VIEWER - USER GUIDE

## ✨ CHỨC NĂNG MỚI!

Đã thêm trang **Firebase Data Viewer** để xem và quản lý dữ liệu Firebase ngay trong app! 

---

## 🎯 CÁCH SỬ DỤNG

### **Bước 1: Mở Data Viewer**

Có 2 cách:

**Cách 1:** Từ trang chủ (index.html)
```
1. Mở index.html
2. Click "🔥 Data Viewer" trong menu header
```

**Cách 2:** Trực tiếp
```
http://localhost:5500/pages/firebase-viewer.html
```

---

## 📊 GIAO DIỆN

### **1. User Information Card (Phía trên)**

```
┌────────────────────────────────────────┐
│ 👤 Thông tin User                      │
├────────────────────────────────────────┤
│ User ID: KL8hG9xD2mN...               │
│ [📋 Copy User ID]                      │
├────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │ 25  │ │  5  │ │ 15  │ │  5  │      │
│ │Total│ │Thành│ │Đang │ │Chưa │      │
│ │Items│ │ thạo│ │ học │ │ học │      │
│ └─────┘ └─────┘ └─────┘ └─────┘      │
└────────────────────────────────────────┘
```

**Features:**
- 🔐 Hiển thị User ID đầy đủ
- 📋 Copy User ID bằng 1 click
- 📊 Stats realtime (Total, Mastered, Learning, New)

---

### **2. Action Buttons**

```
[💾 Export JSON] [🔗 Firebase Console] [🔄 Refresh] [🗑️ Clear All]
```

| Button | Chức năng |
|--------|-----------|
| **💾 Export JSON** | Download backup file (.json) |
| **🔗 Firebase Console** | Mở Firebase Console (tab mới) |
| **🔄 Refresh** | Reload dữ liệu từ Firebase |
| **🗑️ Clear All** | Xóa TẤT CẢ dữ liệu (cẩn thận!) |

---

### **3. Progress Data theo Bài học**

```
📚 Bài 1: Greetings (26 items)
┌─────────────────────┬─────────────────────┐
│ hello               │ goodbye             │
│ xin chào            │ tạm biệt            │
│ ✅ 5 đúng | ❌ 0 sai│ ✅ 3 đúng | ❌ 1 sai│
│ 📊 100% | ✅ Thành thạo│ 📊 75% | 📝 Đang học │
│ 🔄 SR: interval 6... │ 🔄 SR: interval 1...│
│ 📅 Học lần cuối:    │ 📅 Học lần cuối:    │
│    24/10/2025 10:30 │    24/10/2025 11:15 │
└─────────────────────┴─────────────────────┘
```

**Color coding:**
- 🟢 **Xanh lá** = Thành thạo (≥80%, ≥5 lần, 0 sai)
- 🟠 **Cam** = Đang học (đã làm nhưng chưa thành thạo)
- 🔴 **Đỏ** = Yếu (accuracy thấp hoặc nhiều sai)

**Thông tin hiển thị:**
- Từ/câu tiếng Anh
- Nghĩa tiếng Việt
- Số lần đúng/sai
- Accuracy (%)
- Trạng thái (Thành thạo/Đang học/Mới)
- Spaced Repetition data (interval, ease factor, repetitions)
- Thời gian học lần cuối

---

## 🎯 CÁC TÍNH NĂNG CHI TIẾT

### **1. Copy User ID**

**Công dụng:**
- Backup User ID để khôi phục data sau này
- Share với devices khác (nếu implement sync feature)

**Cách dùng:**
```
1. Click [📋 Copy User ID]
2. Paste vào notepad/email để lưu
3. User ID này unique cho thiết bị của bạn
```

---

### **2. Export JSON**

**Công dụng:**
- Backup toàn bộ progress data
- Restore khi cần
- Phân tích data offline

**File export:**
```
firebase_backup_2025-10-24.json

{
  "progress": [
    {
      "lessonId": 1,
      "word": "hello",
      "correct": 5,
      "wrong": 0,
      "type": "word",
      "lastReviewed": "2025-10-24T10:30:00Z",
      ...
    }
  ]
}
```

**Cách dùng:**
```
1. Click [💾 Export JSON]
2. File tự động download
3. Lưu file này để backup
```

---

### **3. Firebase Console**

**Công dụng:**
- Xem data trên Firebase web console
- Xem realtime updates
- Advanced operations

**Cách dùng:**
```
1. Click [🔗 Firebase Console]
2. Mở tab mới với Firebase Console
3. Đăng nhập (nếu chưa)
4. Xem data trực tiếp trên Firebase
```

---

### **4. Refresh Data**

**Công dụng:**
- Load lại data mới nhất từ Firebase
- Sync với changes từ devices khác

**Cách dùng:**
```
1. Click [🔄 Refresh]
2. Đợi vài giây
3. Data update
```

**Khi nào cần:**
- Sau khi làm quiz xong
- Sau khi học từ mới
- Khi muốn xem latest data

---

### **5. Clear All Data** ⚠️

**Công dụng:**
- Xóa TẤT CẢ progress data
- Reset về trạng thái ban đầu

**⚠️ CẢNH BÁO:**
- Hành động này **KHÔNG THỂ HOÀN TÁC**!
- Sẽ xóa data trên Firebase, ProgressManager, và localStorage
- Chỉ dùng khi muốn start over

**Cách dùng:**
```
1. Click [🗑️ Clear All Data]
2. Confirm lần 1: Click OK
3. Confirm lần 2: Nhập "XOA" (viết hoa)
4. Data bị xóa
5. Trang auto reload
```

---

## 💡 USE CASES

### **Use Case 1: Check Progress Daily**
```
1. Mở Data Viewer mỗi ngày
2. Xem stats (Total, Mastered, Learning)
3. Xem items nào cần ôn thêm (màu cam/đỏ)
4. Focus vào những items yếu
```

### **Use Case 2: Backup Data**
```
1. Mỗi tuần 1 lần
2. Click [💾 Export JSON]
3. Lưu file vào cloud (Google Drive, Dropbox, etc.)
4. An toàn!
```

### **Use Case 3: Debug/Troubleshoot**
```
1. Làm quiz nhưng progress không update?
2. Mở Data Viewer
3. Click [🔄 Refresh]
4. Check xem data có update không
5. Nếu không → Check console logs
```

### **Use Case 4: Reset Progress**
```
1. Muốn bắt đầu lại từ đầu
2. Export backup trước (optional)
3. Click [🗑️ Clear All Data]
4. Confirm "XOA"
5. Fresh start!
```

---

## 🎨 RESPONSIVE DESIGN

### **Desktop:**
- Items hiển thị 3 cột
- Stats 4 cột
- Full features

### **Mobile:**
- Items hiển thị 1 cột
- Stats 2 cột
- Buttons stack vertically
- Touch-friendly

---

## 🔍 ADVANCED FEATURES

### **1. Spaced Repetition Info**
Mỗi item hiển thị SR data:
```
🔄 SR: interval 6 days, ease 2.50, reps 2
```

**Ý nghĩa:**
- `interval`: Số ngày đến lần ôn tiếp
- `ease`: Độ khó (1.3-2.5+, cao = dễ)
- `reps`: Số lần ôn đúng liên tiếp

### **2. Color Coding**
```
🟢 Xanh = Mastered (ready for long-term memory)
🟠 Cam = Learning (needs more practice)
🔴 Đỏ = Weak (needs attention)
⚪ Trắng = New (not started)
```

### **3. Last Reviewed Time**
```
📅 Học lần cuối: 24/10/2025 10:30
```
- Format: DD/MM/YYYY HH:MM
- Timezone: Local (Vi-VN)

---

## 🐛 TROUBLESHOOTING

### **Không thấy data:**
- Check: Đã làm quiz chưa?
- Check: Firebase đã init chưa? (xem console logs)
- Solution: Click [🔄 Refresh]

### **Stats = 0:**
- Check: User ID có đúng không?
- Check: Firebase có kết nối không?
- Solution: Reload trang (F5)

### **Export không hoạt động:**
- Check: Browser có block download không?
- Solution: Allow downloads in browser settings

### **Clear Data không xóa được:**
- Check: Firebase có permission không?
- Check: Console có error không?
- Solution: Mở Firebase Console và xóa manually

---

## 📱 MOBILE SUPPORT

**Tested on:**
- ✅ Chrome Mobile
- ✅ Safari iOS
- ✅ Firefox Mobile
- ✅ Edge Mobile

**Touch gestures:**
- Tap to copy User ID
- Tap buttons for actions
- Scroll to view all data

---

## 🎓 TIPS & TRICKS

### **Tip 1: Quick Check**
```
Bookmark Firebase Viewer page
→ Quick access mỗi ngày
→ Monitor progress realtime
```

### **Tip 2: Weekly Backup**
```
Mỗi Chủ Nhật:
1. Export JSON
2. Upload lên Google Drive
3. Peace of mind!
```

### **Tip 3: Identify Weak Points**
```
1. Sort items by color
2. Focus on 🔴 red items
3. Practice until 🟢 green
```

### **Tip 4: Track Improvement**
```
1. Export JSON today
2. Export JSON after 1 week
3. Compare files
4. See your growth!
```

---

## 🔐 PRIVACY & SECURITY

**Data storage:**
- ✅ Firebase (cloud, secure)
- ✅ localStorage (local backup)
- ✅ Export files (your control)

**Access control:**
- 🔒 Only you can see your data (via userId)
- 🔒 Firebase Security Rules protect your data
- 🔒 No one else can access your progress

**User ID:**
- 🔑 Unique per device/browser
- 🔑 Anonymous (no personal info)
- 🔑 Save it for backup/restore

---

## 🎉 SUMMARY

**Firebase Data Viewer gives you:**

✅ **Full visibility** - Xem toàn bộ progress  
✅ **Real stats** - Stats realtime từ Firebase  
✅ **Easy backup** - Export với 1 click  
✅ **Quick access** - Direct link to Firebase Console  
✅ **Data control** - Refresh, Clear khi cần  
✅ **Beautiful UI** - Modern, responsive design  

---

**Happy Learning! 🚀**

**Created:** 2025-10-24  
**Version:** 1.0  
**Page:** `pages/firebase-viewer.html`

