// UIL Spelling & Vocabulary Practice - Spelling Practice Tab
'use strict';

App.setupPractice = function() {
  document.getElementById('startPractice').addEventListener('click', App.startPractice);
  document.getElementById('practiceSubmit').addEventListener('click', App.checkPracticeAnswer);
  document.getElementById('practiceInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.checkPracticeAnswer();
  });
  document.getElementById('practiceNext').addEventListener('click', App.nextPracticeWord);
  document.getElementById('restartPractice').addEventListener('click', function() {
    document.getElementById('practiceResults').classList.add('hidden');
    document.getElementById('practiceSetup').classList.remove('hidden');
  });
  document.getElementById('practiceSpeak').addEventListener('click', function() {
    if (App.state.practiceWords.length > 0) {
      App.speak(App.state.practiceWords[App.state.practiceIndex].word);
    }
  });
};

App.startPractice = function() {
  var count = parseInt(document.getElementById('practiceCount').value);
  var source = document.getElementById('practiceSource').value;

  var pool;
  switch (source) {
    case 'vocab': pool = App.state.words.filter(function(w) { return w.vocab; }); break;
    case 'unstudied': pool = App.state.words.filter(function(w) { return !App.getStatus(w.word); }); break;
    case 'missed': pool = App.state.words.filter(function(w) { return App.getMissCount(w.word) > 0; }); break;
    default: pool = App.state.words.slice();
  }

  if (pool.length === 0) {
    alert('No words match your filter. Try a different source.');
    return;
  }

  App.weightedShuffle(pool);
  App.state.practiceWords = pool.slice(0, Math.min(count, pool.length));
  App.state.practiceIndex = 0;
  App.state.practiceScore = 0;
  App.state.practiceResults = [];

  document.getElementById('practiceSetup').classList.add('hidden');
  document.getElementById('practiceActive').classList.remove('hidden');
  document.getElementById('practiceTotal').textContent = App.state.practiceWords.length;
  document.getElementById('practiceScore').textContent = '0';

  App.showPracticeWord();
};

App.showPracticeWord = function() {
  var w = App.state.practiceWords[App.state.practiceIndex];
  document.getElementById('practiceNum').textContent = App.state.practiceIndex + 1;
  document.getElementById('practiceProgressBar').style.width =
    ((App.state.practiceIndex) / App.state.practiceWords.length * 100) + '%';

  var def = w.def || App.findDefinition(w) || 'Listen to the pronunciation and spell the word.';
  document.getElementById('practiceDef').textContent = def;

  document.getElementById('practiceInput').value = '';
  document.getElementById('practiceInput').focus();
  document.getElementById('practiceFeedback').classList.add('hidden');
  document.getElementById('practiceNext').classList.add('hidden');
  document.getElementById('practiceSubmit').classList.remove('hidden');
  document.getElementById('practiceInput').disabled = false;
};

App.checkPracticeAnswer = function() {
  var w = App.state.practiceWords[App.state.practiceIndex];
  var answer = document.getElementById('practiceInput').value.trim();
  if (!answer) return;

  var correct = App.isSpellingCorrect(answer, w);
  var feedback = document.getElementById('practiceFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (correct) {
    App.state.practiceScore++;
    document.getElementById('practiceScore').textContent = App.state.practiceScore;
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct!';
    App.setStatus(w.word, App.getStatus(w.word) === 'mastered' ? 'mastered' : 'studied');
    App.recordAccuracy(w.word, true);
  } else {
    feedback.classList.add('incorrect');
    feedback.innerHTML = '\u2717 Incorrect. The correct spelling is: <strong>' + App.escapeHtml(w.word) + '</strong>' +
      (w.alt ? ' (also accepted: ' + App.escapeHtml(w.alt) + ')' : '');
    App.recordMiss(w.word, 'practice');
    App.recordAccuracy(w.word, false);
  }

  App.state.practiceResults.push({ word: w.word, answer: answer, correct: correct });
  document.getElementById('practiceSubmit').classList.add('hidden');
  document.getElementById('practiceNext').classList.remove('hidden');
  document.getElementById('practiceInput').disabled = true;
};

App.nextPracticeWord = function() {
  App.state.practiceIndex++;
  if (App.state.practiceIndex >= App.state.practiceWords.length) {
    App.showPracticeResults();
  } else {
    App.showPracticeWord();
  }
};

App.showPracticeResults = function() {
  document.getElementById('practiceActive').classList.add('hidden');
  document.getElementById('practiceResults').classList.remove('hidden');

  var pct = Math.round(App.state.practiceScore / App.state.practiceWords.length * 100);
  document.getElementById('resultsScore').textContent = App.state.practiceScore + '/' + App.state.practiceWords.length + ' (' + pct + '%)';

  var list = document.getElementById('resultsList');
  list.innerHTML = App.state.practiceResults.map(function(r) {
    return '<div class="result-item">' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<span><strong>' + App.escapeHtml(r.word) + '</strong></span>' +
      (!r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};
