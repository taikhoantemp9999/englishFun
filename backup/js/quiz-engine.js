/**
 * QUIZ ENGINE - Core Quiz State & Flow Management
 * Quản lý state và logic chính của quiz
 */

const QuizEngine = {
  // ===== STATE =====
  questions: [],
  currentIndex: 0,
  score: {
    correct: 0,
    wrong: 0
  },
  streak: 0,
  maxStreak: 0,
  timer: null,
  timeLeft: 0,
  config: null,
  
  // ===== LIFECYCLE =====
  init(config) {
    this.config = config;
    this.reset();
  },
  
  reset() {
    this.questions = [];
    this.currentIndex = 0;
    this.score = { correct: 0, wrong: 0 };
    this.streak = 0;
    this.maxStreak = 0;
    this.stopTimer();
  },
  
  start(questions) {
    this.questions = questions;
    this.currentIndex = 0;
    this.showCurrentQuestion();
  },
  
  // ===== NAVIGATION =====
  showCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) {
      this.finish();
      return;
    }
    
    const question = this.getCurrentQuestion();
    this.startTimer(question);
    
    // Dispatch event để UI render
    window.dispatchEvent(new CustomEvent('quiz:showQuestion', { 
      detail: { question, index: this.currentIndex, total: this.questions.length }
    }));
  },
  
  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  },
  
  next() {
    this.currentIndex++;
    setTimeout(() => this.showCurrentQuestion(), 500);
  },
  
  // ===== ANSWER HANDLING =====
  checkAnswer(isCorrect) {
    this.stopTimer();
    
    const question = this.getCurrentQuestion();
    
    if (isCorrect) {
      this.score.correct++;
      this.streak++;
      this.maxStreak = Math.max(this.maxStreak, this.streak);
    } else {
      this.score.wrong++;
      this.streak = 0;
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('quiz:answered', {
      detail: { isCorrect, question, score: this.score, streak: this.streak }
    }));
    
    // Update progress if callback provided
    if (this.config && this.config.onAnswer) {
      this.config.onAnswer(question, isCorrect);
    }
    
    // Auto next
    setTimeout(() => this.next(), isCorrect ? 1500 : 1000);
  },
  
  // ===== TIMER =====
  startTimer(question) {
    this.stopTimer();
    
    this.timeLeft = this.calculateQuestionTime(question);
    
    window.dispatchEvent(new CustomEvent('quiz:timerUpdate', {
      detail: { timeLeft: this.timeLeft }
    }));
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      window.dispatchEvent(new CustomEvent('quiz:timerUpdate', {
        detail: { timeLeft: this.timeLeft }
      }));
      
      if (this.timeLeft <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  },
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  
  calculateQuestionTime(question) {
    const timerCfg = window.CONFIG?.timer || {};
    let time = timerCfg.base_time || 30;
    
    if (question.subtype === 'sentence' || question.sentence) {
      time += timerCfg.sentence_bonus || 15;
    }
    
    const word = question.word || question.sentence || '';
    const wordLength = word.length;
    
    if (wordLength <= (timerCfg.short_word_length || 4)) {
      time -= timerCfg.short_word_penalty || 5;
    } else if (wordLength >= (timerCfg.long_word_length || 8)) {
      time += timerCfg.long_word_bonus || 5;
    }
    
    const modeBonus = timerCfg.mode_bonus?.[question.type] || 0;
    time += modeBonus;
    
    return Math.max(timerCfg.min_time || 10, Math.min(timerCfg.max_time || 60, time));
  },
  
  handleTimeout() {
    this.stopTimer();
    window.dispatchEvent(new CustomEvent('quiz:timeout'));
    this.checkAnswer(false);
  },
  
  // ===== FINISH =====
  finish() {
    this.stopTimer();
    
    const total = this.score.correct + this.score.wrong;
    const accuracy = total > 0 ? Math.round((this.score.correct / total) * 100) : 0;
    
    const summary = {
      correct: this.score.correct,
      wrong: this.score.wrong,
      total,
      accuracy,
      maxStreak: this.maxStreak
    };
    
    window.dispatchEvent(new CustomEvent('quiz:finished', { detail: summary }));
    
    if (this.config && this.config.onFinish) {
      this.config.onFinish(summary);
    }
  }
};

// Export cho window
window.QuizEngine = QuizEngine;

