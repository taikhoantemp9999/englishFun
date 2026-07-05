/**
 * QUIZ PROGRESS MANAGER - MULTI-USER & CLOUD SYNC VERSION
 * Quản lý tiến trình học tập của nhiều học sinh trên Firebase Realtime Database
 */

const ProgressManager = {
  data: { progress: [] },
  username: null,
  fullName: null,
  useFirebase: true,
  isInitialized: false,

  // ===== KHỞI TẠO HỆ THỐNG =====
  async init() {
    if (this.isInitialized) return;

    try {
      // Kiểm tra xem Firebase đã được tải chưa
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Không tìm thấy thư viện Firebase, chuyển sang LocalStorage.');
        this.useFirebase = false;
        this.loadFromLocalStorage();
        return;
      }

      // Đăng nhập ẩn danh vào Firebase Auth để có quyền đọc ghi dữ liệu
      await firebaseAuth.signInAnonymously();
      console.log('✅ Firebase Authenticated thành công.');

      // Kiểm tra tài khoản đã lưu trong LocalStorage chưa
      const savedUser = localStorage.getItem('current_student_username');
      if (savedUser) {
        this.username = savedUser;
        this.fullName = localStorage.getItem('current_student_fullname') || savedUser;
        console.log(`👤 Tài khoản hiện tại: ${this.username} (${this.fullName})`);
        
        // Tải tiến trình học tập từ Firebase
        await this.load();
        
        // Lắng nghe thay đổi dữ liệu thời gian thực
        this.listenForChanges();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Khởi tạo Firebase thất bại:', error);
      this.useFirebase = false;
      this.loadFromLocalStorage();
    }
  },

  // ===== ĐĂNG KÝ HỌC SINH MỚI =====
  async register(username, fullName) {
    if (!username || !fullName) {
      throw new Error('Vui lòng điền đầy đủ Mã học sinh và Họ tên!');
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      throw new Error('Mã học sinh chỉ được chứa chữ cái, số và dấu gạch dưới!');
    }

    if (this.useFirebase) {
      // Kiểm tra xem tài khoản đã tồn tại chưa
      const snapshot = await firebaseDB.ref(`users/${cleanUsername}`).once('value');
      if (snapshot.exists()) {
        throw new Error('Mã học sinh này đã tồn tại! Vui lòng chọn mã khác.');
      }

      // Tạo mới tài khoản trên Firebase
      const userData = {
        fullName: fullName.trim(),
        createdAt: new Date().toISOString(),
        progress: { progress: [] }
      };

      await firebaseDB.ref(`users/${cleanUsername}`).set(userData);
      console.log('✅ Đã đăng ký tài khoản mới trên Firebase:', cleanUsername);
    }

    // Thiết lập tài khoản hiện tại
    this.username = cleanUsername;
    this.fullName = fullName.trim();
    this.data = { progress: [] };

    // Lưu vào cache LocalStorage
    localStorage.setItem('current_student_username', this.username);
    localStorage.setItem('current_student_fullname', this.fullName);
    this.saveToLocalStorage();

    if (this.useFirebase) {
      this.listenForChanges();
    }

    return { username: this.username, fullName: this.fullName };
  },

  // ===== ĐĂNG NHẬP BẰNG MÃ CŨ =====
  async login(username) {
    if (!username) {
      throw new Error('Vui lòng nhập Mã học sinh!');
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (this.useFirebase) {
      // Đọc thông tin từ Firebase
      const snapshot = await firebaseDB.ref(`users/${cleanUsername}`).once('value');
      if (!snapshot.exists()) {
        throw new Error('Không tìm thấy tài khoản với mã học sinh này!');
      }

      const userData = snapshot.val();
      this.username = cleanUsername;
      this.fullName = userData.fullName || cleanUsername;
      this.data = userData.progress || { progress: [] };
      if (!this.data.progress) this.data.progress = [];

      console.log('✅ Đăng nhập thành công từ Firebase:', cleanUsername);
    } else {
      // Offline mode
      this.username = cleanUsername;
      this.fullName = cleanUsername;
      this.loadFromLocalStorage();
    }

    // Lưu cache LocalStorage
    localStorage.setItem('current_student_username', this.username);
    localStorage.setItem('current_student_fullname', this.fullName);
    this.saveToLocalStorage();

    if (this.useFirebase) {
      this.listenForChanges();
    }

    return { username: this.username, fullName: this.fullName };
  },

  // ===== ĐĂNG XUẤT TÀI KHOẢN =====
  logout() {
    this.username = null;
    this.fullName = null;
    this.data = { progress: [] };
    localStorage.removeItem('current_student_username');
    localStorage.removeItem('current_student_fullname');
    localStorage.removeItem('english_learning_progress');
    
    // Tải lại trang chủ
    window.location.reload();
  },

  // ===== TẢI DỮ LIỆU TIẾN TRÌNH =====
  async load() {
    if (!this.username) return { progress: [] };

    if (!this.useFirebase) {
      return this.loadFromLocalStorage();
    }

    try {
      console.log(`📥 Đang tải tiến độ cho học sinh: ${this.username}`);
      const snapshot = await firebaseDB.ref(`users/${this.username}/progress`).once('value');
      
      if (snapshot.exists()) {
        this.data = snapshot.val();
        if (!this.data.progress) this.data.progress = [];
        
        // Tối ưu hóa: Loại bỏ các bản ghi trùng lặp
        this.deduplicate();
      } else {
        this.data = { progress: [] };
      }

      // Lưu đệm LocalStorage
      this.saveToLocalStorage();
      return this.data;
    } catch (error) {
      console.error('❌ Lỗi tải tiến độ từ Firebase, dùng LocalStorage:', error);
      return this.loadFromLocalStorage();
    }
  },

  // ===== TẢI TỪ LOCALSTORAGE (OFFLINE CACHE) =====
  loadFromLocalStorage() {
    const key = this.username ? `progress_${this.username}` : 'english_learning_progress';
    const stored = localStorage.getItem(key);
    if (stored) {
      this.data = JSON.parse(stored);
      if (!this.data.progress) this.data.progress = [];
      console.log('📂 Đã nạp tiến độ từ LocalStorage cache');
    } else {
      this.data = { progress: [] };
    }
    return this.data;
  },

  // ===== CẬP NHẬT KẾT QUẢ CÂU HỎI (TIẾNG ANH & TOÁN) =====
  update(question, isCorrect) {
    if (!this.username) {
      console.warn('⚠️ Chưa đăng nhập tài khoản học sinh. Kết quả không được lưu.');
      return;
    }

    const lessonId = question.lessonId || this.getCurrentLessonId();
    let item = null;

    if (question.type === 'math') {
      // 1. Lưu tiến độ Toán lớp 2
      const expr = question.expression;
      item = this.data.progress.find(p => 
        p.type === 'math' && p.mathExpression === expr && p.lessonId === lessonId
      );

      if (!item) {
        item = {
          lessonId: lessonId,
          mathExpression: expr,
          correct: 0,
          wrong: 0,
          type: 'math',
          subtype: question.subtype || 'arithmetic',
          lastReviewed: new Date().toISOString()
        };
        this.data.progress.push(item);
      }
    } else {
      // 2. Lưu tiến độ Tiếng Anh (Từ vựng hoặc Câu)
      if (question.word) {
        // Từ vựng tiếng Anh
        item = this.data.progress.find(p =>
          p.word === question.word && p.lessonId === lessonId
        );

        if (!item) {
          item = {
            lessonId: lessonId,
            word: question.word,
            correct: 0,
            wrong: 0,
            type: 'word',
            lastReviewed: new Date().toISOString()
          };
          this.data.progress.push(item);
        }
      } else if (question.sentence || question.correctAnswer) {
        // Câu tiếng Anh
        const en = question.sentence || question.correctAnswer;
        const vi = question.question || '';
        
        item = this.data.progress.find(p =>
          p.sentence && p.sentence.en === en && p.lessonId === lessonId
        );

        if (!item) {
          item = {
            lessonId: lessonId,
            sentence: { en: en, vi: vi },
            correct: 0,
            wrong: 0,
            type: 'sentence',
            lastReviewed: new Date().toISOString()
          };
          this.data.progress.push(item);
        }
      }
    }

    // Tính toán lại độ ưu tiên Spaced Repetition (SM-2)
    if (item) {
      if (isCorrect) {
        item.correct = (item.correct || 0) + 1;
      } else {
        item.wrong = (item.wrong || 0) + 1;
      }
      item.lastReviewed = new Date().toISOString();

      // Cập nhật khoảng cách lặp lại ngắt quãng
      this.updateSpacedRepetition(item, isCorrect);

      // Lưu tức thì vào LocalStorage
      this.saveToLocalStorage();

      // Đồng bộ bất đồng bộ lên Firebase
      if (this.useFirebase) {
        this.saveToFirebase().catch(err => {
          console.error('⚠️ Đồng bộ Firebase thất bại:', err);
        });
      }
    }
  },

  // ===== ĐỒNG BỘ LÊN CLOUD =====
  async saveToFirebase() {
    if (!this.useFirebase || !this.username) return;

    try {
      await firebaseDB.ref(`users/${this.username}/progress`).set(this.data);
      console.log('☁️ Đã đồng bộ tiến độ lên Firebase.');
    } catch (error) {
      console.error('❌ Lỗi lưu Firebase:', error);
      throw error;
    }
  },

  // ===== GHI VÀO LOCALSTORAGE =====
  saveToLocalStorage() {
    if (!this.username) return;
    try {
      const key = `progress_${this.username}`;
      localStorage.setItem(key, JSON.stringify(this.data));
    } catch (error) {
      console.error('❌ Lỗi ghi LocalStorage:', error);
    }
  },

  // ===== LẮNG NGHE THAY ĐỔI DỮ LIỆU REALTIME =====
  listenForChanges() {
    if (!this.useFirebase || !this.username) return;

    console.log(`👂 Đang lắng nghe thay đổi dữ liệu cho: ${this.username}`);
    firebaseDB.ref(`users/${this.username}/progress`).on('value', (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        if (JSON.stringify(newData) !== JSON.stringify(this.data)) {
          this.data = newData;
          if (!this.data.progress) this.data.progress = [];
          console.log('🔄 Đã tự động cập nhật tiến độ mới từ Firebase.');
          
          this.saveToLocalStorage();
          
          // Phát sự kiện toàn cục để UI cập nhật theo
          window.dispatchEvent(new CustomEvent('progress:updated', {
            detail: this.data
          }));
        }
      }
    });
  },

  // ===== THUẬT TOÁN LẶP LẠI NGẮT QUÃNG (SM-2) =====
  updateSpacedRepetition(item, isCorrect) {
    if (!item.interval) {
      item.interval = 0;
      item.easeFactor = 2.5;
      item.repetitions = 0;
    }

    if (isCorrect) {
      if (item.repetitions === 0) {
        item.interval = 1; // 1 ngày
      } else if (item.repetitions === 1) {
        item.interval = 4; // 4 ngày
      } else {
        item.interval = Math.round(item.interval * item.easeFactor);
      }
      item.repetitions++;
    } else {
      item.repetitions = 0;
      item.interval = 1; // Học lại ngay ngày mai
    }

    const quality = isCorrect ? 5 : 2;
    item.easeFactor = Math.max(1.3, item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + item.interval);
    item.nextReview = nextDate.toISOString();
  },

  // ===== DỌN DẸP TRÙNG LẶP DỮ LIỆU =====
  deduplicate() {
    if (!this.data.progress || this.data.progress.length === 0) return;

    const unique = new Map();
    let removedCount = 0;

    this.data.progress.forEach(item => {
      let key;
      if (item.type === 'math') {
        key = `m_${item.lessonId}_${item.mathExpression}`;
      } else if (item.word) {
        key = `w_${item.lessonId}_${item.word.toLowerCase()}`;
      } else if (item.sentence && item.sentence.en) {
        key = `s_${item.lessonId}_${item.sentence.en.toLowerCase()}`;
      } else {
        return; // Bỏ qua phần tử lỗi
      }

      if (unique.has(key)) {
        const existing = unique.get(key);
        const existingTotal = (existing.correct || 0) + (existing.wrong || 0);
        const currentTotal = (item.correct || 0) + (item.wrong || 0);

        if (currentTotal > existingTotal) {
          unique.set(key, item);
        }
        removedCount++;
      } else {
        unique.set(key, item);
      }
    });

    if (removedCount > 0) {
      this.data.progress = Array.from(unique.values());
      console.log(`🧹 Đã dọn dẹp ${removedCount} bản ghi trùng lặp.`);
      this.saveToFirebase().catch(e => console.error(e));
    }
  },

  // ===== TIỆN ÍCH TRỢ GIÚP =====
  getCurrentLessonId() {
    const params = new URLSearchParams(window.location.search);
    const lesson = params.get('lesson');
    return lesson ? (lesson.startsWith('M') ? lesson : parseInt(lesson)) : 1;
  },

  getStats(subject = 'english') {
    const filtered = this.data.progress.filter(item => {
      if (subject === 'math') return item.type === 'math';
      return item.type === 'word' || item.type === 'sentence';
    });

    const total = filtered.length;
    let mastered = 0;
    let learning = 0;
    let newItems = 0;

    filtered.forEach(item => {
      const correct = item.correct || 0;
      const wrong = item.wrong || 0;
      const totalAttempts = correct + wrong;

      if (totalAttempts === 0) {
        newItems++;
      } else {
        const accuracy = correct / totalAttempts;
        // Thành thạo: làm đúng ít nhất 5 lần, tỷ lệ đúng trên 80% và không sai ở lần gần nhất
        if (accuracy >= 0.8 && totalAttempts >= 5 && wrong === 0) {
          mastered++;
        } else {
          learning++;
        }
      }
    });

    return { total, mastered, learning, newItems };
  }
};

// Export
window.ProgressManager = ProgressManager;
