# 🎯 REFACTORING GUIDE - Module Pattern

## 📊 Tổng quan

Đã refactor code từ **monolithic** sang **module pattern** để giảm code duplication và dễ maintain.

### Before (Cũ):
```
lambaitap.html    ~1400 dòng  ❌ Code trùng lặp
luyentap.html     ~1600 dòng  ❌ Code trùng lặp
```

### After (Mới):
```
lambaitap.html    ~250 dòng   ✅ Chỉ logic riêng
luyentap.html     ~270 dòng   ✅ Chỉ logic riêng

+ Shared Modules:
  js/quiz-engine.js         ~200 dòng
  js/quiz-ui.js            ~400 dòng
  js/quiz-question-gen.js  ~350 dòng
  js/quiz-progress.js      ~150 dòng
  css/quiz-common.css      ~300 dòng
```

**Tổng:** ~1900 dòng (thay vì ~3000 dòng)
**Giảm:** ~37% code duplication

---

## 📁 Cấu trúc mới

```
english-fun/
├── js/                         ← [MỚI] Shared modules
│   ├── quiz-engine.js          Core quiz logic & state
│   ├── quiz-ui.js              UI rendering & interaction
│   ├── quiz-question-gen.js    Question generation
│   └── quiz-progress.js        Progress management
│
├── css/                        ← [MỚI] Shared styles
│   └── quiz-common.css         Common quiz styles
│
└── pages/
    ├── lambaitap.html          ← 250 dòng (was 1400)
    ├── lambaitap.html.backup   ← Backup của file cũ
    ├── luyentap.html           ← 270 dòng (was 1600)
    └── luyentap.html.backup    ← Backup của file cũ
```

---

## 🔧 Chi tiết Modules

### 1. `js/quiz-engine.js` - Core Engine
**Trách nhiệm:** Quản lý state và flow của quiz

```javascript
const QuizEngine = {
  // State
  questions: [],
  currentIndex: 0,
  score: { correct: 0, wrong: 0 },
  
  // Lifecycle
  init(config),
  start(questions),
  next(),
  finish(),
  
  // Answer handling
  checkAnswer(isCorrect),
  
  // Timer
  startTimer(question),
  stopTimer(),
  calculateQuestionTime(question)
};
```

**Events dispatched:**
- `quiz:showQuestion` - Khi hiển thị câu hỏi mới
- `quiz:answered` - Khi trả lời câu hỏi
- `quiz:timerUpdate` - Cập nhật timer
- `quiz:finished` - Kết thúc quiz

---

### 2. `js/quiz-ui.js` - UI Manager
**Trách nhiệm:** Render UI và handle interactions

```javascript
const QuizUI = {
  // Init
  init(containerSelector, themeColors),
  
  // Rendering
  renderQuestion({ question, index, total }),
  renderListen(q),
  renderRead(q),
  renderWrite(q),
  
  // Write mode
  renderMissingLetter(q),      // Word: điền chữ inline
  renderSentenceArrange(q),    // Sentence: sắp xếp từ
  
  // Interaction
  selectLetter(btn, letter),
  clickSentenceWord(el),
  resetSentence(),
  selectAnswer(selected, correct),
  
  // Effects
  createConfetti(),
  showStreakBadge(streak),
  
  // Summary
  renderSummary({ correct, wrong, total, accuracy, maxStreak })
};
```

---

### 3. `js/quiz-question-gen.js` - Question Generator
**Trách nhiệm:** Tạo câu hỏi từ lessons data

```javascript
const QuestionGenerator = {
  // For lambaitap.html (bài hiện tại)
  forLesson(lesson, config, mode),
  
  // For luyentap.html (tổng hợp với thuật toán ưu tiên)
  forReview(lessons, progressData, config, mode),
  
  // Make questions
  makeQuestion(mode, word),
  makeQuestionFromSentence(mode, sentenceData),
  
  // Priority algorithm
  calculatePriority(item, progress),
  getDifficultyScore(item),
  getMasteryScore(correct, wrong),
  selectItemsWithRandomization(pool, count),
  
  // Options
  makeOptions(word, field),
  makeSentenceOptions(sentence, flip)
};
```

---

### 4. `js/quiz-progress.js` - Progress Manager
**Trách nhiệm:** Quản lý progress data

```javascript
const ProgressManager = {
  // Data
  data: { progress: [] },
  
  // CRUD
  load(),
  update(question, isCorrect),
  saveToLocalStorage(),
  export(),
  
  // Spaced Repetition
  updateSpacedRepetition(item, isCorrect),
  
  // Stats
  getStats()
};
```

---

## 🎨 `css/quiz-common.css` - Shared Styles

Chứa tất cả CSS chung:
- Layout (container, question-container)
- Options (option-btn, image-options)
- Write mode (letter-blank, sentence-word)
- Effects (confetti, streak-badge, shake)
- Summary screen
- Responsive styles

---

## 📝 Cách sử dụng

### Trong HTML file (ví dụ: lambaitap.html):

```html
<!-- Load shared modules -->
<link rel="stylesheet" href="../css/quiz-common.css">

<script src="../js/quiz-engine.js"></script>
<script src="../js/quiz-ui.js"></script>
<script src="../js/quiz-question-gen.js"></script>
<script src="../js/quiz-progress.js"></script>

<!-- Page-specific logic -->
<script>
  // Init
  QuizUI.init('#quiz-area', { primary: '#667eea' });
  QuizEngine.init({ onAnswer, onFinish });
  
  // Generate questions (PAGE-SPECIFIC)
  const questions = QuestionGenerator.forLesson(...);
  
  // Start
  QuizEngine.start(questions);
</script>
```

---

## ✅ Lợi ích

### 1. **DRY (Don't Repeat Yourself)**
- Sửa bug 1 lần → áp dụng tất cả
- Thêm feature mới → chỉ code 1 lần

### 2. **Single Source of Truth**
- Logic quiz chỉ có 1 nơi
- Không lo conflicts giữa files

### 3. **Dễ maintain**
- Mỗi module có trách nhiệm rõ ràng
- Easy to debug

### 4. **Dễ test**
- Test từng module riêng
- Mock dependencies dễ dàng

### 5. **Dễ mở rộng**
- Thêm trang mới? Chỉ cần:
  1. Tạo HTML (~100 dòng)
  2. Load 4 modules
  3. Viết logic riêng (~50 dòng)

---

## 🔄 Migration từ code cũ

### Nếu muốn quay về code cũ:
```bash
# Có backup files:
pages/lambaitap.html.backup
pages/luyentap.html.backup
```

### Nếu muốn dùng code mới:
```bash
# File mới đã sẵn sàng:
pages/lambaitap-new.html
pages/luyentap-new.html

# Sau khi test OK, rename:
mv lambaitap-new.html lambaitap.html
mv luyentap-new.html luyentap.html
```

---

## 🧪 Testing

### Test checklist:
- [ ] Load trang thành công
- [ ] Chọn mode quiz
- [ ] 4 loại câu hỏi (Listen, Read, Write word, Write sentence)
- [ ] Timer hoạt động
- [ ] Score update
- [ ] Progress save
- [ ] Summary screen
- [ ] Export progress
- [ ] Về trang chủ

---

## 📞 Troubleshooting

### Lỗi "QuizEngine is not defined"
→ Kiểm tra đã load `js/quiz-engine.js` chưa

### Lỗi "playSpeech is not defined"
→ Kiểm tra đã define `window.playSpeech` trong page script

### CSS không hiển thị đúng
→ Kiểm tra đã load `css/quiz-common.css`

### Questions không generate
→ Kiểm tra `CONFIG` và `LESSONS_DATA` đã load chưa

---

## 🎯 Next Steps

Nếu muốn refactor tiếp:
1. Tách TTS thành module riêng (`js/tts-manager.js`)
2. Tách Data Loader (`js/data-loader.js`)
3. Áp dụng pattern tương tự cho `index.html`
4. Áp dụng cho `hocbaimoi.html`

---

**Tạo bởi:** AI Assistant
**Ngày:** 2025-10-24
**Version:** 1.0

