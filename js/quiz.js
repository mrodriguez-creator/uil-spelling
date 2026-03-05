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
    document.getElementById('quizResults').classList.add('hidden');
    document.getElementById('quizSetup').classList.remove('hidden');
  });
};

App.startQuiz = function(type) {
  App.state.quizType = type;
  App.state.quizIndex = 0;
  App.state.quizScore = 0;
  App.state.quizResults = [];

  switch (type) {
    case 'proofreading': App.generateProofreadingQuiz(); break;
    case 'spelling': App.generateSpellingQuiz(); break;
    case 'vocabulary': App.generateVocabularyQuiz(); break;
  }

  document.getElementById('quizSetup').classList.add('hidden');
  document.getElementById('quizActive').classList.remove('hidden');
  document.getElementById('quizTotal').textContent = App.state.quizQuestions.length;
  document.getElementById('quizScore').textContent = '0';

  App.state.quizTimeLeft = 900;
  App.updateTimer();
  App.state.quizTimer = setInterval(function() {
    App.state.quizTimeLeft--;
    App.updateTimer();
    if (App.state.quizTimeLeft <= 0) {
      clearInterval(App.state.quizTimer);
      App.showQuizResults();
    }
  }, 1000);

  App.showQuizQuestion();
};

App.updateTimer = function() {
  var m = Math.floor(App.state.quizTimeLeft / 60);
  var s = App.state.quizTimeLeft % 60;
  document.getElementById('quizTimer').textContent = m + ':' + s.toString().padStart(2, '0');
};

App.generateProofreadingQuiz = function() {
  var questions = [];
  var pool = App.shuffleArray(App.state.words.slice()).slice(0, 75);

  for (var i = 0; i < 15 && i * 5 < pool.length; i++) {
    var group = pool.slice(i * 5, i * 5 + 5);
    var misspellIdx = Math.floor(Math.random() * 5);
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

App.generateSpellingQuiz = function() {
  var wordsWithDefs = [];
  for (var key in PRACTICE_TESTS) {
    PRACTICE_TESTS[key].words.forEach(function(w) { wordsWithDefs.push(w); });
  }
  App.shuffleArray(wordsWithDefs);
  App.state.quizQuestions = wordsWithDefs.slice(0, 15).map(function(w) {
    return {
      type: 'spelling',
      def: w.def,
      answer: w.word,
      alt: w.alt
    };
  });
};

App.generateVocabularyQuiz = function() {
  var wordsWithDefs = [];
  for (var key in PRACTICE_TESTS) {
    PRACTICE_TESTS[key].words.forEach(function(w) { wordsWithDefs.push(w); });
  }
  App.shuffleArray(wordsWithDefs);

  App.state.quizQuestions = wordsWithDefs.slice(0, 15).map(function(w) {
    var wrongDefs = wordsWithDefs
      .filter(function(x) { return x.word !== w.word; })
      .sort(function() { return Math.random() - 0.5; })
      .slice(0, 3)
      .map(function(x) { return x.def; });

    var options = App.shuffleArray([w.def].concat(wrongDefs));

    return {
      type: 'vocabulary',
      word: w.word,
      correctDef: w.def,
      options: options,
      correctIndex: options.indexOf(w.def)
    };
  });
};

App.showQuizQuestion = function() {
  var q = App.state.quizQuestions[App.state.quizIndex];
  document.getElementById('quizNum').textContent = App.state.quizIndex + 1;
  document.getElementById('quizFeedback').classList.add('hidden');
  document.getElementById('quizNext').classList.add('hidden');

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
  } else if (q.type === 'spelling') {
    questionEl.textContent = 'Spell the word defined as: "' + q.def + '"';
    inputEl.classList.remove('hidden');
    document.getElementById('quizAnswer').value = '';
    document.getElementById('quizAnswer').focus();
  } else if (q.type === 'vocabulary') {
    questionEl.textContent = 'What is the definition of "' + q.word + '"?';
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
    App.state.quizScore++;
    document.getElementById('quizScore').textContent = App.state.quizScore;
    buttons[selectedIdx].classList.add('correct-answer');
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct! "' + q.misspelled + '" should be spelled "' + q.correctSpelling + '".';
  } else {
    buttons[selectedIdx].classList.add('wrong-answer');
    buttons[q.correctIndex].classList.add('correct-answer');
    feedback.classList.add('incorrect');
    feedback.textContent = '\u2717 Wrong. "' + q.misspelled + '" (position ' + (q.correctIndex + 1) + ') should be "' + q.correctSpelling + '".';
  }

  App.state.quizResults.push({ correct: selectedIdx === q.correctIndex, word: q.correctSpelling });
  document.getElementById('quizNext').classList.remove('hidden');
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

App.handleVocabAnswer = function(selectedIdx, q, container) {
  var buttons = container.querySelectorAll('.quiz-option');
  buttons.forEach(function(b) { b.style.pointerEvents = 'none'; });

  var feedback = document.getElementById('quizFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (selectedIdx === q.correctIndex) {
    App.state.quizScore++;
    document.getElementById('quizScore').textContent = App.state.quizScore;
    buttons[selectedIdx].classList.add('correct-answer');
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct!';
  } else {
    buttons[selectedIdx].classList.add('wrong-answer');
    buttons[q.correctIndex].classList.add('correct-answer');
    feedback.classList.add('incorrect');
    feedback.textContent = '\u2717 Incorrect.';
  }

  App.state.quizResults.push({ correct: selectedIdx === q.correctIndex, word: q.word });
  document.getElementById('quizNext').classList.remove('hidden');
};

App.nextQuizQuestion = function() {
  App.state.quizIndex++;
  document.getElementById('quizAnswer').disabled = false;
  document.getElementById('quizSubmitAnswer').disabled = false;

  if (App.state.quizIndex >= App.state.quizQuestions.length) {
    clearInterval(App.state.quizTimer);
    App.showQuizResults();
  } else {
    App.showQuizQuestion();
  }
};

App.showQuizResults = function() {
  document.getElementById('quizActive').classList.add('hidden');
  document.getElementById('quizResults').classList.remove('hidden');
  clearInterval(App.state.quizTimer);

  var total = App.state.quizResults.length;
  var pct = total > 0 ? Math.round(App.state.quizScore / total * 100) : 0;
  document.getElementById('quizResultsScore').textContent = App.state.quizScore + '/' + total + ' (' + pct + '%)';

  document.getElementById('quizResultsList').innerHTML = App.state.quizResults.map(function(r) {
    return '<div class="result-item">' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<strong>' + App.escapeHtml(r.word) + '</strong>' +
      (r.answer && !r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};
