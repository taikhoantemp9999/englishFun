# 🚀 FIREBASE - QUICK START

## ⚡ 3 BƯỚC ĐỂ BẮT ĐẦU

### 1️⃣ MỞ TRANG QUIZ
```
http://localhost:5500/pages/lambaitap-new.html?lesson=1
```

### 2️⃣ MỞ CONSOLE (F12)
Kiểm tra logs:
```
🔥 Firebase initialized successfully!
✅ Firebase authenticated: [your-user-id]
👂 Listening for Firebase changes...
```

### 3️⃣ LÀM BÀI
- Chọn mode
- Trả lời câu hỏi
- Thấy log: `☁️ Synced to Firebase`

✅ **XONG!** Data đã lưu lên Firebase! 🎉

---

## 🔍 KIỂM TRA FIREBASE CONSOLE

1. Vào: **https://console.firebase.google.com**
2. Click project: **english-fun-1937c**
3. Sidebar → **Realtime Database** → **Data** tab
4. Xem data trong:
```
users/
  └── [your-user-id]/
       └── progress/
            └── progress: [...]
```

---

## 🎯 COPY USER ID

**Trong Console:**
```javascript
ProgressManager.userId
```

Hoặc xem log:
```
👤 User ID: abc123xyz...
```

💡 **LƯU USER ID NÀY** để backup hoặc restore data sau!

---

## ⚠️ TROUBLESHOOTING

| Vấn đề | Giải pháp |
|--------|-----------|
| Không thấy log Firebase | Hard refresh (Ctrl+Shift+R) |
| "Permission denied" | Firebase Console → Database → Rules → Test mode |
| Không sync | Check internet, xem Console có lỗi gì |

---

## 📖 CHI TIẾT

Xem file `FIREBASE_GUIDE.md` để biết thêm chi tiết!

---

**Happy Learning! 🚀**

