// UIL Spelling & Vocabulary Practice - Quiz Mode Tab
'use strict';

App.setupQuiz = function() {
  document.querySelectorAll('.quiz-type-card').forEach(function(card) {
    card.addEventListener('click', function() { App.startQuiz(card.dataset.quiz); });
  });
  document.getElementById('quizNext').addEventListener('click', App.nextQuizQuestion);
  document.getElementById('quizSubmitAnswer').addEventListener('click', App.submitQuizAnswer);
  document.getElementById('quizAnswer').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.submitQuizAnswer();
  });
  document.getElementById('restartQuiz').addEventListener('click', function() {
    App.stopQuizTimer();
    App.state.fullTestMode = false;
    document.getElementById('quizResults').classList.add('hidden');
    document.getElementById('quizSetup').classList.remove('hidden');
  });
};

App.startQuiz = function(type) {
  App.state.quizType = type;
  App.state.quizIndex = 0;
  App.state.quizScore = 0;
  App.state.quizResults = [];
  App.state.fullTestMode = (type === 'fulltest');

  switch (type) {
    case 'proofreading': App.generateProofreadingQuiz(); break;
    case 'vocabulary': App.generateVocabularyQuiz(); break;
    case 'definition': App.generateDefinitionQuiz(); break;
    case 'fulltest': App.generateFullTest(); break;
  }

  document.getElementById('quizSetup').classList.add('hidden');
  document.getElementById('quizActive').classList.remove('hidden');
  document.getElementById('quizTotal').textContent = App.state.quizQuestions.length;
  document.getElementById('quizScore').textContent = '0';

  // Show/hide timer and part label for full test
  var timerEl = document.getElementById('quizTimer');
  var partLabel = document.getElementById('quizPartLabel');
  if (App.state.fullTestMode) {
    timerEl.classList.remove('hidden');
    partLabel.classList.remove('hidden');
    App.startQuizTimer();
  } else {
    timerEl.classList.add('hidden');
    partLabel.classList.add('hidden');
  }

  App.showQuizQuestion();
};

App.generateProofreadingQuiz = function() {
  var questions = [];
  var pool = App.shuffleArray(App.state.words.slice()).slice(0, CONFIG.QUIZ_POOL_SIZE);

  for (var i = 0; i < CONFIG.QUIZ_QUESTION_COUNT && i * CONFIG.QUIZ_WORDS_PER_GROUP < pool.length; i++) {
    var group = pool.slice(i * CONFIG.QUIZ_WORDS_PER_GROUP, i * CONFIG.QUIZ_WORDS_PER_GROUP + CONFIG.QUIZ_WORDS_PER_GROUP);
    var misspellIdx = Math.floor(Math.random() * CONFIG.QUIZ_WORDS_PER_GROUP);
    var original = group[misspellIdx].word;
    var misspelled = App.createMisspelling(original);

    questions.push({
      type: 'proofreading',
      words: group.map(function(w, j) { return j === misspellIdx ? misspelled : w.word; }),
      correctIndex: misspellIdx,
      correctSpelling: original,
      misspelled: misspelled
    });
  }
  App.state.quizQuestions = questions;
};

App.createMisspelling = function(word) {
  var lower = word.toLowerCase();
  var strategies = [
    function() { var i = Math.floor(Math.random() * (word.length - 1)) + 1; return word.slice(0, i) + word[i] + word.slice(i); },
    function() { var i = Math.floor(Math.random() * word.length); return word.slice(0, i) + word.slice(i + 1); },
    function() {
      var i = Math.floor(Math.random() * (word.length - 1));
      return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
    },
    function() {
      var vowels = 'aeiou';
      var indices = [];
      for (var i = 0; i < lower.length; i++) { if (vowels.includes(lower[i])) indices.push(i); }
      if (indices.length === 0) return word.slice(0, -1) + 'e';
      var i = indices[Math.floor(Math.random() * indices.length)];
      var newVowel = vowels.replace(lower[i], '')[Math.floor(Math.random() * 4)];
      return word.slice(0, i) + newVowel + word.slice(i + 1);
    }
  ];

  var result = strategies[Math.floor(Math.random() * strategies.length)]();
  return result === word ? word.slice(0, -1) + (word.endsWith('e') ? 'a' : 'e') : result;
};

App.generateDefinitionQuiz = function() {
  var wordsWithDefs = [];
  for (var key in PRACTICE_TESTS) {
    PRACTICE_TESTS[key].words.forEach(function(w) { wordsWithDefs.push(w); });
  }
  App.shuffleArray(wordsWithDefs);
  App.state.quizQuestions = wordsWithDefs.slice(0, CONFIG.QUIZ_QUESTION_COUNT).map(function(w) {
    var wrongDefs = wordsWithDefs
      .filter(function(x) { return x.word !== w.word; })
      .sort(function() { return Math.random() - 0.5; })
      .slice(0, 3)
      .map(function(x) { return x.def; });
    var options = App.shuffleArray([w.def].concat(wrongDefs));
    return {
      type: 'definition',
      word: w.word,
      correctDef: w.def,
      options: options,
      correctIndex: options.indexOf(w.def)
    };
  });
};

App.generateVocabularyQuiz = function() {
  var pool = App.shuffleArray(VOCAB_QUESTIONS.slice());
  App.state.quizQuestions = pool.slice(0, CONFIG.QUIZ_QUESTION_COUNT).map(function(q) {
    return {
      type: 'vocabulary',
      sentence: q.sentence,
      options: q.options.slice(),
      answer: q.answer
    };
  });
};

// ==================== FULL PRACTICE TEST ====================
App.generateFullTest = function() {
  // Part I: Proofreading (15 questions)
  var proofPool = App.shuffleArray(App.state.words.slice()).slice(0, CONFIG.FULL_TEST_PROOFREAD_COUNT * CONFIG.QUIZ_WORDS_PER_GROUP);
  var proofQuestions = [];
  for (var i = 0; i < CONFIG.FULL_TEST_PROOFREAD_COUNT && i * CONFIG.QUIZ_WORDS_PER_GROUP < proofPool.length; i++) {
    var group = proofPool.slice(i * CONFIG.QUIZ_WORDS_PER_GROUP, i * CONFIG.QUIZ_WORDS_PER_GROUP + CONFIG.QUIZ_WORDS_PER_GROUP);
    var misspellIdx = Math.floor(Math.random() * CONFIG.QUIZ_WORDS_PER_GROUP);
    var original = group[misspellIdx].word;
    var misspelled = App.createMisspelling(original);
    proofQuestions.push({
      type: 'proofreading',
      part: 1,
      words: group.map(function(w, j) { return j === misspellIdx ? misspelled : w.word; }),
      correctIndex: misspellIdx,
      correctSpelling: original,
      misspelled: misspelled
    });
  }

  // Part II: Vocabulary (15 questions)
  var vocabPool = App.shuffleArray(VOCAB_QUESTIONS.slice());
  var vocabQuestions = vocabPool.slice(0, CONFIG.FULL_TEST_VOCAB_COUNT).map(function(q) {
    return {
      type: 'vocabulary',
      part: 2,
      sentence: q.sentence,
      options: q.options.slice(),
      answer: q.answer
    };
  });

  App.state.quizQuestions = proofQuestions.concat(vocabQuestions);
};

// ==================== TIMER ====================
App.startQuizTimer = function() {
  App.state.quizTimeLeft = CONFIG.FULL_TEST_TIME_SECONDS;
  App.updateTimerDisplay();
  App.state.quizTimer = setInterval(function() {
    App.state.quizTimeLeft--;
    App.updateTimerDisplay();
    if (App.state.quizTimeLeft <= 0) {
      App.stopQuizTimer();
      App.showQuizResults();
    }
  }, 1000);
};

App.stopQuizTimer = function() {
  if (App.state.quizTimer) {
    clearInterval(App.state.quizTimer);
    App.state.quizTimer = null;
  }
};

App.updateTimerDisplay = function() {
  var mins = Math.floor(App.state.quizTimeLeft / 60);
  var secs = App.state.quizTimeLeft % 60;
  var timerEl = document.getElementById('quizTimerText');
  timerEl.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;

  var timerContainer = document.getElementById('quizTimer');
  timerContainer.classList.remove('timer-warning', 'timer-danger');
  if (App.state.quizTimeLeft <= 60) {
    timerContainer.classList.add('timer-danger');
  } else if (App.state.quizTimeLeft <= 180) {
    timerContainer.classList.add('timer-warning');
  }
};

App.showQuizQuestion = function() {
  var q = App.state.quizQuestions[App.state.quizIndex];
  document.getElementById('quizNum').textContent = App.state.quizIndex + 1;
  document.getElementById('quizFeedback').classList.add('hidden');
  document.getElementById('quizNext').classList.add('hidden');

  // Update part label for full test
  if (App.state.fullTestMode && q.part) {
    var partLabel = document.getElementById('quizPartLabel');
    partLabel.textContent = q.part === 1 ? 'Part I: Proofreading' : 'Part II: Vocabulary';
    partLabel.className = 'quiz-part-label' + (q.part === 2 ? ' part-two' : '');
  }

  var questionEl = document.getElementById('quizQuestion');
  var optionsEl = document.getElementById('quizOptions');
  var inputEl = document.getElementById('quizInput');

  optionsEl.innerHTML = '';
  inputEl.classList.add('hidden');

  if (q.type === 'proofreading') {
    questionEl.textContent = 'Find the misspelled word and click on it:';
    var grid = document.createElement('div');
    grid.className = 'proof-group';
    q.words.forEach(function(w, i) {
      var btn = document.createElement('button');
      btn.className = 'proof-word';
      btn.textContent = w;
      btn.addEventListener('click', function() { App.handleProofAnswer(i, q, grid); });
      grid.appendChild(btn);
    });
    optionsEl.appendChild(grid);
  } else if (q.type === 'definition') {
    questionEl.textContent = 'What is the definition of "' + q.word + '"?';
    q.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', function() { App.handleDefAnswer(i, q, optionsEl); });
      optionsEl.appendChild(btn);
    });
  } else if (q.type === 'vocabulary') {
    questionEl.innerHTML = 'Choose the word that best completes the sentence:<br><em>' + App.escapeHtml(q.sentence) + '</em>';
    q.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', function() { App.handleVocabAnswer(i, q, optionsEl); });
      optionsEl.appendChild(btn);
    });
  }
};

App.handleProofAnswer = function(selectedIdx, q, grid) {
  var buttons = grid.querySelectorAll('.proof-word');
  buttons.forEach(function(b) { b.style.pointerEvents = 'none'; });

  var feedback = document.getElementById('quizFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (selectedIdx === q.correctIndex) {
    buttons[selectedIdx].classList.add('correct-answer');
    feedback.classList.add('correct');
    feedback.innerHTML = '\u2713 You found it! Now spell "' + App.escapeHtml(q.misspelled) + '" correctly:' +
      '<div class="proof-spell-input"><input type="text" id="proofSpellInput" class="quiz-spell-input" placeholder="Type correct spelling...">' +
      '<button class="btn btn-small" id="proofSpellSubmit">Check</button></div>';

    var spellInput = document.getElementById('proofSpellInput');
    var spellSubmit = document.getElementById('proofSpellSubmit');
    spellInput.focus();

    var handleSpell = function() {
      var typed = spellInput.value.trim();
      if (!typed) return;
      spellInput.disabled = true;
      spellSubmit.disabled = true;

      if (typed.toLowerCase() === q.correctSpelling.toLowerCase()) {
        App.state.quizScore++;
        document.getElementById('quizScore').textContent = App.state.quizScore;
        feedback.classList.remove('incorrect');
        feedback.classList.add('correct');
        feedback.innerHTML = '\u2713 Correct! "' + App.escapeHtml(q.correctSpelling) + '" is right!';
      } else {
        feedback.classList.remove('correct');
        feedback.classList.add('incorrect');
        feedback.innerHTML = '\u2717 Not quite. The correct spelling is: <strong>' + App.escapeHtml(q.correctSpelling) + '</strong>';
      }
      App.state.quizResults.push({ correct: typed.toLowerCase() === q.correctSpelling.toLowerCase(), word: q.correctSpelling, answer: typed, part: q.part });
      document.getElementById('quizNext').classList.remove('hidden');
    };

    spellSubmit.addEventListener('click', handleSpell);
    spellInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleSpell(); });
    return;
  } else {
    buttons[selectedIdx].classList.add('wrong-answer');
    buttons[q.correctIndex].classList.add('correct-answer');
    feedback.classList.add('incorrect');
    feedback.innerHTML = '\u2717 Wrong pick. The misspelled word was "' + App.escapeHtml(q.misspelled) + '". Now spell it correctly:' +
      '<div class="proof-spell-input"><input type="text" id="proofSpellInput" class="quiz-spell-input" placeholder="Type correct spelling...">' +
      '<button class="btn btn-small" id="proofSpellSubmit">Check</button></div>';

    var spellInput2 = document.getElementById('proofSpellInput');
    var spellSubmit2 = document.getElementById('proofSpellSubmit');
    spellInput2.focus();

    var handleSpell2 = function() {
      var typed = spellInput2.value.trim();
      if (!typed) return;
      spellInput2.disabled = true;
      spellSubmit2.disabled = true;

      if (typed.toLowerCase() === q.correctSpelling.toLowerCase()) {
        feedback.classList.remove('incorrect');
        feedback.classList.add('correct');
        feedback.innerHTML = '\u2713 Good \u2014 "' + App.escapeHtml(q.correctSpelling) + '" is spelled correctly! (No point for wrong pick)';
      } else {
        feedback.innerHTML = '\u2717 Incorrect. The correct spelling is: <strong>' + App.escapeHtml(q.correctSpelling) + '</strong>';
      }
      App.state.quizResults.push({ correct: false, word: q.correctSpelling, answer: typed, part: q.part });
      document.getElementById('quizNext').classList.remove('hidden');
    };

    spellSubmit2.addEventListener('click', handleSpell2);
    spellInput2.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleSpell2(); });
    return;
  }
};

App.submitQuizAnswer = function() {
  var answer = document.getElementById('quizAnswer').value.trim();
  if (!answer) return;

  var q = App.state.quizQuestions[App.state.quizIndex];
  var correct = App.isSpellingCorrect(answer, { word: q.answer, alt: q.alt });

  var feedback = document.getElementById('quizFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (correct) {
    App.state.quizScore++;
    document.getElementById('quizScore').textContent = App.state.quizScore;
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct!';
  } else {
    feedback.classList.add('incorrect');
    feedback.innerHTML = '\u2717 Incorrect. Correct spelling: <strong>' + App.escapeHtml(q.answer) + '</strong>';
  }

  App.state.quizResults.push({ correct: correct, word: q.answer, answer: answer });
  document.getElementById('quizAnswer').disabled = true;
  document.getElementById('quizSubmitAnswer').disabled = true;
  document.getElementById('quizNext').classList.remove('hidden');
};

App.handleDefAnswer = function(selectedIdx, q, container) {
  var buttons = container.querySelectorAll('.quiz-option');
  buttons.forEach(function(b) { b.style.pointerEvents = 'none'; });

  var feedback = document.getElementById('quizFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  var correct = selectedIdx === q.correctIndex;

  if (correct) {
    App.state.quizScore++;
    document.getElementById('quizScore').textContent = App.state.quizScore;
    buttons[selectedIdx].classList.add('correct-answer');
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct!';
  } else {
    buttons[selectedIdx].classList.add('wrong-answer');
    buttons[q.correctIndex].classList.add('correct-answer');
    feedback.classList.add('incorrect');
    feedback.textContent = '\u2717 Incorrect. The correct definition is: "' + q.correctDef + '"';
  }

  App.state.quizResults.push({ correct: correct, word: q.word, part: q.part });
  document.getElementById('quizNext').classList.remove('hidden');
};

App.handleVocabAnswer = function(selectedIdx, q, container) {
  var buttons = container.querySelectorAll('.quiz-option');
  buttons.forEach(function(b) { b.style.pointerEvents = 'none'; });

  var feedback = document.getElementById('quizFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  var selectedWord = q.options[selectedIdx];
  var correct = selectedWord === q.answer;
  var correctIdx = q.options.indexOf(q.answer);

  if (correct) {
    App.state.quizScore++;
    document.getElementById('quizScore').textContent = App.state.quizScore;
    buttons[selectedIdx].classList.add('correct-answer');
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct! The answer is "' + q.answer + '".';
  } else {
    buttons[selectedIdx].classList.add('wrong-answer');
    buttons[correctIdx].classList.add('correct-answer');
    feedback.classList.add('incorrect');
    feedback.textContent = '\u2717 Incorrect. The answer is "' + q.answer + '".';
  }

  App.state.quizResults.push({ correct: correct, word: q.answer, part: q.part });
  document.getElementById('quizNext').classList.remove('hidden');
};

App.nextQuizQuestion = function() {
  App.state.quizIndex++;
  document.getElementById('quizAnswer').disabled = false;
  document.getElementById('quizSubmitAnswer').disabled = false;

  if (App.state.quizIndex >= App.state.quizQuestions.length) {
    App.showQuizResults();
  } else {
    App.showQuizQuestion();
  }
};

App.showQuizResults = function() {
  App.stopQuizTimer();
  document.getElementById('quizActive').classList.add('hidden');
  document.getElementById('quizResults').classList.remove('hidden');

  var total = App.state.quizResults.length;
  var pct = total > 0 ? Math.round(App.state.quizScore / total * 100) : 0;
  document.getElementById('quizResultsScore').textContent = App.state.quizScore + '/' + total + ' (' + pct + '%)';

  // Per-part breakdown for full test
  var breakdownEl = document.getElementById('quizPartBreakdown');
  if (App.state.fullTestMode && breakdownEl) {
    var p1Correct = 0, p1Total = 0, p2Correct = 0, p2Total = 0;
    App.state.quizResults.forEach(function(r) {
      if (r.part === 1) { p1Total++; if (r.correct) p1Correct++; }
      else if (r.part === 2) { p2Total++; if (r.correct) p2Correct++; }
    });
    var timeUsed = CONFIG.FULL_TEST_TIME_SECONDS - App.state.quizTimeLeft;
    var mins = Math.floor(timeUsed / 60);
    var secs = timeUsed % 60;
    breakdownEl.innerHTML =
      '<div class="part-breakdown-row"><span>Part I: Proofreading</span><strong>' + p1Correct + ' / ' + p1Total + '</strong></div>' +
      '<div class="part-breakdown-row"><span>Part II: Vocabulary</span><strong>' + p2Correct + ' / ' + p2Total + '</strong></div>' +
      '<div class="part-breakdown-row"><span>Time Used</span><strong>' + mins + ':' + (secs < 10 ? '0' : '') + secs + '</strong></div>';
    breakdownEl.classList.remove('hidden');
  } else if (breakdownEl) {
    breakdownEl.classList.add('hidden');
  }

  document.getElementById('quizResultsList').innerHTML = App.state.quizResults.map(function(r) {
    return '<div class="result-item">' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<strong>' + App.escapeHtml(r.word) + '</strong>' +
      (r.answer && !r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};
