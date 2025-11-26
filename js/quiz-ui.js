/**
 * QUIZ UI - UI Rendering & Interaction
 * Render câu hỏi, xử lý interaction, effects
 */

const QuizUI = {
  container: null,
  themeColors: {
    primary: '#667eea',
    secondary: '#764ba2'
  },
  
  // ===== INIT =====
  init(containerSelector, colors = {}) {
    this.container = document.querySelector(containerSelector);
    if (colors.primary) this.themeColors.primary = colors.primary;
    if (colors.secondary) this.themeColors.secondary = colors.secondary;
    
    // Listen to quiz events
    window.addEventListener('quiz:showQuestion', (e) => this.renderQuestion(e.detail));
    window.addEventListener('quiz:answered', (e) => this.handleAnswerFeedback(e.detail));
    window.addEventListener('quiz:timerUpdate', (e) => this.updateTimer(e.detail));
    window.addEventListener('quiz:finished', (e) => this.renderSummary(e.detail));
  },
  
  // ===== MAIN RENDER =====
  renderQuestion({ question, index, total }) {
    let html = `
      <div class="quiz-progress-info">
        <span>Câu ${index + 1}/${total}</span>
        <span id="timer-display" class="timer-display"></span>
      </div>
    `;
    
    if (question.type === 'listen') {
      html += this.renderListen(question);
    } else if (question.type === 'read') {
      html += this.renderRead(question);
    } else if (question.type === 'write') {
      html += this.renderWrite(question);
    }
    
    this.container.innerHTML = html;
    
    // Auto-play for listen mode
    if (question.type === 'listen') {
      setTimeout(() => {
        const text = question.word || question.question || question.sentence;
        const lang = question.questionLang || 'en-US';
        if (text) window.playSpeech(text, lang);
      }, 500);
    }
  },
  
  // ===== LISTEN MODE =====
  renderListen(q) {
    let html = `<div class="question-container">`;
    
    if (q.subtype === 'sentence') {
      const text = q.question || q.sentence;
      const lang = q.questionLang || 'en-US';
      html += `
        <div class="question-text">👂 Nghe và chọn đúng</div>
        <button class="btn-listen" onclick="playSpeech('${this.escapeHtml(text)}', '${lang}')">🔊 Nghe lại</button>
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" onclick="QuizUI.selectAnswer('${this.escapeHtml(opt)}', '${this.escapeHtml(q.correctAnswer)}')">
              ${opt}
            </button>
          `).join('')}
        </div>
      `;
    } else if (q.subtype === 'image') {
      html += `
        <div class="question-text">👂 Nghe và chọn hình đúng</div>
        <button class="btn-listen" onclick="playSpeech('${this.escapeHtml(q.word)}', 'en-US')">🔊 Nghe lại</button>
        <div class="image-options">
          ${q.options.map(img => `
            <img src="../${img}" class="img-option" onclick="QuizUI.selectAnswer('${img}', '${q.correctAnswer}')" onerror="this.style.display='none'">
          `).join('')}
        </div>
      `;
    } else {
      html += `
        <div class="question-text">👂 Nghe và chọn nghĩa</div>
        <button class="btn-listen" onclick="playSpeech('${this.escapeHtml(q.word)}', 'en-US')">🔊 Nghe lại</button>
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" onclick="QuizUI.selectAnswer('${this.escapeHtml(opt)}', '${this.escapeHtml(q.correctAnswer)}')">
              ${opt}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  },
  
  // ===== READ MODE =====
  renderRead(q) {
    let html = `<div class="question-container">`;
    
    if (q.subtype === 'sentence') {
      html += `
        <div class="question-text">👁️ Đọc và chọn đúng</div>
        <div class="question-text" style="color: ${this.themeColors.primary}; font-size: 1.6em;">${q.question}</div>
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" onclick="QuizUI.selectAnswer('${this.escapeHtml(opt)}', '${this.escapeHtml(q.correctAnswer)}')">
              ${opt}
            </button>
          `).join('')}
        </div>
      `;
    } else {
      html += `
        <div class="question-text">👁️ Đọc và chọn đúng</div>
        <div class="question-text" style="color: ${this.themeColors.primary}; font-size: 1.6em;">${q.meaning}</div>
        ${q.image ? `<img src="../${q.image}" class="question-image" onerror="this.style.display='none'">` : ''}
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" onclick="QuizUI.selectAnswer('${this.escapeHtml(opt)}', '${this.escapeHtml(q.correctAnswer)}')">
              ${opt}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  },
  
  // ===== WRITE MODE =====
  renderWrite(q) {
    if (q.subtype === 'word') {
      return `<div class="question-container">
        <div class="question-text">✍️ Điền chữ cái còn thiếu</div>
        ${this.renderMissingLetter(q)}
      </div>`;
    } else {
      return `<div class="question-container">
        <div class="question-text">✍️ Sắp xếp từ thành câu</div>
        ${this.renderSentenceArrange(q)}
      </div>`;
    }
  },
  
  // ===== MISSING LETTER (inline) =====
  renderMissingLetter(q) {
    const numMissing = 1;
    const positions = [];
    
    while (positions.length < numMissing) {
      const idx = Math.floor(Math.random() * q.correctAnswer.length);
      if (!positions.includes(idx)) positions.push(idx);
    }
    
    // Kiểm tra xem ký tự thiếu có ở đầu từ không
    const isFirstLetter = positions[0] === 0;
    
    const correctLetters = positions.map(i => q.correctAnswer[i].toLowerCase());
    const wrongLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')
      .filter(c => !correctLetters.includes(c))
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(4, 8 - correctLetters.length));
    const allLetters = [...correctLetters, ...wrongLetters].sort(() => Math.random() - 0.5);
    
    const wordHtml = q.correctAnswer.split('').map((c, i) => {
      if (positions.includes(i)) {
        return `<span class="letter-blank" data-answer="${c.toLowerCase()}" data-word="${q.correctAnswer}"></span>`;
      }
      return `<span class="letter-fixed">${c}</span>`;
    }).join('');
    
    return `
      <div class="mb-2"><b>${q.meaning}</b></div>
      <div class="mb-2">Điền chữ cái còn thiếu:</div>
      <div class="word-display" style="font-size: 2em; margin: 20px 0; letter-spacing: 5px;">${wordHtml}</div>
      <div class="letter-choices" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px;">
        ${allLetters.map(letter => `<button class="letter-choice" onclick="QuizUI.selectLetter(this, '${letter}')">${isFirstLetter ? letter.toUpperCase() : letter}</button>`).join('')}
      </div>
    `;
  },
  
  selectLetter(btn, letter) {
    const blank = document.querySelector('.letter-blank:not(.filled)');
    if (!blank) return;
    
    const correctLetter = blank.dataset.answer;
    const word = blank.dataset.word;
    
    if (letter === correctLetter) {
      blank.textContent = letter.toUpperCase();
      blank.classList.add('filled', 'correct');
      btn.disabled = true;
      btn.style.opacity = '0.3';
      
      const allBlanks = document.querySelectorAll('.letter-blank');
      const filledBlanks = document.querySelectorAll('.letter-blank.filled');
      
      if (allBlanks.length === filledBlanks.length) {
        setTimeout(() => {
          window.playSpeech(word, 'en-US');
          setTimeout(() => window.QuizEngine.checkAnswer(true), 800);
        }, 500);
      }
    } else {
      blank.classList.add('wrong-shake');
      setTimeout(() => blank.classList.remove('wrong-shake'), 500);
      window.QuizEngine.checkAnswer(false);
    }
  },
  
  // ===== SENTENCE ARRANGE =====
  renderSentenceArrange(q) {
    const words = q.correctAnswer.replace(/[.?!]/g, '').split(' ').sort(() => Math.random() - 0.5);
    
    return `
      <div class="mb-2"><b>${q.sentence}</b></div>
      <div class="mb-2">Sắp xếp các từ thành câu đúng:</div>
      <div class="sentence-target" id="sentence-target" data-answer="${this.escapeHtml(q.correctAnswer)}" style="min-height: 60px; border: 3px dashed ${this.themeColors.primary}; border-radius: 10px; padding: 15px; background: rgba(255,255,255,0.9); margin-bottom: 15px;"></div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">${words.map(w => `<span class="sentence-word" onclick="QuizUI.clickSentenceWord(this)">${w}</span>`).join('')}</div>
      <button class="btn btn-sm btn-outline-secondary mt-3" onclick="QuizUI.resetSentence()">🔄 Xóa chọn</button>
    `;
  },
  
  clickSentenceWord(el) {
    if (el.classList.contains('used')) return;
    
    window.playSpeech(el.innerText, 'en-US');
    el.classList.add('used');
    
    const target = document.getElementById('sentence-target');
    const correct = target.dataset.answer;
    target.innerHTML += `<span class="sentence-word" style="margin: 3px; display: inline-block;">${el.innerText}</span> `;
    
    const chosen = [...target.querySelectorAll('.sentence-word')].map(e => e.innerText).join(' ').trim();
    if (chosen.split(' ').length === correct.replace(/[.?!]/g, '').split(' ').length) {
      const ok = chosen.toLowerCase() === correct.replace(/[.?!]/g, '').toLowerCase();
      
      setTimeout(() => {
        if (ok) {
          window.playSpeech(correct, 'en-US');
        }
        setTimeout(() => window.QuizEngine.checkAnswer(ok), ok ? 1500 : 500);
      }, 300);
    }
  },
  
  resetSentence() {
    document.getElementById('sentence-target').innerHTML = '';
    document.querySelectorAll('.sentence-word.used').forEach(e => e.classList.remove('used'));
  },
  
  // ===== ANSWER SELECTION =====
  selectAnswer(selected, correct) {
    const isCorrect = selected === correct;
    window.QuizEngine.checkAnswer(isCorrect);
  },
  
  // ===== FEEDBACK =====
  handleAnswerFeedback({ isCorrect, score, streak }) {
    if (isCorrect) {
      this.showCorrectFeedback(streak);
    } else {
      this.showWrongFeedback();
    }
    
    this.updateScore(score);
  },
  
  showCorrectFeedback(streak) {
    this.createConfetti();
    if (streak >= 3) {
      this.showStreakBadge(streak);
    }
  },
  
  showWrongFeedback() {
    // Shake animation
    if (this.container) {
      this.container.classList.add('shake');
      setTimeout(() => this.container.classList.remove('shake'), 500);
    }
  },
  
  // ===== EFFECTS =====
  createConfetti() {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }
  },
  
  showStreakBadge(streak) {
    const div = document.createElement('div');
    div.className = 'streak-badge';
    div.textContent = `🔥 ${streak} COMBO!`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  },
  
  // ===== TIMER =====
  updateTimer({ timeLeft }) {
    const display = document.getElementById('timer-display');
    if (display) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      display.textContent = `⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeLeft <= 5) {
        display.style.color = '#f5576c';
        display.style.animation = 'pulse 0.5s infinite';
      }
    }
  },
  
  // ===== SCORE =====
  updateScore(score) {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
      scoreDisplay.innerHTML = `
        <span style="color: #4CAF50;">✅ ${score.correct}</span>
        <span style="color: #f5576c;">❌ ${score.wrong}</span>
      `;
    }
  },
  
  // ===== SUMMARY =====
  renderSummary({ correct, wrong, total, accuracy, maxStreak }) {
    let stars = '⭐';
    if (accuracy >= 90) stars = '⭐⭐⭐';
    else if (accuracy >= 70) stars = '⭐⭐';
    
    this.createConfetti();
    window.playSpeech('Chúc mừng em đã hoàn thành! Giỏi lắm!', 'vi-VN');
    
    this.container.innerHTML = `
      <div class="summary-screen">
        <h2>🎉 Hoàn thành!</h2>
        <div class="summary-stars">${stars}</div>
        <div class="summary-stats">
          ✅ Đúng: ${correct}/${total} (${accuracy}%)<br>
          ❌ Sai: ${wrong}<br>
          🔥 Streak tốt nhất: ${maxStreak}
        </div>
        <div style="margin-top: 20px;">
          <button class="btn-fun btn-save" onclick="QuizUI.saveProgress()">💾 Lưu kết quả</button>
          <button class="btn-fun btn-home" onclick="QuizUI.goHome()">🏠 Về trang chủ</button>
        </div>
      </div>
    `;
  },
  
  saveProgress() {
    if (window.ProgressManager) {
      window.ProgressManager.export();
    }
  },
  
  goHome() {
    window.location.href = '../index.html';
  },
  
  // ===== UTILS =====
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Export
window.QuizUI = QuizUI;

