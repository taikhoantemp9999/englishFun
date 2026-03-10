/**
 * QUIZ PROGRESS MANAGER - FIREBASE VERSION
 * Quản lý progress data với Firebase Realtime Database
 */

const ProgressManager = {
  data: { progress: [] },
  userId: null,
  useFirebase: true,
  isInitialized: false,

  // ===== INIT =====
  async init(configUserId) {
    if (this.isInitialized) return;

    if (configUserId) {
      this.userId = configUserId;
      console.log('✅ Using Config User ID:', this.userId);
    }

    try {
      // Check if Firebase is available
      if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase not loaded, using localStorage');
        this.useFirebase = false;
        return;
      }

      // Sign in anonymously
      const userCredential = await firebaseAuth.signInAnonymously();
      const authUid = userCredential.user.uid;

      console.log('✅ Firebase authenticated (Real Auth ID):', authUid);

      // Check for mismatch if using config ID
      //if (this.userId && this.userId !== authUid) {
      if (false) {
        console.warn(`⚠️ UID MISMATCH! Config: ${this.userId} vs Auth: ${authUid}`);

        // Show warning to user
        alert(`⚠️ CẢNH BÁO LỖI BẢO MẬT!\n\n` +
          `1. ID thực tế của bạn: ${authUid}\n` +
          `2. ID trong config: ${this.userId}\n\n` +
          `Firebase CHẶN truy cập vì 2 ID này khác nhau.\n\n` +
          `GIẢI PHÁP:\n` +
          `- Cách 1: Sửa Rules trên Firebase thành ".read": true, ".write": true\n` +
          `- Cách 2: Xóa dòng "user_id" trong config.json để dùng ID thực tế.`);
      }

      if (!this.userId) {
        this.userId = authUid;
      }

      console.log('👤 Target User ID (Data Path):', this.userId);

      // Listen for realtime updates
      this.listenForChanges();

      this.isInitialized = true;

      // Display userId
      this.displayUserId();

    } catch (error) {
      console.error('❌ Firebase init failed:', error);
      this.useFirebase = false;
    }
  },

  // ===== LOAD FROM FIREBASE =====
  async load() {
    // Init if not yet
    if (!this.isInitialized) {
      await this.init();
    }

    // Fallback to localStorage if Firebase not available
    if (!this.useFirebase || !this.userId) {
      return this.loadFromLocalStorage();
    }

    try {
      console.log('📥 Loading from Firebase...');

      const snapshot = await firebaseDB
        .ref(`users/${this.userId}/progress`)
        .once('value');

      if (snapshot.exists()) {
        this.data = snapshot.val();
        console.log('✅ Loaded from Firebase:', this.data.progress.length, 'items');

        // Deduplicate to fix >100% bug
        this.deduplicate();
      } else {
        console.log('📝 No data in Firebase, starting fresh');
        this.data = { progress: [] };
      }

      // Cache to localStorage for offline
      localStorage.setItem('english_learning_progress', JSON.stringify(this.data));

      return this.data;

    } catch (error) {
      console.error('❌ Firebase load failed:', error);

      // Handle Permission Denied specifically
      if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission_denied')) {
        const authUid = firebaseAuth.currentUser ? firebaseAuth.currentUser.uid : 'unknown';

        alert(
          `⛔ KHÔNG CÓ QUYỀN TRUY CẬP!\n\n` +
          `Bạn đang muốn dùng lại dữ liệu cũ của ID: ${this.userId}\n` +
          `Nhưng Firebase đã cấp cho bạn ID mới là: ${authUid}\n\n` +
          `LÝ DO: Tài khoản ẩn danh (Anonymous) không thể đăng nhập lại khi sang máy khác.\n\n` +
          `CÁCH KHẮC PHỤC DUY NHẤT:\n` +
          `Bạn phải mở quyền truy cập trên Firebase Console:\n` +
          `1. Vào tab "Rules" trong Realtime Database\n` +
          `2. Sửa thành: ".read": true, ".write": true\n` +
          `3. Nhấn Publish\n\n` +
          `Sau đó reload lại trang này.`
        );
      }

      console.log('📂 Fallback to localStorage');
      return this.loadFromLocalStorage();
    }
  },

  // ===== LOAD FROM LOCALSTORAGE =====
  loadFromLocalStorage() {
    const stored = localStorage.getItem('english_learning_progress');
    if (stored) {
      this.data = JSON.parse(stored);
      console.log('📂 Loaded from localStorage:', this.data.progress.length, 'items');
    } else {
      this.data = { progress: [] };
      console.log('📝 No local data, starting fresh');
    }
    return this.data;
  },

  // ===== UPDATE =====
  update(question, isCorrect) {
    const lessonId = question.lessonId || this.getCurrentLessonId();
    let item;

    if (question.word) {
      // Word progress
      item = this.data.progress.find(p =>
        p.word === question.word && p.lessonId === lessonId
      );

      if (!item) {
        item = {
          lessonId,
          word: question.word,
          correct: 0,
          wrong: 0,
          type: 'word',
          lastReviewed: new Date().toISOString()
        };
        this.data.progress.push(item);
      }
    } else if (question.sentence || question.correctAnswer) {
      // Sentence progress
      const en = question.sentence || question.correctAnswer;
      const vi = question.question || '';

      item = this.data.progress.find(p =>
        p.sentence && p.sentence.en === en && p.lessonId === lessonId
      );

      if (!item) {
        item = {
          lessonId,
          sentence: { en, vi },
          correct: 0,
          wrong: 0,
          type: 'sentence',
          lastReviewed: new Date().toISOString()
        };
        this.data.progress.push(item);
      }
    }

    if (item) {
      if (isCorrect) {
        item.correct = (item.correct || 0) + 1;
      } else {
        item.wrong = (item.wrong || 0) + 1;
      }
      item.lastReviewed = new Date().toISOString();

      // Update spaced repetition
      this.updateSpacedRepetition(item, isCorrect);

      // Save locally first (instant)
      this.saveToLocalStorage();

      // Sync to Firebase (async, don't block UI)
      if (this.useFirebase && this.userId) {
        this.saveToFirebase().catch(err => {
          console.error('⚠️ Firebase sync failed:', err);
        });
      }
    }
  },

  // ===== SAVE TO FIREBASE =====
  async saveToFirebase() {
    if (!this.useFirebase || !this.userId) return;

    try {
      await firebaseDB
        .ref(`users/${this.userId}/progress`)
        .set(this.data);

      console.log('☁️ Synced to Firebase');

    } catch (error) {
      console.error('❌ Firebase save failed:', error);
      throw error;
    }
  },

  // ===== SAVE TO LOCALSTORAGE =====
  saveToLocalStorage() {
    try {
      localStorage.setItem('english_learning_progress', JSON.stringify(this.data));
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
    }
  },

  // ===== REALTIME SYNC =====
  listenForChanges() {
    if (!this.useFirebase || !this.userId) return;

    console.log('👂 Listening for Firebase changes...');

    firebaseDB
      .ref(`users/${this.userId}/progress`)
      .on('value', (snapshot) => {
        if (snapshot.exists()) {
          const newData = snapshot.val();

          // Only update if data actually changed
          if (JSON.stringify(newData) !== JSON.stringify(this.data)) {
            this.data = newData;
            console.log('🔄 Firebase realtime update received');

            // Update localStorage
            localStorage.setItem('english_learning_progress', JSON.stringify(this.data));

            // Dispatch event for UI update
            window.dispatchEvent(new CustomEvent('progress:updated', {
              detail: this.data
            }));
          }
        }
      });
  },

  // ===== SPACED REPETITION =====
  updateSpacedRepetition(item, isCorrect) {
    if (!item.interval) {
      item.interval = 0;
      item.easeFactor = 2.5;
      item.repetitions = 0;
    }

    if (isCorrect) {
      if (item.repetitions === 0) {
        item.interval = 1;
      } else if (item.repetitions === 1) {
        item.interval = 6;
      } else {
        item.interval = Math.round(item.interval * item.easeFactor);
      }
      item.repetitions++;
    } else {
      item.repetitions = 0;
      item.interval = 1;
    }

    const quality = isCorrect ? 5 : 2;
    item.easeFactor = Math.max(1.3, item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + item.interval);
    item.nextReview = nextDate.toISOString();
  },

  // ===== EXPORT =====
  async export() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `progress_${timestamp}.json`;
    const content = JSON.stringify(this.data, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    alert('✅ Đã xuất file: ' + filename);
  },

  // ===== DEDUPLICATE =====
  deduplicate() {
    if (!this.data.progress || this.data.progress.length === 0) return;

    const unique = new Map();
    let removedCount = 0;

    this.data.progress.forEach(item => {
      let key;
      if (item.word) {
        key = `w_${item.lessonId}_${item.word.toLowerCase()}`;
      } else if (item.sentence && item.sentence.en) {
        key = `s_${item.lessonId}_${item.sentence.en.toLowerCase()}`;
      } else {
        // Fallback for invalid items (skip them or keep them unique by random?)
        // Let's filter invalid items out actually
        return;
      }

      if (unique.has(key)) {
        // Keep the one with more progress (higher repetitions or attempts)
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
      console.log(`🧹 Deduplicated: Removed ${removedCount} duplicate items`);
      this.saveToFirebase(); // Persist cleanup
    }
  },

  // ===== UTILS =====
  getCurrentLessonId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('lesson')) || 1;
  },

  getStats() {
    const total = this.data.progress.length;
    let mastered = 0;
    let learning = 0;
    let newItems = 0;

    this.data.progress.forEach(item => {
      const correct = item.correct || 0;
      const wrong = item.wrong || 0;
      const totalAttempts = correct + wrong;

      if (totalAttempts === 0) {
        newItems++;
      } else {
        const accuracy = correct / totalAttempts;
        if (accuracy >= 0.8 && totalAttempts >= 5 && wrong === 0) {
          mastered++;
        } else {
          learning++;
        }
      }
    });

    return { total, mastered, learning, newItems };
  },

  // Display userId (helper)
  displayUserId() {
    if (!this.userId) return;

    // Console display with border
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 YOUR USER ID (save this!)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(this.userId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
};

// Export
window.ProgressManager = ProgressManager;
