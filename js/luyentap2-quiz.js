'use strict';

// ==================== LUYENTAP2 - ADVANCED REVIEW WITH MULTI-LESSON ====================
// Combines:
// - Advanced priority algorithm from lambaitap.html
// - Multi-lesson selection from luyentap.html
// - Balanced word/sentence ratio with selectBalancedItems

// GLOBAL STATE
let CONFIG = null;
let LESSONS_DATA = null;
let currentLesson = null;
let currentLessonId = null;
let currentMode = null;
let quizQuestions = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizWrong = 0;
let correctStreak = 0;
let maxStreak = 0;
let currentTimer = null;
let timeLeft = 0;
let progressData = { progress: [] };
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// ==================== DATA LOADING ====================

async function loadData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        currentLessonId = parseInt(urlParams.get('lesson') || '1');

        const [config, lessons, progress] = await Promise.all([
            fetch('../config.json').then(r => r.json()),
            fetch('../data/lessons.json').then(r => r.json()),
            loadProgress()
        ]);

        CONFIG = config;
        LESSONS_DATA = lessons;
        currentLesson = lessons.lessons.find(l => l.id === currentLessonId);
        progressData = progress;

        if (!currentLesson) {
            alert('Không tìm thấy bài học!');
            window.location.href = '../index.html';
            return;
        }

        document.getElementById('lesson-info').textContent = `Ôn tập nâng cao: Bài 1 → Bài ${currentLessonId}`;
    } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        alert('Có lỗi xảy ra khi tải dữ liệu!');
    }
}

async function loadProgress() {
    try {
        const response = await fetch('../data/progress.json');
        return await response.json();
    } catch (e) {
        console.warn('Không load được progress, dùng mặc định');
        return { progress: [] };
    }
}

// ==================== AUDIO & VISUAL EFFECTS ====================

function playSpeech(text, lang = 'en-US') {
    if (!text) return;
    speechSynthesis.cancel();
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;
        utterance.pitch = 1.1;
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (voice) utterance.voice = voice;
        speechSynthesis.speak(utterance);
    }, 180);
}

function playCorrectSound() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
}

function playWrongSound() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.2);
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4CAF50', '#2196F3', '#FFD93D', '#9C27B0', '#f093fb'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const conf = document.createElement('div');
            conf.className = 'confetti';
            conf.style.left = Math.random() * 100 + 'vw';
            conf.style.background = colors[Math.floor(Math.random() * colors.length)];
            conf.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 3000);
        }, i * 30);
    }
}

function createStar(x, y) {
    const star = document.createElement('div');
    star.className = 'star-pop';
    star.textContent = '⭐';
    star.style.left = x + 'px';
    star.style.top = y + 'px';
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 1500);
}

function showStreakCombo(streak) {
    if (streak < 3) return;
    const div = document.createElement('div');
    div.className = 'streak-display';
    div.textContent = `🔥 ${streak} COMBO!`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

// ==================== QUIZ LOGIC ====================

function startQuiz(mode) {
    currentMode = mode;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('progress-container').classList.remove('hidden');
    document.getElementById('score-display').classList.remove('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('btn-skip').classList.remove('hidden');

    const cfg = CONFIG.daily_review.max_questions; // Use daily_review config for multi-lesson
    let questions = [];

    // KEY DIFFERENCE: Get all lessons <= currentLessonId
    const lessonsToReview = LESSONS_DATA.lessons.filter(l => l.id <= currentLessonId);
    console.log(`📚 Luyện tập từ ${lessonsToReview.length} bài học (Bài 1 → Bài ${currentLessonId})`);

    if (mode != 'mix') {
        questions = generateReviewQuestions(lessonsToReview, cfg, mode);
    } else {
        const order = ['listen', 'read', 'write'];
        for (const m of order) {
            const modeQuestions = generateReviewQuestions(lessonsToReview, cfg, m);
            questions.push(...modeQuestions);
        }
        questions.sort(() => Math.random() - 0.5);
    }

    quizQuestions = questions;
    quizIndex = 0;
    quizCorrect = 0;
    quizWrong = 0;
    correctStreak = 0;
    maxStreak = 0;

    updateScoreDisplay();
    showNextQuestion();
}

// ==================== QUESTION GENERATION WITH PRIORITY ALGORITHM ====================

/**
 * Generate review questions from MULTIPLE lessons with advanced priority
 * This is the KEY function that differs from lambaitap.html
 */
function generateReviewQuestions(lessons, cfg, mode) {
    const limit = cfg[mode] || 30;
    const sentenceRatio = CONFIG.new_lesson?.question_ratio?.sentence_percentage || 0.4;
    const arr = [];

    // Collect ALL items from ALL lessons
    const allWords = [];
    const allSentences = [];

    for (const lesson of lessons) {
        for (const w of lesson.words) {
            allWords.push({ ...w, lessonId: lesson.id });

            if (w.sentences && w.sentences.length > 0) {
                for (const s of w.sentences) {
                    allSentences.push({ ...s, word: w.word, wordMeaning: w.meaning, lessonId: lesson.id });
                }
            }
        }
    }

    console.log(`📊 Pool: ${allWords.length} từ, ${allSentences.length} câu từ ${lessons.length} bài`);

    // Create pool with priority scores
    const mixedPool = [];

    // Add words with priority
    allWords.forEach(word => {
        const progress = progressData.progress.find(p =>
            p.word === word.word && p.lessonId === word.lessonId
        );
        const priority = progress ? calculateAdvancedPriority(word, progress) : 10;
        mixedPool.push({ type: 'word', data: word, priority });
    });

    // Add sentences with priority
    allSentences.forEach(sentence => {
        const progress = progressData.progress.find(p =>
            p.sentence && p.sentence.en === sentence.en && p.lessonId === sentence.lessonId
        );
        const priority = progress ? calculateAdvancedPriority(sentence, progress) : 10;
        mixedPool.push({ type: 'sentence', data: sentence, priority });
    });

    // Sort by priority (highest first)
    mixedPool.sort((a, b) => b.priority - a.priority);

    // Select balanced mix of words and sentences
    const balancedPool = selectBalancedItems(mixedPool, limit, sentenceRatio);

    // Apply weighted randomization for variety
    const selectedItems = selectItemsWithRandomization(balancedPool, balancedPool.length);

    console.log(`✅ Chọn ${selectedItems.length} câu hỏi (${selectedItems.filter(i => i.type === 'word').length} từ, ${selectedItems.filter(i => i.type === 'sentence').length} câu)`);

    // Generate questions from selected items
    for (const item of selectedItems) {
        let question = null;
        try {
            if (item.type === 'word') {
                question = makeQuestion(mode, item.data);
            } else {
                question = makeQuestionFromSentence(mode, item.data);
            }

            if (question && question.type && question.correctAnswer) {
                arr.push(question);
            }
        } catch (e) {
            console.error('Lỗi tạo câu hỏi:', e, item);
        }
    }

    return arr;
}

// ==================== PRIORITY ALGORITHM ====================
// Advanced priority calculation from lambaitap.html

/**
 * Calculate difficulty score for words and sentences
 * Higher score = higher priority
 */
function getDifficultyScore(item) {
    // Handle sentences
    if (item.en) {
        const wordCount = item.en.split(' ').length;
        if (wordCount <= 3) return -5;  // Simple sentences = low priority
        if (wordCount <= 6) return 0;   // Medium sentences
        return 3;                        // Long sentences = high priority
    }

    // Handle words
    if (!item.word) return 0;
    const word = item.word.toLowerCase();

    if (word.length === 1) return -5;                          // A, B, C = very low priority
    if (word.length <= 3 && /^[a-z]+$/.test(word)) return -3; // ant, boy = low priority
    if (word.length <= 6) return 0;                            // hello = medium
    return 3;                                                  // goodbye = high priority
}

/**
 * Calculate mastery score based on correct/wrong ratio
 * Higher score = less mastered = higher priority
 */
function getMasteryScore(correct, wrong) {
    const total = correct + wrong;
    if (total === 0) return 10; // Never practiced = very high priority

    const accuracy = correct / total;
    if (accuracy >= 0.8) return -5; // Mastered (≥80%) = low priority
    if (accuracy >= 0.5) return 0;  // Learning (50-80%) = medium priority
    return 8;                        // Struggling (<50%) = high priority
}

/**
 * Calculate comprehensive priority score combining multiple factors
 */
function calculateAdvancedPriority(item, progress) {
    const { correct, wrong, lastReviewed } = progress;

    // Base score: wrong answers increase priority, correct answers decrease it
    const baseScore = wrong * 3 - correct * 1.5;

    // Time score: longer time since last review = higher priority
    const daysSince = lastReviewed ?
        (Date.now() - new Date(lastReviewed)) / 86400000 : 30;
    const timeScore = Math.min(daysSince / 2, 15);

    // Difficulty score: harder items = higher priority
    const difficultyScore = getDifficultyScore(item);

    // Mastery score: less mastered = higher priority
    const masteryScore = getMasteryScore(correct || 0, wrong || 0);

    return baseScore + timeScore + difficultyScore + masteryScore;
}

/**
 * Select items with weighted randomization
 * 80% follow priority order, 20% random from top half
 */
function selectItemsWithRandomization(pool, count) {
    const selected = [];

    for (let i = 0; i < count && i < pool.length; i++) {
        let selectedItem;

        // 20% chance: pick randomly from top half for variety
        if (Math.random() < 0.2 && pool.length > 10) {
            const randomIndex = Math.floor(Math.random() * Math.min(pool.length / 2, 20));
            selectedItem = pool[randomIndex];
        } else {
            // 80% chance: pick by priority order
            selectedItem = pool[i];
        }

        selected.push(selectedItem);
    }

    return selected;
}

/**
 * Select balanced mix of words and sentences based on target ratio
 */
function selectBalancedItems(pool, limit, sentenceRatio = 0.4) {
    // Separate words and sentences
    const words = pool.filter(item => item.type === 'word');
    const sentences = pool.filter(item => item.type === 'sentence');

    // Calculate targets
    const targetSentences = Math.floor(limit * sentenceRatio);
    const targetWords = limit - targetSentences;

    // Take top items by priority (already sorted)
    const selectedWords = words.slice(0, Math.min(targetWords, words.length));
    const selectedSentences = sentences.slice(0, Math.min(targetSentences, sentences.length));

    // Combine and shuffle to mix them up
    const combined = [...selectedWords, ...selectedSentences];
    return combined.sort(() => Math.random() - 0.5);
}

// ==================== QUESTION MAKERS ====================

function isValidImage(imgPath) {
    return imgPath && imgPath.trim() !== '' && imgPath !== 'null' && imgPath !== 'undefined';
}

function makeQuestion(mode, w) {
    function arrRand(a) { return a[Math.floor(Math.random() * a.length)]; }

    if (!w || !w.word || !w.meaning) {
        console.warn('Dữ liệu từ không hợp lệ:', w);
        return null;
    }

    if (mode === 'listen') {
        const validImages = w.images ? w.images.filter(isValidImage) : [];
        const hasImages = validImages.length > 0;
        const byImage = hasImages && Math.random() < 0.3;

        if (byImage) {
            const others = LESSONS_DATA.lessons.flatMap(l => l.words).filter(x => x.word !== w.word);
            const wrongImgs = others.flatMap(o => o.images || []).filter(isValidImage).sort(() => Math.random() - 0.5).slice(0, 2);
            const correctImg = arrRand(validImages);

            if (wrongImgs.length >= 2 && correctImg) {
                return { type: 'listen', subtype: 'image', word: w.word, correctImage: correctImg, correctAnswer: correctImg, options: [correctImg, ...wrongImgs].sort(() => Math.random() - 0.5) };
            } else {
                return { type: 'listen', subtype: 'text', word: w.word, meaning: w.meaning, correctAnswer: w.meaning, options: makeOptions(w, 'meaning') };
            }
        } else {
            return { type: 'listen', subtype: 'text', word: w.word, meaning: w.meaning, correctAnswer: w.meaning, options: makeOptions(w, 'meaning') };
        }
    } else if (mode === 'read') {
        const validImages = w.images ? w.images.filter(isValidImage) : [];
        const hasImages = validImages.length > 0;
        const useImage = hasImages && Math.random() < 0.3;
        const selectedImage = useImage ? arrRand(validImages) : null;

        return {
            type: 'read',
            word: w.word,
            meaning: w.meaning,
            image: selectedImage,
            correctAnswer: w.word,
            options: makeOptions(w, 'word')
        };
    } else {
        return {
            type: 'write',
            subtype: 'word',
            word: w.word,
            meaning: w.meaning,
            correctAnswer: w.word
        };
    }
}

function makeOptions(w, field) {
    const others = LESSONS_DATA.lessons.flatMap(l => l.words).filter(x => x.word !== w.word);
    const pool = others.sort(() => Math.random() - 0.5).slice(0, 2).map(x => x[field]).filter(x => x && x.trim() !== '');

    if (pool.length < 2) {
        const fallback = field === 'word' ? ['Cat', 'Dog'] : ['Mèo', 'Chó'];
        pool.push(...fallback.slice(0, 2 - pool.length));
    }

    const correct = w[field];
    return [correct, ...pool].sort(() => Math.random() - 0.5);
}

function makeQuestionFromSentence(mode, sentenceData) {
    const s = sentenceData;

    if (!s || !s.en || !s.vi) {
        console.warn('Dữ liệu câu không hợp lệ:', s);
        return null;
    }

    if (mode === 'listen') {
        const flip = Math.random() < 0.5;
        return {
            type: 'listen',
            subtype: 'sentence',
            sentence: flip ? s.vi : s.en,
            correctAnswer: flip ? s.en : s.vi,
            flip: flip,
            options: makeSentenceOptions(s, flip)
        };
    } else if (mode === 'read') {
        const flip = Math.random() < 0.5;
        return {
            type: 'read',
            subtype: 'sentence',
            sentence: flip ? s.vi : s.en,
            correctAnswer: flip ? s.en : s.vi,
            flip: flip,
            options: makeSentenceOptions(s, flip)
        };
    } else {
        return {
            type: 'write',
            subtype: 'sentence',
            sentence: s.vi,
            correctAnswer: s.en
        };
    }
}

function makeSentenceOptions(sentence, flip) {
    const allSentences = LESSONS_DATA.lessons.flatMap(l => l.words)
        .flatMap(w => w.sentences || [])
        .filter(s => s !== sentence && s.en && s.vi);

    const wrongSentences = allSentences.sort(() => Math.random() - 0.5).slice(0, 2);
    const correct = flip ? sentence.en : sentence.vi;
    const wrongs = wrongSentences.map(s => flip ? s.en : s.vi);

    if (wrongs.length < 2) {
        const fallback = ['I am a student', 'This is a book'];
        wrongs.push(...fallback.slice(0, 2 - wrongs.length));
    }

    return [correct, ...wrongs].sort(() => Math.random() - 0.5);
}

// ==================== QUESTION DISPLAY ====================

function showNextQuestion() {
    if (quizIndex >= quizQuestions.length) {
        showSummary();
        return;
    }

    const q = quizQuestions[quizIndex];
    if (!q) {
        console.error('Question is undefined at index:', quizIndex);
        return;
    }

    updateProgress();
    startTimer(q);

    const area = document.getElementById('quiz-area');
    if (!area) {
        console.error('quiz-area element not found');
        return;
    }

    let html = '';

    if (q.type === 'listen') {
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
            console.error('Invalid options for question:', q);
            html = '<div class="question-text">Lỗi: Không có lựa chọn cho câu hỏi này</div>';
        } else if (q.subtype === 'text') {
            const wordToSpeak = q.word || '';
            html = `
        <div class="question-text">👂 Nghe và chọn nghĩa đúng</div>
        <button class="btn-fun btn-replay-audio" data-text="${escapeAttr(wordToSpeak)}" data-lang="en-US" style="background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%); color: white;">
          🔊 Nghe lại
        </button>
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" data-opt="${escapeAttr(opt)}" data-answer="${escapeAttr(q.correctAnswer || '')}">
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
      `;
            setTimeout(() => playSpeech(q.word, 'en-US'), 500);
        } else if (q.subtype === 'image') {
            const wordToSpeak = q.word || '';
            html = `
        <div class="question-text">👂 Nghe và chọn hình đúng</div>
        <button class="btn-fun btn-replay-audio" data-text="${escapeAttr(wordToSpeak)}" data-lang="en-US" style="background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%); color: white;">
          🔊 Nghe lại
        </button>
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" data-opt="${escapeAttr(opt)}" data-answer="${escapeAttr(q.correctAnswer || '')}">
              <img src="../${escapeHtml(opt)}" class="option-image" onerror="this.style.display='none'">
            </button>
          `).join('')}
        </div>
      `;
            setTimeout(() => playSpeech(q.word, 'en-US'), 500);
        } else if (q.subtype === 'sentence') {
            const lang = q.flip ? 'vi-VN' : 'en-US';
            const sentenceToSpeak = q.sentence || '';
            html = `
        <div class="question-text">👂 Nghe và chọn đúng</div>
        <button class="btn-fun btn-replay-audio" data-text="${escapeAttr(sentenceToSpeak)}" data-lang="${escapeAttr(lang)}" style="background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%); color: white;">
          🔊 Nghe lại
        </button>
        <div class="options-container" style="grid-template-columns: 1fr;">
          ${q.options.map(opt => `
            <button class="option-btn" data-opt="${escapeAttr(opt)}" data-answer="${escapeAttr(q.correctAnswer || '')}">
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
      `;
            setTimeout(() => playSpeech(q.sentence, lang), 500);
        }
    } else if (q.type === 'read') {
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
            console.error('Invalid options for question:', q);
            html = '<div class="question-text">Lỗi: Không có lựa chọn cho câu hỏi này</div>';
        } else if (q.subtype === 'sentence') {
            html = `
        <div class="question-text">👁️ Đọc và chọn đúng</div>
        <div class="question-text" style="color: #667eea; font-size: 1.4em;">${escapeHtml(q.sentence || '')}</div>
        <div class="options-container" style="grid-template-columns: 1fr;">
          ${q.options.map(opt => `
            <button class="option-btn" data-opt="${escapeAttr(opt)}" data-answer="${escapeAttr(q.correctAnswer || '')}">
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
      `;
        } else {
            html = `
        <div class="question-text">👁️ Đọc và chọn đúng</div>
        <div class="question-text" style="color: #667eea; font-size: 1.6em;">${escapeHtml(q.meaning || '')}</div>
        ${q.image ? `<img src="../${escapeHtml(q.image)}" class="question-image" onerror="this.style.display='none'">` : ''}
        <div class="options-container">
          ${q.options.map(opt => `
            <button class="option-btn" data-opt="${escapeAttr(opt)}" data-answer="${escapeAttr(q.correctAnswer || '')}">
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
      `;
        }
    } else if (q.type === 'write') {
        if (q.subtype === 'word') {
            html = `<div class="question-text">✍️ Điền chữ cái còn thiếu</div>` + renderMissingLetterQuestion(q);
        } else {
            html = `<div class="question-text">✍️ Sắp xếp từ thành câu</div>` + renderSentenceArrangeQuestion(q);
        }
    }

    // Validate HTML before setting
    if (!html || html.trim() === '') {
        console.error('Generated HTML is empty for question:', q);
        html = '<div class="question-text">Lỗi: Không thể tạo câu hỏi</div>';
    }

    try {
        area.innerHTML = html;
        attachQuestionEventListeners();
    } catch (error) {
        console.error('Error setting innerHTML:', error);
        console.error('Generated HTML:', html);
        console.error('Question data:', q);
        area.innerHTML = '<div class="question-text">Lỗi khi hiển thị câu hỏi. Vui lòng thử lại.</div>';
    }
}

function skipQuestion() {
    stopTimer();
    playSpeech('Đã bỏ qua câu hỏi này', 'vi-VN');

    setTimeout(() => {
        quizIndex++;
        showNextQuestion();
    }, 1000);
}

function attachQuestionEventListeners() {
    // Replay audio buttons
    document.querySelectorAll('.btn-replay-audio').forEach(btn => {
        btn.addEventListener('click', function () {
            const text = this.dataset.text;
            const lang = this.dataset.lang || 'en-US';
            playSpeech(text, lang);
        });
    });

    // Option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const opt = this.dataset.opt;
            const answer = this.dataset.answer;
            submitAnswer(opt, answer);
        });
    });

    // Letter choice buttons
    document.querySelectorAll('.letter-choice').forEach(btn => {
        btn.addEventListener('click', function () {
            const letter = this.dataset.letter;
            selectLetter(this, letter);
        });
    });

    // Sentence word spans
    document.querySelectorAll('.sentence-word').forEach(span => {
        span.addEventListener('click', function () {
            clickSentenceWord(this);
        });
    });

    // Reset sentence button
    const resetBtn = document.querySelector('.btn-reset-sentence');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSentence);
    }

    // Check sentence button
    const checkBtn = document.getElementById('btn-sentence-check');
    if (checkBtn) {
        checkBtn.addEventListener('click', checkSentenceArrangeAnswer);
    }
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function escapeAttr(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ==================== WRITE MODE RENDERERS ====================

function renderMissingLetterQuestion(q) {
    try {
        if (!q || !q.correctAnswer || !q.meaning) {
            console.error('Invalid question data:', q);
            return '<div>Lỗi: Dữ liệu câu hỏi không hợp lệ</div>';
        }

        const numMissing = 1;
        const positions = [];

        while (positions.length < numMissing && positions.length < q.correctAnswer.length) {
            const idx = Math.floor(Math.random() * q.correctAnswer.length);
            if (!positions.includes(idx)) positions.push(idx);
        }

        if (positions.length === 0) {
            console.error('No positions found for missing letter');
            return '<div>Lỗi: Không thể tạo câu hỏi</div>';
        }

        const isFirstLetter = positions[0] === 0;

        const correctLetters = positions.map(i => q.correctAnswer[i].toLowerCase());
        const wrongLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')
            .filter(c => !correctLetters.includes(c))
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(4, 8 - correctLetters.length));
        const allLetters = [...correctLetters, ...wrongLetters].sort(() => Math.random() - 0.5);

        const wordHtml = q.correctAnswer.split('').map((c, i) => {
            if (positions.includes(i)) {
                return `<span class="letter-blank" data-answer="${escapeAttr(c.toLowerCase())}" data-word="${escapeAttr(q.correctAnswer)}"></span>`;
            }
            return `<span class="letter-fixed">${escapeHtml(c)}</span>`;
        }).join('');

        return `<div class='mb-2'><b>${escapeHtml(q.meaning)}</b></div>
      <div class='mb-2'>Điền chữ cái còn thiếu:</div>
      <div class="word-display" style="font-size: 2em; margin: 20px 0; letter-spacing: 5px;">${wordHtml}</div>
      <div class="letter-choices" style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px;">
        ${allLetters.map(letter => `<button class="letter-choice" data-letter="${escapeAttr(letter)}">${isFirstLetter ? letter.toUpperCase() : letter}</button>`).join('')}
      </div>`;
    } catch (error) {
        console.error('Error in renderMissingLetterQuestion:', error);
        return '<div>Lỗi khi tạo câu hỏi</div>';
    }
}

function renderSentenceArrangeQuestion(q) {
    try {
        if (!q || !q.correctAnswer || !q.sentence) {
            console.error('Invalid question data:', q);
            return '<div>Lỗi: Dữ liệu câu hỏi không hợp lệ</div>';
        }

        const words = q.correctAnswer.replace(/[.?!]/g, '').split(' ').filter(w => w.trim()).sort(() => Math.random() - 0.5);
        if (words.length === 0) {
            console.error('No words found in correctAnswer:', q.correctAnswer);
            return '<div>Lỗi: Không thể tạo câu hỏi</div>';
        }

        const escapedAnswer = escapeAttr(q.correctAnswer);
        return `<div class='mb-2'><b>${escapeHtml(q.sentence)}</b></div>
      <div class='mb-2'>Sắp xếp các từ thành câu đúng:</div>
      <div class='sentence-target' id='sentence-target' data-answer="${escapedAnswer}" style="min-height: 60px; border: 3px dashed #11998e; border-radius: 10px; padding: 15px; background: rgba(255,255,255,0.9); margin-bottom: 15px;"></div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">${words.map((w, i) => `<span class='sentence-word'>${escapeHtml(w)}</span>`).join('')}</div>
      <button class='btn btn-sm btn-outline-secondary mt-3 btn-reset-sentence'>🔄 Xóa chọn</button>
      <button class='btn-fun btn-next mt-3' id='btn-sentence-check' disabled>✅ Kiểm tra</button>`;
    } catch (error) {
        console.error('Error in renderSentenceArrangeQuestion:', error);
        return '<div>Lỗi khi tạo câu hỏi</div>';
    }
}

function selectLetter(btn, letter) {
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
                playSpeech(word, 'en-US');
                setTimeout(() => handleAnswer(true), 800);
            }, 500);
        }
    } else {
        blank.classList.add('wrong-shake');
        playSpeech('Sai rồi, hãy sửa lại cho đúng nhé!', 'vi-VN');

        const q = quizQuestions[quizIndex];
        updateProgress_Item(q, false);
        quizWrong++;
        correctStreak = 0;
        updateScoreDisplay();

        setTimeout(() => {
            blank.classList.remove('wrong-shake');
            document.querySelectorAll('.letter-choice').forEach(choiceBtn => {
                if (choiceBtn !== btn) {
                    choiceBtn.disabled = false;
                    choiceBtn.style.opacity = '1';
                }
            });
        }, 1500);
    }
}

window.clickSentenceWord = function (el) {
    if (el.classList.contains('used')) return;
    if (!el) return;

    const wordText = el.innerText || el.textContent || '';
    playSpeech(wordText, 'en-US');
    el.classList.add('used');

    const target = document.getElementById('sentence-target');
    if (!target) return;
    const correct = target.dataset.answer;
    target.innerHTML += `<span class='sentence-word' style="margin: 3px; display: inline-block;">${escapeHtml(wordText)}</span> `;

    const chosen = [...target.querySelectorAll('.sentence-word')].map(e => e.innerText || e.textContent || '').join(' ').trim();
    const wordsInAns = correct.replace(/[.?!]/g, '').split(' ').length;
    const btnCheck = document.getElementById('btn-sentence-check');
    if (btnCheck) {
        btnCheck.disabled = (chosen.split(' ').length !== wordsInAns);
    }
}

window.resetSentence = function () {
    document.getElementById('sentence-target').innerHTML = '';
    document.querySelectorAll('.sentence-word.used').forEach(e => e.classList.remove('used'));
    const btnCheck = document.getElementById('btn-sentence-check');
    if (btnCheck) btnCheck.disabled = true;
}

window.checkSentenceArrangeAnswer = function () {
    const target = document.getElementById('sentence-target');
    const correct = target.dataset.answer;
    const chosen = [...target.querySelectorAll('.sentence-word')].map(e => e.innerText).join(' ').trim();
    const ok = chosen.toLowerCase() === correct.replace(/[.?!]/g, '').toLowerCase();

    const btnCheck = document.getElementById('btn-sentence-check');
    if (btnCheck) btnCheck.disabled = true;

    if (ok) {
        playSpeech(correct, 'en-US');
        setTimeout(() => handleAnswer(true), 1500);
    } else {
        playSpeech('Sai rồi, hãy sửa lại cho đúng nhé!', 'vi-VN');

        const q = quizQuestions[quizIndex];
        updateProgress_Item(q, false);
        quizWrong++;
        correctStreak = 0;
        updateScoreDisplay();

        setTimeout(() => {
            if (btnCheck) btnCheck.disabled = false;
        }, 2000);
    }
};

// ==================== ANSWER HANDLING ====================

function submitAnswer(selected, correct) {
    const buttons = document.querySelectorAll('.option-btn');
    const isWaitingForRetry = buttons.length > 0 && buttons[0].dataset.waitingForRetry === 'true';

    if (isWaitingForRetry) {
        if (selected === correct) {
            buttons.forEach(btn => {
                btn.classList.remove('wrong');
                btn.dataset.waitingForRetry = 'false';
                if (btn.textContent.trim() === correct || btn.querySelector('img')?.src.includes(correct)) {
                    btn.classList.add('correct');
                }
            });
            handleAnswer(true);
        } else {
            playWrongSound();
            playSpeech('Vẫn chưa đúng, hãy chọn đáp án đúng nhé!', 'vi-VN');
        }
        return;
    }

    stopTimer();
    buttons.forEach(btn => {
        btn.classList.add('disabled');
        btn.dataset.waitingForRetry = 'false';
    });

    const isCorrect = selected === correct;

    buttons.forEach(btn => {
        if (isCorrect) {
            if (btn.textContent.trim() === correct || btn.querySelector('img')?.src.includes(correct)) {
                btn.classList.add('correct');
            }
        } else {
            if (btn.textContent.trim() === selected || btn.querySelector('img')?.src.includes(selected)) {
                btn.classList.add('wrong');
            }
        }
    });

    handleAnswer(isCorrect);
}

function handleAnswer(isCorrect) {
    const q = quizQuestions[quizIndex];

    if (isCorrect) {
        quizCorrect++;
        correctStreak++;
        maxStreak = Math.max(maxStreak, correctStreak);

        playCorrectSound();
        createConfetti();
        playSpeech('Giỏi lắm!', 'vi-VN');

        if (correctStreak >= 3) {
            showStreakCombo(correctStreak);
        }

        const event = window.event || {};
        const x = event.clientX || window.innerWidth / 2;
        const y = event.clientY || window.innerHeight / 2;
        createStar(x, y);

        updateProgress_Item(q, true);

        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.dataset.waitingForRetry = 'false';
        });

        updateScoreDisplay();
        setTimeout(() => {
            quizIndex++;
            showNextQuestion();
        }, 2000);
    } else {
        quizWrong++;
        correctStreak = 0;

        playWrongSound();
        playSpeech('Sai rồi, hãy sửa lại cho đúng nhé!', 'vi-VN');

        updateProgress_Item(q, false);
        updateScoreDisplay();

        setTimeout(() => {
            const buttons = document.querySelectorAll('.option-btn');
            buttons.forEach(btn => {
                btn.classList.remove('disabled');
                btn.classList.remove('correct');
                btn.dataset.waitingForRetry = 'true';
            });
        }, 2000);
    }
}

// ==================== PROGRESS TRACKING ====================

function updateProgress_Item(q, isCorrect) {
    // Firebase sync
    if (typeof ProgressManager !== 'undefined' && ProgressManager.userId) {
        const question = {
            lessonId: currentLessonId || q.lessonId,
            word: q.word || null,
            sentence: q.sentence || q.correctAnswer || null,
            question: q.question || null,
            correctAnswer: q.correctAnswer || null
        };

        ProgressManager.update(question, isCorrect);
        console.log('☁️ Progress synced to Firebase');
        return;
    }

    // Local fallback
    const key = q.word || q.sentence;
    if (!key) return;

    let item = progressData.progress.find(p =>
        (p.word && p.word === key) || (p.sentence && p.sentence.en === key)
    );

    if (!item) {
        if (q.word) {
            item = {
                lessonId: currentLessonId,
                word: q.word,
                type: 'word',
                correct: 0,
                wrong: 0,
                lastReviewed: null
            };
        } else {
            item = {
                lessonId: currentLessonId,
                sentence: { en: key, vi: q.correctAnswer },
                type: 'sentence',
                correct: 0,
                wrong: 0,
                lastReviewed: null
            };
        }
        progressData.progress.push(item);
    }

    if (isCorrect) {
        item.correct = (item.correct || 0) + 1;
    } else {
        item.wrong = (item.wrong || 0) + 1;
    }

    item.lastReviewed = new Date().toISOString();
    console.log('📂 Progress saved locally');
}

function updateProgress() {
    const total = quizQuestions.length;
    const current = quizIndex + 1;
    const percent = Math.round((quizIndex / total) * 100);

    document.getElementById('progress-text').textContent = `Câu ${current}/${total}`;
    document.getElementById('progress-bar').style.width = percent + '%';
    document.getElementById('progress-bar').textContent = percent + '%';
}

function updateScoreDisplay() {
    document.getElementById('score-correct').textContent = quizCorrect;
    document.getElementById('score-wrong').textContent = quizWrong;
    document.getElementById('score-streak').textContent = correctStreak;
}

// ==================== TIMER ====================

function startTimer(question) {
    stopTimer();
    timeLeft = calculateQuestionTime(question);
    updateTimerDisplay();

    currentTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function calculateQuestionTime(question) {
    const timerCfg = CONFIG.timer;
    let time = timerCfg.base_time;

    if (question.subtype === 'sentence' || question.sentence) {
        time += timerCfg.sentence_bonus;
    }

    const word = question.word || question.sentence || '';
    const wordLength = word.length;

    if (wordLength <= timerCfg.short_word_length) {
        time -= timerCfg.short_word_penalty;
    } else if (wordLength >= timerCfg.long_word_length) {
        time += timerCfg.long_word_bonus;
    }

    const modeBonus = timerCfg.mode_bonus[question.type] || 0;
    time += modeBonus;

    time = Math.max(timerCfg.min_time, Math.min(timerCfg.max_time, time));

    return time;
}

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    display.textContent = `⏱️ ${timeLeft}s`;

    if (timeLeft <= 10) {
        display.classList.add('warning');
    } else {
        display.classList.remove('warning');
    }
}

function stopTimer() {
    if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
    }
}

function handleTimeout() {
    stopTimer();
    playSpeech('Hết giờ!', 'vi-VN');
    quizWrong++;
    correctStreak = 0;
    updateScoreDisplay();

    const q = quizQuestions[quizIndex];
    updateProgress_Item(q, false);

    setTimeout(() => {
        quizIndex++;
        showNextQuestion();
    }, 1500);
}

// ==================== SUMMARY ====================

function showSummary() {
    stopTimer();
    document.getElementById('progress-container').classList.add('hidden');
    document.getElementById('score-display').classList.add('hidden');
    document.getElementById('btn-skip').classList.add('hidden');

    const total = quizQuestions.length;
    const accuracy = total > 0 ? Math.round((quizCorrect / total) * 100) : 0;
    let stars = '⭐';
    if (accuracy >= 90) stars = '⭐⭐⭐';
    else if (accuracy >= 70) stars = '⭐⭐';

    createConfetti();
    playSpeech('Chúc mừng em đã hoàn thành luyện tập nâng cao! Giỏi lắm!', 'vi-VN');

    const area = document.getElementById('quiz-area');
    area.innerHTML = `
    <div class="summary-screen">
      <h2>🎉 Hoàn thành Luyện Tập!</h2>
      <div class="summary-stars">${stars}</div>
      <p style="color: #11998e; font-size: 1.1em; margin: 10px 0;">🎯 Luyện tập nâng cao: Bài 1 → Bài ${currentLessonId}</p>
      <div class="summary-stats">
        ✅ Đúng: ${quizCorrect}/${total} (${accuracy}%)<br>
        ❌ Sai: ${quizWrong}<br>
        🔥 Streak tốt nhất: ${maxStreak}
      </div>
      <div style="margin-top: 20px;">
        <button class="btn-fun btn-save" onclick="saveProgressFile()">💾 Lưu kết quả</button>
        <button class="btn-fun btn-retry" onclick="location.reload()">🔄 Làm lại</button>
        <button class="btn-fun btn-home" onclick="location.href='../index.html'">🏠 Trang chủ</button>
      </div>
    </div>
  `;

    saveProgressFile();
}

function saveProgressFile() {
    try {
        let dataToExport;
        if (typeof ProgressManager !== 'undefined' && ProgressManager.userId) {
            dataToExport = ProgressManager.data;
            console.log('💾 Exporting Firebase progress as backup');
        } else {
            dataToExport = progressData;
            console.log('💾 Exporting local progress');
        }

        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `progress_luyentap2_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        playSpeech('Đã lưu file backup!', 'vi-VN');
    } catch (e) {
        console.error('Lỗi lưu file:', e);
        alert('Có lỗi khi lưu file!');
    }
}

// ==================== INITIALIZATION ====================

async function initFirebase() {
    try {
        if (typeof ProgressManager !== 'undefined') {
            await ProgressManager.init();
            console.log('✅ Firebase initialized for luyentap2.html');
        } else {
            console.warn('⚠️ ProgressManager not loaded, using local progress');
        }
    } catch (error) {
        console.error('❌ Firebase init error:', error);
    }
}

window.addEventListener('load', async () => {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

    await initFirebase();
    loadData();
});
