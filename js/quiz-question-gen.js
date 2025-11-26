/**
 * QUIZ QUESTION GENERATOR
 * Tạo các loại câu hỏi từ lessons data
 */

const QuestionGenerator = {
  
  // ===== FOR SINGLE LESSON (lambaitap.html) =====
  forLesson(lesson, config, mode) {
    const limit = config[mode] || 10;
    const questions = [];
    const usedItems = new Set();
    
    // Collect all words and sentences
    const words = lesson.words.map(w => ({ ...w, lessonId: lesson.id }));
    const sentences = [];
    
    lesson.words.forEach(w => {
      if (w.sentences && w.sentences.length > 0) {
        w.sentences.forEach(s => {
          sentences.push({ ...s, word: w.word, wordMeaning: w.meaning, lessonId: lesson.id });
        });
      }
    });
    
    const mixedPool = [...words.map(w => ({ type: 'word', data: w })), 
                       ...sentences.map(s => ({ type: 'sentence', data: s }))];
    
    // Generate questions with repetition
    for (let i = 0; i < limit; i++) {
      if (usedItems.size === mixedPool.length) {
        usedItems.clear(); // Reset to allow repetition
      }
      
      let item;
      do {
        item = mixedPool[Math.floor(Math.random() * mixedPool.length)];
      } while (usedItems.has(item.data.word || item.data.en));
      
      usedItems.add(item.data.word || item.data.en);
      
      try {
        let question = null;
        if (item.type === 'word') {
          question = this.makeQuestion(mode, item.data);
        } else {
          question = this.makeQuestionFromSentence(mode, item.data);
        }
        
        if (question && question.type && question.correctAnswer) {
          questions.push(question);
        }
      } catch (e) {
        console.error('Lỗi tạo câu hỏi:', e, item);
      }
    }
    
    return questions;
  },
  
  // ===== FOR REVIEW (luyentap.html) =====
  forReview(lessons, progressData, config, mode) {
    const limit = config[mode] || 30;
    const questions = [];
    
    // Collect all items
    const allWords = [];
    const allSentences = [];
    
    lessons.forEach(lesson => {
      lesson.words.forEach(w => {
        allWords.push({ ...w, lessonId: lesson.id });
        
        if (w.sentences && w.sentences.length > 0) {
          w.sentences.forEach(s => {
            allSentences.push({ ...s, word: w.word, wordMeaning: w.meaning, lessonId: lesson.id });
          });
        }
      });
    });
    
    // Create pool with priority
    const mixedPool = [];
    
    allWords.forEach(word => {
      const progress = progressData.progress.find(p => p.word === word.word && p.lessonId === word.lessonId);
      const priority = progress ? this.calculatePriority(word, progress) : 10;
      mixedPool.push({ type: 'word', data: word, priority });
    });
    
    allSentences.forEach(sentence => {
      const progress = progressData.progress.find(p => 
        p.sentence && p.sentence.en === sentence.en && p.lessonId === sentence.lessonId
      );
      const priority = progress ? this.calculatePriority(sentence, progress) : 10;
      mixedPool.push({ type: 'sentence', data: sentence, priority });
    });
    
    // Sort by priority and select items
    mixedPool.sort((a, b) => b.priority - a.priority);
    const selectedItems = this.selectItemsWithRandomization(mixedPool, limit);
    
    // Generate questions
    selectedItems.forEach(item => {
      try {
        let question = null;
        if (item.type === 'word') {
          question = this.makeQuestion(mode, item.data);
        } else {
          question = this.makeQuestionFromSentence(mode, item.data);
        }
        
        if (question && question.type && question.correctAnswer) {
          questions.push(question);
        }
      } catch (e) {
        console.error('Lỗi tạo câu hỏi:', e, item);
      }
    });
    
    return questions;
  },
  
  // ===== PRIORITY CALCULATION =====
  calculatePriority(item, progress) {
    const { correct, wrong, lastReviewed } = progress;
    
    const baseScore = (wrong || 0) * 3 - (correct || 0) * 1.5;
    
    const daysSince = lastReviewed ? 
      (Date.now() - new Date(lastReviewed)) / 86400000 : 30;
    const timeScore = Math.min(daysSince / 2, 15);
    
    const difficultyScore = this.getDifficultyScore(item);
    const masteryScore = this.getMasteryScore(correct || 0, wrong || 0);
    
    return baseScore + timeScore + difficultyScore + masteryScore;
  },
  
  getDifficultyScore(item) {
    if (!item.word) return 0;
    const word = item.word.toLowerCase();
    
    if (word.length <= 3 && /^[a-z]+$/.test(word)) {
      return 5;
    }
    
    if (word.length <= 6) {
      return 0;
    }
    
    return -3;
  },
  
  getMasteryScore(correct, wrong) {
    const total = correct + wrong;
    if (total === 0) return 10;
    
    const accuracy = correct / total;
    if (accuracy >= 0.8) return -5;
    if (accuracy >= 0.5) return 0;
    return 8;
  },
  
  selectItemsWithRandomization(pool, count) {
    const selected = [];
    const poolSize = pool.length;
    
    for (let i = 0; i < count && i < poolSize; i++) {
      let selectedItem;
      
      if (Math.random() < 0.2 && pool.length > 10) {
        const randomIndex = Math.floor(Math.random() * Math.min(pool.length / 2, 20));
        selectedItem = pool[randomIndex];
      } else {
        selectedItem = pool[i];
      }
      
      selected.push(selectedItem);
    }
    
    return selected;
  },
  
  // ===== MAKE QUESTION FROM WORD =====
  makeQuestion(mode, w) {
    if (!w || !w.word || !w.meaning) {
      console.warn('Dữ liệu từ không hợp lệ:', w);
      return null;
    }
    
    if (mode === 'listen') {
      const validImages = w.images ? w.images.filter(this.isValidImage) : [];
      const hasImages = validImages.length > 0;
      const byImage = hasImages && Math.random() < 0.3;
      
      if (byImage) {
        const others = window.LESSONS_DATA.lessons.flatMap(l => l.words).filter(x => x.word !== w.word);
        const wrongImgs = others.flatMap(o => o.images || []).filter(this.isValidImage).sort(() => Math.random() - 0.5).slice(0, 2);
        const correctImg = validImages[Math.floor(Math.random() * validImages.length)];
        
        if (wrongImgs.length >= 2 && correctImg) {
          return {
            type: 'listen',
            subtype: 'image',
            word: w.word,
            correctImage: correctImg,
            correctAnswer: correctImg,
            options: [correctImg, ...wrongImgs].sort(() => Math.random() - 0.5)
          };
        }
      }
      
      return {
        type: 'listen',
        subtype: 'text',
        word: w.word,
        meaning: w.meaning,
        correctAnswer: w.meaning,
        options: this.makeOptions(w, 'meaning')
      };
      
    } else if (mode === 'read') {
      const validImages = w.images ? w.images.filter(this.isValidImage) : [];
      const useImage = validImages.length > 0 && Math.random() < 0.3;
      const selectedImage = useImage ? validImages[Math.floor(Math.random() * validImages.length)] : null;
      
      return {
        type: 'read',
        word: w.word,
        meaning: w.meaning,
        image: selectedImage,
        correctAnswer: w.word,
        options: this.makeOptions(w, 'word')
      };
      
    } else {
      return {
        type: 'write',
        subtype: 'word',
        question: w.meaning,
        correctAnswer: w.word,
        questionLang: 'vi-VN',
        meaning: w.meaning
      };
    }
  },
  
  // ===== MAKE QUESTION FROM SENTENCE =====
  makeQuestionFromSentence(mode, sentenceData) {
    const s = sentenceData;
    
    if (!s || !s.en || !s.vi) {
      console.warn('Dữ liệu câu không hợp lệ:', s);
      return null;
    }
    
    const flip = Math.random() < 0.4;
    
    if (mode === 'listen') {
      return {
        type: 'listen',
        subtype: 'sentence',
        question: flip ? s.vi : s.en,
        correctAnswer: flip ? s.en : s.vi,
        questionLang: flip ? 'vi-VN' : 'en-US',
        options: this.makeSentenceOptions(s, flip)
      };
    } else if (mode === 'read') {
      return {
        type: 'read',
        subtype: 'sentence',
        question: flip ? s.vi : s.en,
        correctAnswer: flip ? s.en : s.vi,
        questionLang: flip ? 'vi-VN' : 'en-US',
        options: this.makeSentenceOptions(s, flip)
      };
    } else {
      return {
        type: 'write',
        subtype: 'sentence',
        question: flip ? s.vi : s.en,
        correctAnswer: flip ? s.en : s.vi,
        questionLang: flip ? 'vi-VN' : 'en-US',
        sentence: flip ? s.vi : s.en
      };
    }
  },
  
  // ===== OPTIONS GENERATION =====
  makeOptions(w, field) {
    const others = window.LESSONS_DATA.lessons.flatMap(l => l.words).filter(x => x.word !== w.word);
    const pool = others.sort(() => Math.random() - 0.5).slice(0, 2).map(x => x[field]).filter(x => x && x.trim() !== '');
    
    if (pool.length < 2) {
      const fallback = field === 'word' ? ['Cat', 'Dog'] : ['Mèo', 'Chó'];
      pool.push(...fallback.slice(0, 2 - pool.length));
    }
    
    return [w[field], ...pool].sort(() => Math.random() - 0.5);
  },
  
  makeSentenceOptions(sentence, flip) {
    const allSentences = window.LESSONS_DATA.lessons.flatMap(l => l.words)
      .flatMap(w => w.sentences || [])
      .filter(s => s !== sentence && s.en && s.vi);
    
    const shuffled = allSentences.sort(() => Math.random() - 0.5);
    let wrongOptions = shuffled.slice(0, 2)
      .map(s => flip ? s.en : s.vi)
      .filter(option => option && option.trim() !== '');
    
    if (wrongOptions.length < 2) {
      const defaults = flip ? 
        ['Hello, how are you?', 'Good morning!'] :
        ['Xin chào, bạn khỏe không?', 'Chào buổi sáng!'];
      wrongOptions.push(...defaults.slice(0, 2 - wrongOptions.length));
    }
    
    const correct = flip ? sentence.en : sentence.vi;
    return [correct, ...wrongOptions].sort(() => Math.random() - 0.5);
  },
  
  // ===== UTILS =====
  isValidImage(imgPath) {
    return imgPath && imgPath.trim() !== '' && imgPath !== 'null' && imgPath !== 'undefined';
  }
};

// Export
window.QuestionGenerator = QuestionGenerator;

