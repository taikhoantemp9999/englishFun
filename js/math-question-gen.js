/**
 * MATH QUESTION GENERATOR - GRADE 2
 * Sinh câu hỏi tự động bám sát chương trình Toán lớp 2 của NXB Giáo dục.
 * Hỗ trợ Spaced Repetition bằng cách ưu tiên các câu hỏi học sinh làm sai.
 */

const MathQuestionGenerator = {
  // Sinh câu hỏi cho bài học cụ thể
  generate(lesson, progressData, limit = 10) {
    const questions = [];
    const usedKeys = new Set();
    const lessonProgress = (progressData && progressData.progress) ? 
      progressData.progress.filter(p => p.lessonId === lesson.id && p.type === 'math') : [];
    
    // 1. Spaced Repetition: Lấy các câu hỏi bé làm sai (wrong > correct) hoặc cần ôn luyện
    if (lessonProgress.length > 0) {
      // Sắp xếp các câu hỏi làm sai nhiều lên trước
      const strugglingItems = [...lessonProgress]
        .filter(p => (p.wrong || 0) > (p.correct || 0) || (p.wrong || 0) > 0)
        .sort((a, b) => (b.wrong || 0) - (a.wrong || 0));
        
      for (const item of strugglingItems) {
        if (questions.length >= limit) break;
        const q = this.recreateQuestion(item.mathExpression, lesson.type, item.subtype);
        if (q) {
          q.lessonId = lesson.id;
          const key = this.getQuestionKey(q);
          if (!usedKeys.has(key)) {
            usedKeys.add(key);
            questions.push(q);
          }
        }
      }
    }
    
    // 2. Sinh các câu hỏi ngẫu nhiên mới cho đủ quota (limit)
    let attempts = 0;
    const maxAttempts = limit * 100;
    while (questions.length < limit && attempts < maxAttempts) {
      attempts++;
      const q = this.generateNewQuestion(lesson);
      if (q) {
        q.lessonId = lesson.id;
        const key = this.getQuestionKey(q);
        if (!usedKeys.has(key)) {
          usedKeys.add(key);
          questions.push(q);
        }
      }
    }
    
    // Trộn ngẫu nhiên câu hỏi
    return questions.sort(() => Math.random() - 0.5);
  },

  // Khóa định danh để tránh trùng lặp
  getQuestionKey(q) {
    return `${q.subtype}_${q.expression}`;
  },

  // Tái tạo lại câu hỏi từ biểu thức toán học đã lưu
  recreateQuestion(expression, lessonType, subtype) {
    try {
      if (subtype === 'addition' || subtype === 'subtraction') {
        const parts = expression.split(' ');
        const a = parseInt(parts[0]);
        const op = parts[1];
        const b = parseInt(parts[2]);
        const ans = op === '+' ? a + b : a - b;
        const options = this.generateNumberOptions(ans, 0, 1000);
        return {
          type: 'math',
          subtype: subtype,
          expression: expression,
          a: a,
          b: b,
          op: op,
          answer: ans,
          options: options
        };
      }
      if (subtype === 'multiplication' || subtype === 'division') {
        const parts = expression.split(' ');
        const a = parseInt(parts[0]);
        const op = parts[1];
        const b = parseInt(parts[2]);
        const ans = op === 'x' ? a * b : a / b;
        const options = this.generateNumberOptions(ans, 0, 100);
        return {
          type: 'math',
          subtype: subtype,
          expression: expression,
          a: a,
          b: b,
          op: op,
          answer: ans,
          options: options
        };
      }
      if (subtype === 'comparison') {
        const parts = expression.split(' ');
        const a = parts[0];
        const op = parts[1]; // >, <, =
        const b = parts[2];
        return {
          type: 'math',
          subtype: 'comparison',
          expression: expression,
          a: a,
          b: b,
          answer: op,
          options: ['>', '<', '=']
        };
      }
    } catch (e) {
      console.error('Lỗi tái tạo câu hỏi:', e);
    }
    return null;
  },

  // Sinh câu hỏi mới tinh dựa vào loại bài học
  generateNewQuestion(lesson) {
    const type = lesson.type;
    const range = lesson.range || { min: 0, max: 100 };
    
    switch (type) {
      case 'arr_count_100':
        return this.generateCount100();
      case 'tia_so':
        return this.generateNumberLine();
      case 'addition_subtraction_components':
        return this.generateComponents();
      case 'more_less_comparison':
        return this.generateMoreLessWordProblem();
      case 'addition_subtraction_no_carry_100':
        return this.generateNoCarry100();
      
      // Cộng trừ qua 10 trong phạm vi 20
      case 'addition_carry_20':
        return this.generateAdditionCarry({ min: 1, max: 20 });
      case 'subtraction_borrow_20':
        return this.generateSubtractionBorrow({ min: 1, max: 20 });
      case 'word_problem_add_sub':
        return this.generateWordProblemAddSub(20);
      case 'word_problem_more_less':
        return this.generateWordProblemMoreLess(20);

      // Lượng & dung tích
      case 'kilogam':
        return this.generateMeasurementQuantity('kg', 50);
      case 'lit':
        return this.generateMeasurementQuantity('l', 50);
      case 'measurement_kg_lit_practice':
        return this.generateMeasurementPractice();

      // Cộng trừ có nhớ phạm vi 100
      case 'addition_carry_100_1':
        return this.generateAdditionCarry100(1); // 2 chữ số cộng 1 chữ số
      case 'addition_carry_100_2':
        return this.generateAdditionCarry100(2); // 2 chữ số cộng 2 chữ số
      case 'subtraction_borrow_100_1':
        return this.generateSubtractionBorrow100(1); // 2 chữ số trừ 1 chữ số
      case 'subtraction_borrow_100_2':
        return this.generateSubtractionBorrow100(2); // 2 chữ số trừ 2 chữ số

      // Hình phẳng
      case 'geometry_line_points':
        return this.generateGeometryLines();
      case 'geometry_broken_line_quad':
        return this.generateGeometryShapes();

      // Thời gian
      case 'time_hours_minutes':
        return this.generateTimeClock();
      case 'date_calendar':
        return this.generateDateCalendar();

      // Phép nhân phép chia
      case 'multiplication_intro':
        return this.generateMultiplicationIntro();
      case 'multiplication_components':
        return this.generateMultiplicationComponents();
      case 'multiplication_table_2':
        return this.generateTableMath('x', 2);
      case 'multiplication_table_5':
        return this.generateTableMath('x', 5);
      case 'division_intro':
        return this.generateDivisionIntro();
      case 'division_components':
        return this.generateDivisionComponents();
      case 'division_table_2':
        return this.generateTableMath('/', 2);
      case 'division_table_5':
        return this.generateTableMath('/', 5);

      // Khối hình
      case 'geometry_cylinder_sphere':
        return this.generateGeometry3D();

      // Phạm vi 1000
      case 'place_value_1000':
        return this.generatePlaceValue1000();
      case 'round_hundreds_tens':
        return this.generateRoundNumbers();
      case 'comparison_round_numbers':
        return this.generateComparisonRound();
      case 'numbers_3_digits':
        return this.generateNumbers3Digits();
      case 'number_sum_expanded':
        return this.generateNumberSumExpanded();
      case 'comparison_3_digits':
        return this.generateComparison3Digits();

      // Đo lường độ dài & Tiền tệ
      case 'length_dm_m_km':
        return this.generateLengthConvert();
      case 'vietnamese_money':
        return this.generateVietnameseMoney();

      // Cộng trừ phạm vi 1000
      case 'addition_no_carry_1000':
        return this.generateAddSub1000('+', false);
      case 'addition_carry_1000':
        return this.generateAddSub1000('+', true);
      case 'subtraction_no_borrow_1000':
        return this.generateAddSub1000('-', false);
      case 'subtraction_borrow_1000':
        return this.generateAddSub1000('-', true);

      // Thống kê, xác suất
      case 'statistics_collection':
        return this.generateStatsCollection();
      case 'statistics_pictogram':
        return this.generateStatsPictogram();
      case 'probability_certainty':
        return this.generateProbabilityCertainty();

      // Ôn tập tổng hợp
      case 'mixed_review_1':
      case 'mixed_review_2':
      case 'mixed_review_3':
      case 'mixed_review_4_add':
      case 'mixed_review_4_sub':
      case 'mixed_review_5':
      case 'mixed_review_6':
      case 'mixed_review_8':
      case 'mixed_review_9':
      case 'mixed_review_10':
      case 'mixed_review_11':
      case 'mixed_review_12':
      case 'review_term1_general':
      case 'review_year_general':
      default:
        return this.generateMixedReview(type);
    }
  },

  // ===== SINH CÁC LOẠI CÂU HỎI CHI TIẾT =====

  generateCount100() {
    const a = Math.floor(Math.random() * 98) + 1; // 1-98
    const type = Math.random() < 0.5 ? 'before' : 'after';
    const ans = type === 'before' ? a - 1 : a + 1;
    const text = type === 'before' ? `Số liền trước của số ${a} là số nào?` : `Số liền sau của số ${a} là số nào?`;
    
    return {
      type: 'math',
      subtype: 'counting',
      expression: `${type} of ${a} is ${ans}`,
      questionText: text,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateNumberLine() {
    const start = Math.floor(Math.random() * 80) + 1;
    const step = 1;
    const missingIndex = Math.floor(Math.random() * 4) + 1; // Khuyết vị trí 1-4
    const sequence = [start, start + 1, start + 2, start + 3, start + 4];
    const ans = sequence[missingIndex];
    
    const seqText = sequence.map((n, i) => i === missingIndex ? '?' : n).join(', ');
    const text = `Điền số thích hợp vào dấu hỏi chấm: ${seqText}`;
    
    return {
      type: 'math',
      subtype: 'number_line',
      expression: `number line missing ${ans} in [${sequence.join(',')}]`,
      questionText: text,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateComponents() {
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 40) + 5;
    const isAdd = Math.random() < 0.5;
    
    if (isAdd) {
      const sum = a + b;
      const termType = Math.random() < 0.5 ? 'a' : 'sum';
      const questionText = termType === 'a' ? 
        `Trong phép tính: ${a} + ${b} = ${sum}. Số ${a} được gọi là:` :
        `Trong phép tính: ${a} + ${b} = ${sum}. Số ${sum} được gọi là:`;
      const ans = termType === 'a' ? 'Số hạng' : 'Tổng';
      return {
        type: 'math',
        subtype: 'terminology',
        expression: `term of ${a}+${b}=${sum} choice ${termType}`,
        questionText: questionText,
        answer: ans,
        options: this.shuffle(['Số hạng', 'Tổng', 'Hiệu', 'Số bị trừ'])
      };
    } else {
      const diff = a - b;
      const termType = Math.random() < 0.33 ? 'a' : (Math.random() < 0.5 ? 'b' : 'diff');
      const questionText = termType === 'a' ? 
        `Trong phép tính: ${a} - ${b} = ${diff}. Số ${a} được gọi là:` :
        (termType === 'b' ? `Trong phép tính: ${a} - ${b} = ${diff}. Số ${b} được gọi là:` : `Trong phép tính: ${a} - ${b} = ${diff}. Số ${diff} được gọi là:`);
      const ans = termType === 'a' ? 'Số bị trừ' : (termType === 'b' ? 'Số trừ' : 'Hiệu');
      return {
        type: 'math',
        subtype: 'terminology',
        expression: `term of ${a}-${b}=${diff} choice ${termType}`,
        questionText: questionText,
        answer: ans,
        options: this.shuffle(['Số bị trừ', 'Số trừ', 'Hiệu', 'Tổng'])
      };
    }
  },

  generateMoreLessWordProblem() {
    const names = ['Lan', 'Mai', 'Minh', 'Nam', 'An', 'Bình'];
    const n1 = names[Math.floor(Math.random() * names.length)];
    let n2 = names[Math.floor(Math.random() * names.length)];
    while (n1 === n2) { n2 = names[Math.floor(Math.random() * names.length)]; }
    
    const a = Math.floor(Math.random() * 20) + 15;
    const diff = Math.floor(Math.random() * 8) + 2;
    const isMore = Math.random() < 0.5;
    
    const b = isMore ? a - diff : a + diff;
    const text = isMore ? 
      `${n1} có ${a} nhãn vở, ${n2} có ít hơn ${n1} ${diff} nhãn vở. Hỏi ${n2} có bao nhiêu nhãn vở?` :
      `${n1} có ${a} nhãn vở, ${n2} có nhiều hơn ${n1} ${diff} nhãn vở. Hỏi ${n2} có bao nhiêu nhãn vở?`;
      
    return {
      type: 'math',
      subtype: 'word_problem',
      expression: `more_less_word_problem_${n1}_${a}_${n2}_${diff}_isMore_${isMore}`,
      questionText: text,
      answer: b,
      options: this.generateNumberOptions(b, 0, 100)
    };
  },

  generateNoCarry100() {
    const a = Math.floor(Math.random() * 80) + 10;
    const isAdd = Math.random() < 0.5;
    let b, ans;
    
    if (isAdd) {
      // a + b không nhớ
      const a_ones = a % 10;
      const maxB_ones = 9 - a_ones;
      const b_ones = Math.floor(Math.random() * (maxB_ones + 1));
      
      const a_tens = Math.floor(a / 10);
      const maxB_tens = 9 - a_tens;
      const b_tens = Math.floor(Math.random() * (maxB_tens + 1));
      
      b = b_tens * 10 + b_ones;
      if (b === 0) b = 5;
      ans = a + b;
    } else {
      // a - b không nhớ
      const a_ones = a % 10;
      const b_ones = Math.floor(Math.random() * (a_ones + 1));
      
      const a_tens = Math.floor(a / 10);
      const b_tens = Math.floor(Math.random() * (a_tens + 1));
      
      b = b_tens * 10 + b_ones;
      if (b > a) b = a - 2;
      if (b < 0) b = 0;
      ans = a - b;
    }
    
    return {
      type: 'math',
      subtype: isAdd ? 'addition' : 'subtraction',
      expression: `${a} ${isAdd ? '+' : '-'} ${b}`,
      a: a,
      b: b,
      op: isAdd ? '+' : '-',
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateAdditionCarry(range) {
    let a, b, ans;
    let attempts = 0;
    do {
      a = Math.floor(Math.random() * (range.max - range.min)) + range.min;
      b = Math.floor(Math.random() * (range.max - range.min)) + range.min;
      ans = a + b;
      attempts++;
    } while ((ans > range.max || (a % 10 + b % 10 < 10)) && attempts < 100); // Lấy phép tính cộng có nhớ (hàng đơn vị cộng lại >= 10)
    
    if (ans > range.max) ans = a + b; // Fallback
    
    return {
      type: 'math',
      subtype: 'addition',
      expression: `${a} + ${b}`,
      a: a,
      b: b,
      op: '+',
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateSubtractionBorrow(range) {
    let a, b, ans;
    let attempts = 0;
    do {
      a = Math.floor(Math.random() * (range.max - 8)) + 8; // Đảm bảo a lớn hơn 8
      b = Math.floor(Math.random() * a) + 1;
      ans = a - b;
      attempts++;
    } while ((a % 10 >= b % 10) && attempts < 100); // Lấy phép trừ có nhớ (hàng đơn vị của a bé hơn b)
    
    return {
      type: 'math',
      subtype: 'subtraction',
      expression: `${a} - ${b}`,
      a: a,
      b: b,
      op: '-',
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateAdditionCarry100(mode) {
    // mode 1: 2 chữ số + 1 chữ số
    // mode 2: 2 chữ số + 2 chữ số
    let a = Math.floor(Math.random() * 80) + 10; // 10-89
    let b, ans;
    
    if (mode === 1) {
      let a_ones = a % 10;
      b = Math.floor(Math.random() * (9 - (10 - a_ones) + 1)) + (10 - a_ones); // b sao cho a_ones + b >= 10
      if (b > 9) b = 9;
      if (b < 1) b = 5;
    } else {
      let a_ones = a % 10;
      let b_ones = Math.floor(Math.random() * (9 - (10 - a_ones) + 1)) + (10 - a_ones);
      if (b_ones > 9) b_ones = 9;
      let b_tens = Math.floor(Math.random() * (9 - Math.floor(a / 10) - 1)) + 1;
      b = b_tens * 10 + b_ones;
    }
    
    ans = a + b;
    return {
      type: 'math',
      subtype: 'addition',
      expression: `${a} + ${b}`,
      a: a,
      b: b,
      op: '+',
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateSubtractionBorrow100(mode) {
    // mode 1: 2 chữ số - 1 chữ số (có nhớ)
    // mode 2: 2 chữ số - 2 chữ số (có nhớ)
    let a = Math.floor(Math.random() * 80) + 19; // 19-98
    let b, ans;
    
    let a_ones = a % 10;
    if (mode === 1) {
      b = Math.floor(Math.random() * (9 - a_ones)) + a_ones + 1; // b > a_ones
      if (b > 9) b = 9;
    } else {
      let b_ones = Math.floor(Math.random() * (9 - a_ones)) + a_ones + 1;
      if (b_ones > 9) b_ones = 9;
      let a_tens = Math.floor(a / 10);
      let b_tens = Math.floor(Math.random() * (a_tens - 1)) + 1;
      b = b_tens * 10 + b_ones;
    }
    
    ans = a - b;
    return {
      type: 'math',
      subtype: 'subtraction',
      expression: `${a} - ${b}`,
      a: a,
      b: b,
      op: '-',
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateWordProblemAddSub(maxRange) {
    const products = ['quả bóng', 'cái kẹo', 'bông hoa', 'quyển vở', 'bút chì'];
    const p = products[Math.floor(Math.random() * products.length)];
    const a = Math.floor(Math.random() * (maxRange - 5)) + 5;
    const b = Math.floor(Math.random() * 5) + 3;
    const isAdd = Math.random() < 0.5;
    
    const text = isAdd ? 
      `Hùng có ${a} ${p}, Hùng mua thêm ${b} ${p} nữa. Hỏi Hùng có tất cả bao nhiêu ${p}?` :
      `Hùng có ${a} ${p}, Hùng cho bạn Minh ${b} ${p}. Hỏi Hùng còn lại bao nhiêu ${p}?`;
      
    const ans = isAdd ? a + b : a - b;
    return {
      type: 'math',
      subtype: 'word_problem',
      expression: `word_problem_add_sub_${p}_${a}_${b}_isAdd_${isAdd}`,
      questionText: text,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateWordProblemMoreLess(maxRange) {
    const products = ['bông hoa', 'viên bi', 'nhãn vở', 'quả cam'];
    const p = products[Math.floor(Math.random() * products.length)];
    const a = Math.floor(Math.random() * (maxRange - 6)) + 5;
    const b = Math.floor(Math.random() * 5) + 2;
    const isMore = Math.random() < 0.5;
    
    const text = isMore ? 
      `An có ${a} ${p}. Bình có nhiều hơn An ${b} ${p}. Hỏi Bình có bao nhiêu ${p}?` :
      `An có ${a} ${p}. Bình có ít hơn An ${b} ${p}. Hỏi Bình có bao nhiêu ${p}?`;
      
    const ans = isMore ? a + b : a - b;
    return {
      type: 'math',
      subtype: 'word_problem',
      expression: `word_problem_more_less_${p}_${a}_${b}_isMore_${isMore}`,
      questionText: text,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateMeasurementQuantity(unit, maxVal) {
    const a = Math.floor(Math.random() * (maxVal - 10)) + 5;
    const b = Math.floor(Math.random() * 8) + 2;
    const isAdd = Math.random() < 0.5;
    
    const ans = isAdd ? a + b : a - b;
    const text = `Tính kết quả phép tính: ${a} ${unit} ${isAdd ? '+' : '-'} ${b} ${unit} = ?`;
    
    return {
      type: 'math',
      subtype: isAdd ? 'addition' : 'subtraction',
      expression: `${a}${unit} ${isAdd ? '+' : '-'} ${b}${unit}`,
      questionText: text,
      answer: `${ans} ${unit}`,
      options: this.shuffle([`${ans} ${unit}`, `${ans + 2} ${unit}`, `${ans - 2} ${unit}`, `${ans + 5} ${unit}`].filter(x => parseInt(x) >= 0))
    };
  },

  generateMeasurementPractice() {
    const isKg = Math.random() < 0.5;
    const unit = isKg ? 'kg' : 'l';
    const names = isKg ? 'bao gạo' : 'xô nước';
    
    const a = Math.floor(Math.random() * 20) + 15;
    const b = Math.floor(Math.random() * 10) + 3;
    
    const text = `Có hai ${names}, ${names} thứ nhất nặng/chứa ${a} ${unit}, ${names} thứ hai nặng/chứa ít hơn ${names} thứ nhất ${b} ${unit}. Hỏi ${names} thứ hai nặng/chứa bao nhiêu ${unit}?`;
    const ans = a - b;
    
    return {
      type: 'math',
      subtype: 'word_problem',
      expression: `measurement_practice_${unit}_${a}_${b}`,
      questionText: text,
      answer: `${ans} ${unit}`,
      options: this.shuffle([`${ans} ${unit}`, `${ans + b} ${unit}`, `${ans - 2} ${unit}`, `${ans + 3} ${unit}`])
    };
  },

  generateGeometryLines() {
    const type = Math.random() < 0.5 ? 'points' : 'segments';
    
    if (type === 'points') {
      const text = "Có bao nhiêu điểm thẳng hàng trong sơ đồ hình vẽ A - B - C?";
      return {
        type: 'math',
        subtype: 'geometry',
        expression: `geometry_collinear_points`,
        questionText: text,
        answer: 3,
        options: [2, 3, 4, 5],
        visualType: 'collinear_points'
      };
    } else {
      const text = "Đoạn thẳng nối điểm A và điểm B gọi là gì?";
      return {
        type: 'math',
        subtype: 'geometry',
        expression: `geometry_definition_segment`,
        questionText: text,
        answer: "Đoạn thẳng AB",
        options: this.shuffle(["Đoạn thẳng AB", "Đường thẳng AB", "Đường cong AB", "Tia AB"])
      };
    }
  },

  generateGeometryShapes() {
    const type = Math.random() < 0.5 ? 'broken_line' : 'quadrilateral';
    
    if (type === 'broken_line') {
      const a = Math.floor(Math.random() * 5) + 3;
      const b = Math.floor(Math.random() * 5) + 3;
      const c = Math.floor(Math.random() * 5) + 3;
      const ans = a + b + c;
      const text = `Một đường gấp khúc gồm 3 đoạn thẳng có độ dài lần lượt là ${a} cm, ${b} cm và ${c} cm. Tính độ dài đường gấp khúc đó?`;
      return {
        type: 'math',
        subtype: 'geometry',
        expression: `geometry_broken_line_${a}_${b}_${c}`,
        questionText: text,
        answer: `${ans} cm`,
        options: this.shuffle([`${ans} cm`, `${ans + 2} cm`, `${ans - 2} cm`, `${ans + 4} cm`])
      };
    } else {
      const text = "Hình nào dưới đây là hình tứ giác?";
      return {
        type: 'math',
        subtype: 'geometry',
        expression: `geometry_identify_quadrilateral`,
        questionText: text,
        answer: "Hình có 4 cạnh",
        options: this.shuffle(["Hình có 4 cạnh", "Hình có 3 cạnh", "Hình tròn", "Hình có 5 cạnh"])
      };
    }
  },

  generateTimeClock() {
    const hours = Math.floor(Math.random() * 12) + 1;
    const isHalf = Math.random() < 0.5;
    const minutes = isHalf ? 30 : 0;
    
    const ans = isHalf ? `${hours} giờ 30 phút` : `${hours} giờ`;
    const text = isHalf ? `Đồng hồ chỉ kim ngắn giữa số ${hours} và ${hours === 12 ? 1 : hours + 1}, kim dài chỉ số 6. Hỏi là mấy giờ?` : `Đồng hồ chỉ kim ngắn chỉ số ${hours}, kim dài chỉ số 12. Hỏi là mấy giờ?`;
    
    return {
      type: 'math',
      subtype: 'time',
      expression: `time_clock_${hours}_${minutes}`,
      questionText: text,
      answer: ans,
      options: this.shuffle([ans, `${hours === 1 ? 12 : hours - 1} giờ`, `${hours} giờ 15 phút`, `${hours === 12 ? 1 : hours + 1} giờ`].filter((v, i, self) => self.indexOf(v) === i).slice(0, 4)),
      clockData: { h: hours, m: minutes }
    };
  },

  generateDateCalendar() {
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const dIdx = Math.floor(Math.random() * 5); // Hai -> Sáu
    const startDay = days[dIdx];
    const startDate = Math.floor(Math.random() * 15) + 1; // 1-15
    
    const targetDay = days[dIdx + 2]; // Sau đó 2 ngày
    const targetDate = startDate + 2;
    
    const text = `Nếu ${startDay} là ngày ${startDate} của tháng. Hỏi ${targetDay} tuần đó là ngày bao nhiêu?`;
    
    return {
      type: 'math',
      subtype: 'calendar',
      expression: `date_calendar_${startDay}_${startDate}_to_${targetDay}`,
      questionText: text,
      answer: targetDate,
      options: this.shuffle([targetDate, startDate + 1, startDate + 3, startDate + 7])
    };
  },

  generateMultiplicationIntro() {
    const a = Math.floor(Math.random() * 3) + 2; // 2-4
    const count = Math.floor(Math.random() * 4) + 3; // 3-6
    const sumSeq = Array(count).fill(a).join(' + ');
    const text = `Viết tổng sau dưới dạng tích của hai số: ${sumSeq} = ?`;
    const ans = `${a} x ${count}`;
    
    return {
      type: 'math',
      subtype: 'multiplication',
      expression: `mul_intro_${a}_x_${count}`,
      questionText: text,
      answer: ans,
      options: this.shuffle([ans, `${count} x ${a}`, `${a} x ${count + 1}`, `${a + 1} x ${count}`])
    };
  },

  generateMultiplicationComponents() {
    const a = Math.random() < 0.5 ? 2 : 5;
    const b = Math.floor(Math.random() * 9) + 1;
    const prod = a * b;
    
    const questionText = `Trong phép nhân: ${a} x ${b} = ${prod}. Số ${prod} được gọi là gì?`;
    
    return {
      type: 'math',
      subtype: 'terminology',
      expression: `mul_components_${a}_x_${b}_=${prod}`,
      questionText: questionText,
      answer: 'Tích',
      options: this.shuffle(['Tích', 'Thừa số', 'Tổng', 'Thương'])
    };
  },

  generateTableMath(op, num) {
    const b = Math.floor(Math.random() * 10) + 1; // 1-10
    let a, ans;
    
    if (op === 'x') {
      a = num;
      ans = a * b;
    } else {
      ans = b;
      a = num * b; // num là divisor (2 hoặc 5)
    }
    
    return {
      type: 'math',
      subtype: op === 'x' ? 'multiplication' : 'division',
      expression: `${a} ${op} ${op === 'x' ? b : num}`,
      a: a,
      b: op === 'x' ? b : num,
      op: op,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 100)
    };
  },

  generateDivisionIntro() {
    const a = Math.random() < 0.5 ? 2 : 5;
    const b = Math.floor(Math.random() * 8) + 2;
    const prod = a * b;
    
    const text = `Từ phép nhân ${a} x ${b} = ${prod}, ta có thể viết được phép chia nào tương ứng?`;
    const ans = `${prod} : ${a} = ${b}`;
    
    return {
      type: 'math',
      subtype: 'division',
      expression: `div_intro_${a}_x_${b}_=${prod}`,
      questionText: text,
      answer: ans,
      options: this.shuffle([ans, `${prod} : ${b} = ${a}`, `${b} : ${a} = ${prod}`, `${prod} x ${a} = ${b}`].slice(0, 4))
    };
  },

  generateDivisionComponents() {
    const a = Math.random() < 0.5 ? 10 : 20;
    const b = 2;
    const quotient = a / b;
    
    const questionText = `Trong phép chia: ${a} : ${b} = ${quotient}. Số ${a} được gọi là gì?`;
    
    return {
      type: 'math',
      subtype: 'terminology',
      expression: `div_components_${a}_div_${b}_=${quotient}`,
      questionText: questionText,
      answer: 'Số bị chia',
      options: this.shuffle(['Số bị chia', 'Số chia', 'Thương', 'Số dư'])
    };
  },

  generateGeometry3D() {
    const isCylinder = Math.random() < 0.5;
    const text = isCylinder ? "Khối hình nào có hai mặt đáy là hình tròn phẳng và mặt xung quanh cong?" : "Khối hình nào tròn xoe và có thể lăn được về mọi phía?";
    const ans = isCylinder ? "Khối trụ" : "Khối cầu";
    
    return {
      type: 'math',
      subtype: 'geometry_3d',
      expression: `geom_3d_cyl_sph_${isCylinder}`,
      questionText: text,
      answer: ans,
      options: this.shuffle([ans, isCylinder ? "Khối cầu" : "Khối trụ", "Khối lập phương", "Khối hộp chữ nhật"])
    };
  },

  generatePlaceValue1000() {
    const a = Math.floor(Math.random() * 8) + 1; // 1-8
    const num = a * 100;
    
    const text = `Số gồm ${a} trăm được viết là:`;
    
    return {
      type: 'math',
      subtype: 'place_value',
      expression: `place_value_1000_${a}_hundreds`,
      questionText: text,
      answer: num,
      options: this.shuffle([num, a * 10, a * 1000, num + 10])
    };
  },

  generateRoundNumbers() {
    const num = (Math.floor(Math.random() * 8) + 1) * 100; // Tròn trăm 100-800
    const text = `Số nào dưới đây là số tròn trăm?`;
    
    return {
      type: 'math',
      subtype: 'place_value',
      expression: `round_number_identify_${num}`,
      questionText: text,
      answer: num,
      options: this.shuffle([num, num + 5, num + 25, num - 1])
    };
  },

  generateComparisonRound() {
    const a = (Math.floor(Math.random() * 8) + 1) * 100;
    let b = (Math.floor(Math.random() * 8) + 1) * 100;
    while (a === b) { b = (Math.floor(Math.random() * 8) + 1) * 100; }
    
    const op = a > b ? '>' : '<';
    const text = `So sánh các số tròn trăm: ${a} ... ${b}`;
    
    return {
      type: 'math',
      subtype: 'comparison',
      expression: `${a} ${op} ${b}`,
      questionText: text,
      a: a,
      b: b,
      answer: op,
      options: ['>', '<', '=']
    };
  },

  generateNumbers3Digits() {
    const a = Math.floor(Math.random() * 800) + 100; // 100-899
    
    const text = `Số "${a}" được đọc là:`;
    const ans = this.readVietnameseNumber(a);
    
    return {
      type: 'math',
      subtype: 'place_value',
      expression: `read_3_digit_${a}`,
      questionText: text,
      answer: ans,
      options: this.shuffle([ans, ans + " mốt", ans + " nghìn", "Một trăm"])
    };
  },

  generateNumberSumExpanded() {
    const a = Math.floor(Math.random() * 8) + 1; // 1-8
    const b = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    
    const num = a * 100 + b * 10 + c;
    const ans = `${a * 100} + ${b * 10} + ${c}`;
    const text = `Viết số ${num} thành tổng các trăm, chục, đơn vị:`;
    
    return {
      type: 'math',
      subtype: 'place_value',
      expression: `expanded_sum_${num}`,
      questionText: text,
      answer: ans,
      options: this.shuffle([ans, `${a * 100} + ${b} + ${c}`, `${a * 10} + ${b * 10} + ${c}`, `${a * 100} + ${b * 10} + ${c * 10}`])
    };
  },

  generateComparison3Digits() {
    const a = Math.floor(Math.random() * 800) + 100;
    let b = Math.floor(Math.random() * 800) + 100;
    while (a === b) { b = Math.floor(Math.random() * 800) + 100; }
    
    const op = a > b ? '>' : '<';
    const text = `Điền dấu thích hợp vào chỗ trống: ${a} ... ${b}`;
    
    return {
      type: 'math',
      subtype: 'comparison',
      expression: `${a} ${op} ${b}`,
      questionText: text,
      a: a,
      b: b,
      answer: op,
      options: ['>', '<', '=']
    };
  },

  generateLengthConvert() {
    const units = ['dm', 'm', 'cm', 'mm'];
    const type = Math.random() < 0.5 ? 'dm_cm' : 'm_dm';
    
    if (type === 'dm_cm') {
      const dm = Math.floor(Math.random() * 8) + 2; // 2-9
      const ans = dm * 10;
      const text = `Đổi đơn vị sau: ${dm} dm = ... cm`;
      return {
        type: 'math',
        subtype: 'measurement',
        expression: `${dm} dm = ${ans} cm`,
        questionText: text,
        answer: ans,
        options: this.shuffle([ans, dm, dm * 100, dm + 10])
      };
    } else {
      const m = Math.floor(Math.random() * 8) + 2;
      const ans = m * 10;
      const text = `Đổi đơn vị sau: ${m} m = ... dm`;
      return {
        type: 'math',
        subtype: 'measurement',
        expression: `${m} m = ${ans} dm`,
        questionText: text,
        answer: ans,
        options: this.shuffle([ans, m, m * 100, m + 10])
      };
    }
  },

  generateVietnameseMoney() {
    const banknotes = [100, 200, 500, 1000];
    const a = banknotes[Math.floor(Math.random() * banknotes.length)];
    let b = banknotes[Math.floor(Math.random() * banknotes.length)];
    const sum = a + b;
    
    const text = `Một tờ tiền mệnh giá ${a} đồng cộng với một tờ tiền mệnh giá ${b} đồng bằng bao nhiêu đồng?`;
    
    return {
      type: 'math',
      subtype: 'money',
      expression: `${a} dong + ${b} dong = ${sum} dong`,
      questionText: text,
      answer: `${sum} đồng`,
      options: this.shuffle([`${sum} đồng`, `${sum + 100} đồng`, `${sum - 50} đồng`, `${a} đồng`])
    };
  },

  generateAddSub1000(op, hasCarry) {
    let a, b, ans;
    let attempts = 0;
    
    do {
      a = Math.floor(Math.random() * 700) + 100; // 100-799
      b = Math.floor(Math.random() * 700) + 100; // 100-799
      
      if (op === '+') {
        ans = a + b;
        const carryOccurred = (a % 10 + b % 10 >= 10) || (Math.floor((a % 100)/10) + Math.floor((b % 100)/10) >= 10);
        if (ans < 1000 && ((hasCarry && carryOccurred) || (!hasCarry && !carryOccurred))) {
          break;
        }
      } else {
        if (a < b) { [a, b] = [b, a]; }
        ans = a - b;
        const borrowOccurred = (a % 10 < b % 10) || (Math.floor((a % 100)/10) < Math.floor((b % 100)/10));
        if (ans >= 100 && ((hasCarry && borrowOccurred) || (!hasCarry && !borrowOccurred))) {
          break;
        }
      }
      attempts++;
    } while (attempts < 200);
    
    if (op === '+' && a + b >= 1000) { a = 400; b = 300; ans = 700; } // Fallback
    if (op === '-' && a < b) { a = 800; b = 300; ans = 500; } // Fallback
    
    return {
      type: 'math',
      subtype: op === '+' ? 'addition' : 'subtraction',
      expression: `${a} ${op} ${b}`,
      a: a,
      b: b,
      op: op,
      answer: ans,
      options: this.generateNumberOptions(ans, 100, 1000)
    };
  },

  generateStatsCollection() {
    const counts = [Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3, Math.floor(Math.random() * 5) + 3];
    const items = ['quả táo', 'quả cam', 'quả lê'];
    
    const text = `Trong rổ có ${counts[0]} ${items[0]}, ${counts[1]} ${items[1]} và ${counts[2]} ${items[2]}. Hỏi tổng số quả táo và quả cam trong rổ là bao nhiêu quả?`;
    const ans = counts[0] + counts[1];
    
    return {
      type: 'math',
      subtype: 'statistics',
      expression: `stats_collect_${counts[0]}_${counts[1]}_${counts[2]}`,
      questionText: text,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 30)
    };
  },

  generateStatsPictogram() {
    const countA = Math.floor(Math.random() * 4) + 2;
    const text = `Mỗi hình tròn đại diện cho 2 ngôi sao. Hàng A có ${countA} hình tròn. Hỏi hàng A đại diện cho bao nhiêu ngôi sao?`;
    const ans = countA * 2;
    
    return {
      type: 'math',
      subtype: 'statistics',
      expression: `pictogram_${countA}_circles_x2`,
      questionText: text,
      answer: ans,
      options: this.generateNumberOptions(ans, 0, 20)
    };
  },

  generateProbabilityCertainty() {
    const type = Math.random() < 0.33 ? 'certain' : (Math.random() < 0.5 ? 'possible' : 'impossible');
    
    let text, ans;
    if (type === 'certain') {
      text = "Trong hộp chỉ có 5 viên bi màu xanh. Nếu ta nhắm mắt lấy ra 1 viên bi, khả năng lấy được viên bi màu xanh là:";
      ans = "Chắc chắn";
    } else if (type === 'possible') {
      text = "Trong hộp có 3 viên bi màu xanh và 2 viên bi màu đỏ. Nếu ta nhắm mắt lấy ra 1 viên bi, khả năng lấy được viên bi màu xanh là:";
      ans = "Có thể";
    } else {
      text = "Trong hộp chỉ có 5 viên bi màu xanh. Nếu ta nhắm mắt lấy ra 1 viên bi, khả năng lấy được viên bi màu đỏ là:";
      ans = "Không thể";
    }
    
    return {
      type: 'math',
      subtype: 'probability',
      expression: `prob_${type}`,
      questionText: text,
      answer: ans,
      options: ['Chắc chắn', 'Có thể', 'Không thể']
    };
  },

  generateMixedReview(lessonType) {
    // Trộn ngẫu nhiên một trong các bài đã học trước đó để ôn tập
    const candidates = ['addition_carry_20', 'subtraction_borrow_20', 'addition_carry_100_2', 'subtraction_borrow_100_2', 'multiplication_table_2', 'division_table_5', 'comparison_3_digits', 'length_dm_m_km'];
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    return this.generateNewQuestion({ type: chosen });
  },

  // ===== TIỆN ÍCH TRỢ GIÚP =====

  generateNumberOptions(correctAnswer, min, max) {
    const options = new Set([correctAnswer]);
    const maxAttempts = 100;
    let attempts = 0;
    
    while (options.size < 4 && attempts < maxAttempts) {
      attempts++;
      const offset = Math.floor(Math.random() * 10) + 1;
      const wrong = Math.random() < 0.5 ? correctAnswer + offset : correctAnswer - offset;
      if (wrong >= min && wrong <= max && wrong !== correctAnswer) {
        options.add(wrong);
      }
    }
    
    // Nếu vẫn chưa đủ 4
    while (options.size < 4) {
      options.add(Math.floor(Math.random() * 20));
    }
    
    return Array.from(options).sort(() => Math.random() - 0.5);
  },

  shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  },

  readVietnameseNumber(n) {
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    
    let res = `${units[hundreds]} trăm`;
    
    if (tens === 0) {
      if (ones !== 0) {
        res += ` linh ${units[ones]}`;
      }
    } else if (tens === 1) {
      res += ` mười`;
      if (ones === 5) res += ` lăm`;
      else if (ones !== 0) res += ` ${units[ones]}`;
    } else {
      res += ` ${units[tens]} mươi`;
      if (ones === 1) res += ` mốt`;
      else if (ones === 5) res += ` lăm`;
      else if (ones !== 0) res += ` ${units[ones]}`;
    }
    
    // Capitalize first letter
    return res.charAt(0).toUpperCase() + res.slice(1);
  }
};

// Export
window.MathQuestionGenerator = MathQuestionGenerator;
