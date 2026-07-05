/**
 * LessonLoader - Quản lý việc tải dữ liệu bài học
 * Hỗ trợ tải từ lessons_index.json và các file lesson riêng lẻ
 */

const LessonLoader = {
  /**
   * Tải danh sách các bài học từ lessons_index.json
   */
  async loadIndex() {
    try {
      const response = await fetch('data/lessons_index.json?t=' + Date.now());
      if (!response.ok) throw new Error('Cannot load lessons index');
      return await response.json();
    } catch (error) {
      // Fallback: Nếu đang ở trong thư mục pages/
      try {
        const response = await fetch('../data/lessons_index.json?t=' + Date.now());
        if (!response.ok) throw new Error('Cannot load lessons index (fallback)');
        return await response.json();
      } catch (e) {
        console.error('LessonLoader Error:', e);
        throw e;
      }
    }
  },

  /**
   * Tải chi tiết một bài học theo ID
   * @param {number|string} id - Lesson ID
   */
  async loadLesson(id) {
    const fileName = `lesson_${id}.json`;
    try {
      // Thử đường dẫn từ root
      const response = await fetch(`data/lessons/${fileName}?t=${Date.now()}`);
      if (response.ok) return await response.json();
      
      // Thử đường dẫn từ pages/
      const responseFallback = await fetch(`../data/lessons/${fileName}?t=${Date.now()}`);
      if (responseFallback.ok) return await responseFallback.json();

      throw new Error(`Lesson ${id} not found`);
    } catch (error) {
      console.error(`Error loading lesson ${id}:`, error);
      throw error;
    }
  },

  /**
   * Tải TẤT CẢ bài học (Dùng cho trang chủ để tính stats)
   * Lưu ý: Sẽ tải song song nên cần cẩn thận performance nếu quá nhiều bài
   */
  async loadAllLessons() {
    try {
      const index = await this.loadIndex();
      if (!index || !index.lessons) return { lessons: [] };

      // Chuyển đổi danh sách bài học từ index thành mảng fetch promises
      // Chúng ta chỉ cần basic info từ index, nhưng nếu cần full info (như words count)
      // thì phải load từng file. 
      // Tuy nhiên, index hiện tại chưa có thông tin words count, nên ta PHẢI load content.
      
      const promises = index.lessons.map(l => this.loadLesson(l.id));
      const lessons = await Promise.all(promises);
      
      return {
        metadata: index.metadata,
        lessons: lessons
      };
    } catch (error) {
      console.error('Error loading all lessons:', error);
      // Fallback về file cũ nếu có lỗi (để tương thích ngược tạm thời nếu cần)
      try {
         const oldRes = await fetch('data/lessons.json');
         if(oldRes.ok) return await oldRes.json();
         const oldRes2 = await fetch('../data/lessons.json');
         if(oldRes2.ok) return await oldRes2.json();
      } catch(e) {}
      
      return { lessons: [] };
    }
  }
};

// Export cho môi trường module hoặc global
if (typeof window !== 'undefined') {
  window.LessonLoader = LessonLoader;
}
