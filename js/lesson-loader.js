/**
 * LessonLoader - Quản lý việc tải dữ liệu bài học từ Cloud Firebase Realtime Database
 * Tự động đồng bộ và import ban đầu từ các file JSON địa phương lên Firebase.
 * Hỗ trợ chuyển đổi Object thành mảng và cơ chế Fallback an toàn tuyệt đối.
 */

const LessonLoader = {
  // Lấy đường dẫn fetch chính xác dựa theo thư mục hiện tại
  getRelativePath(path) {
    // Nếu trang đang chạy nằm trong thư mục pages/
    if (window.location.pathname.includes('/pages/')) {
      return '../' + path;
    }
    return path;
  },

  // Chuẩn hóa dữ liệu Firebase trả về thành mảng hợp lệ
  normalizeFirebaseArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.filter(Boolean); // Lọc bỏ phần tử null
    }
    if (typeof val === 'object') {
      const arr = [];
      Object.keys(val).forEach(key => {
        const idx = parseInt(key);
        if (!isNaN(idx)) {
          arr[idx] = val[key];
        } else {
          arr.push(val[key]);
        }
      });
      return arr.filter(Boolean);
    }
    return [];
  },

  /**
   * Tải TẤT CẢ bài học của môn học (Tiếng Anh hoặc Toán)
   * @param {string} subject - 'english' hoặc 'math'
   */
  async loadAllLessons(subject = 'english') {
    const dbPath = `lessons/${subject}`;

    try {
      // 1. Thử tải từ Firebase Realtime Database
      if (typeof firebase !== 'undefined' && typeof firebaseDB !== 'undefined') {
        console.log(`☁️ Đang tải bài học môn ${subject} từ Firebase...`);
        const snapshot = await firebaseDB.ref(dbPath).once('value');

        if (snapshot.exists()) {
          const rawVal = snapshot.val();
          const lessons = this.normalizeFirebaseArray(rawVal);
          
          if (lessons && lessons.length > 0) {
            console.log(`✅ Đã tải ${lessons.length} bài học ${subject} từ Firebase.`);
            return { lessons: lessons };
          }
        }
        
        // Nếu node tồn tại nhưng trống rác hoặc rỗng, tiến hành ghi đè dữ liệu chuẩn
        console.log(`📝 Firebase trống hoặc lỗi cấu trúc cho môn ${subject}. Khởi tạo lại...`);
        const localData = await this.initializeLessonsOnFirebase(subject);
        if (localData && localData.lessons && localData.lessons.length > 0) {
          return localData;
        }
      }
    } catch (error) {
      console.error(`❌ Lỗi Firebase khi tải bài học môn ${subject}:`, error);
    }

    // 2. Fallback: Nếu Firebase lỗi hoặc không kết nối được, đọc file cục bộ trực tiếp
    console.warn(`⚠️ Đang đọc trực tiếp file cục bộ dự phòng cho môn ${subject}...`);
    return await this.loadFromLocalFiles(subject);
  },

  /**
   * Khởi tạo và nạp dữ liệu bài học lên Firebase lần đầu tiên
   */
  async initializeLessonsOnFirebase(subject) {
    try {
      const localData = await this.loadFromLocalFiles(subject);
      if (localData && localData.lessons && localData.lessons.length > 0) {
        // Nạp lên Firebase Realtime Database
        await firebaseDB.ref(`lessons/${subject}`).set(localData.lessons);
        console.log(`🚀 Đã nạp thành công ${localData.lessons.length} bài học ${subject} lên Firebase.`);
        return localData;
      }
    } catch (e) {
      console.error(`❌ Lỗi nạp bài học lên Firebase cho môn ${subject}:`, e);
    }
    return { lessons: [] };
  },

  /**
   * Tải bài học từ tệp JSON địa phương hoặc biến JS tĩnh (dự phòng hoặc nạp ban đầu)
   */
  async loadFromLocalFiles(subject) {
    if (subject === 'math') {
      // 1. Thử đọc biến toàn cục trước (CORS Safe)
      if (typeof window !== 'undefined' && window.MATH_LESSONS_DATA) {
        console.log('📦 Tải bài học Toán từ biến toàn cục MATH_LESSONS_DATA (CORS Safe).');
        return { lessons: this.normalizeFirebaseArray(window.MATH_LESSONS_DATA.lessons) };
      }
      // 2. Thử fetch dự phòng
      try {
        const mathPath = this.getRelativePath('data/math_lessons.json');
        const response = await fetch(mathPath + '?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          return { lessons: this.normalizeFirebaseArray(data.lessons) };
        }
      } catch (e) {
        console.warn('Không fetch được file math_lessons.json:', e);
      }
      return { lessons: [] };
    } else {
      // 1. Thử đọc biến toàn cục trước (CORS Safe)
      if (typeof window !== 'undefined' && window.ENGLISH_LESSONS_DATA) {
        console.log('📦 Tải bài học Tiếng Anh từ biến toàn cục ENGLISH_LESSONS_DATA (CORS Safe).');
        return { lessons: this.normalizeFirebaseArray(window.ENGLISH_LESSONS_DATA.lessons) };
      }
      // 2. Thử fetch dự phòng
      try {
        const engPath = this.getRelativePath('data/english_lessons.json');
        const response = await fetch(engPath + '?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          return { lessons: this.normalizeFirebaseArray(data.lessons) };
        }
      } catch (e) {
        console.warn('Không fetch được file english_lessons.json:', e);
      }
      return { lessons: [] };
    }
  },

  /**
   * Tải chi tiết một bài học theo ID từ Firebase hoặc Local
   */
  async loadLesson(subject = 'english', id) {
    try {
      const all = await this.loadAllLessons(subject);
      const lesson = all.lessons.find(l => String(l.id) === String(id));
      if (lesson) return lesson;
      
      throw new Error(`Không tìm thấy bài học ${id}`);
    } catch (error) {
      console.error(`Lỗi tải bài học ${subject} với ID ${id}:`, error);
      throw error;
    }
  }
};

// Export
if (typeof window !== 'undefined') {
  window.LessonLoader = LessonLoader;
}
