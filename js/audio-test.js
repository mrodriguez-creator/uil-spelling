// UIL Spelling & Vocabulary Practice - Audio Test Tab
'use strict';

App.setupAudioTest = function() {
  document.querySelectorAll('.word-count-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.word-count-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      App.state.audioTest.wordCount = parseInt(btn.dataset.count);
    });
  });

  document.getElementById('startAudioTest').addEventListener('click', App.startAudioTest);
  document.getElementById('audioTestSubmit').addEventListener('click', App.submitAudioTestAnswer);
  document.getElementById('audioTestInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.submitAudioTestAnswer();
  });
  document.getElementById('audioTestNext').addEventListener('click', App.nextAudioTestWord);
  document.getElementById('audioTestReplay').addEventListener('click', App.replayAudioTestWord);
  // restartAudioTest is handled in regional-test.js (goes back to mode selector)
  document.getElementById('reviewMissedWords').addEventListener('click', App.reviewMissedAudioWords);
};

App.startAudioTest = function() {
  var count = App.state.audioTest.wordCount;
  var source = document.getElementById('audioTestSource').value;

  var pool;
  switch (source) {
    case 'vocab':
      pool = App.state.words.filter(function(w) { return w.vocab; });
      break;
    case 'unstudied':
      pool = App.state.words.filter(function(w) { return !App.getStatus(w.word); });
      break;
    case 'missed':
      pool = App.state.words.filter(function(w) { return App.getMissCount(w.word) > 0; });
      break;
    default:
      pool = App.state.words.slice();
  }

  if (pool.length === 0) {
    alert('No words match your filter. Try a different source.');
    return;
  }

  App.weightedShuffle(pool);
  var selected = pool.slice(0, Math.min(count, pool.length));

  var wordsReady = selected.map(function(w) {
    var def = w.def || App.findDefinition(w) || null;
    return Object.assign({}, w, { def: def });
  });

  App.state.audioTest.words = wordsReady;
  App.state.audioTest.index = 0;
  App.state.audioTest.score = 0;
  App.state.audioTest.results = [];

  document.getElementById('audioTestSetup').classList.add('hidden');
  document.getElementById('audioTestActive').classList.remove('hidden');
  document.getElementById('audioTestTotal').textContent = wordsReady.length;
  document.getElementById('audioTestScore').textContent = '0';

  App.playAudioTestWord();
};

App.playAudioTestWord = function() {
  // Stop any currently playing audio/TTS from a previous word or replay
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();

  var w = App.state.audioTest.words[App.state.audioTest.index];
  var statusEl = document.getElementById('audioTestStatus');
  var inputEl = document.getElementById('audioTestInput');
  var submitEl = document.getElementById('audioTestSubmit');

  document.getElementById('audioTestNum').textContent = App.state.audioTest.index + 1;
  document.getElementById('audioTestProgressBar').style.width =
    ((App.state.audioTest.index) / App.state.audioTest.words.length * 100) + '%';

  inputEl.value = '';
  inputEl.disabled = true;
  submitEl.disabled = true;
  document.getElementById('audioTestFeedback').classList.add('hidden');
  document.getElementById('audioTestNext').classList.add('hidden');
  document.getElementById('audioTestSubmit').classList.remove('hidden');

  App.state.audioTest.isPlaying = true;

  var sequenceId = Date.now();
  App.state.audioTest.currentSequence = sequenceId;

  App.runAudioSequence(w, sequenceId);
};

App.runAudioSequence = async function(wordObj, sequenceId) {
  var statusEl = document.getElementById('audioTestStatus');

  var defPromise = null;
  if (!wordObj.def) {
    defPromise = App.fetchDefinition(wordObj.word);
  }

  statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word...</span>';
  await App.playWordAudio(wordObj.word);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  // Enable input immediately after first pronunciation so student can start typing
  App.state.audioTest.isPlaying = false;
  statusEl.innerHTML = '<div class="audio-pulse"></div><span>&#9998; Type anytime \u2014 audio continues...</span>';
  document.getElementById('audioTestInput').disabled = false;
  document.getElementById('audioTestSubmit').disabled = false;
  document.getElementById('audioTestInput').focus();

  await App.delay(CONFIG.AUDIO_DELAY_AFTER_FIRST);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word again... (type anytime)</span>';
  await App.playWordAudio(wordObj.word);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  if (defPromise) {
    var fetchedDef = await defPromise;
    wordObj.def = fetchedDef || CONFIG.DEF_SPELL_ONLY_TEXT;
    App.state.audioTest.words[App.state.audioTest.index] = wordObj;
  }
  if (!wordObj.def) {
    wordObj.def = CONFIG.DEF_SPELL_ONLY_TEXT;
  }

  await App.delay(CONFIG.AUDIO_DELAY_AFTER_SECOND);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  statusEl.innerHTML = '<div class="audio-pulse pulse-green"></div><span>Reading definition... (type anytime)</span>';
  await App.speakTTSAsync(wordObj.def);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  await App.delay(CONFIG.AUDIO_DELAY_AFTER_DEF);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word one last time...</span>';
  await App.playWordAudio(wordObj.word);
  if (App.state.audioTest.currentSequence !== sequenceId) return;

  statusEl.innerHTML = '<span class="audio-ready">&#9998; Type your answer below</span>';
};

App.replayAudioTestWord = function() {
  if (App.state.audioTest.index < App.state.audioTest.words.length) {
    var w = App.state.audioTest.words[App.state.audioTest.index];
    var sequenceId = Date.now();
    App.state.audioTest.currentSequence = sequenceId;
    App.state.audioTest.isPlaying = true;

    document.getElementById('audioTestInput').disabled = true;
    document.getElementById('audioTestSubmit').disabled = true;

    App.runAudioSequence(w, sequenceId);
  }
};

App.submitAudioTestAnswer = function() {
  var w = App.state.audioTest.words[App.state.audioTest.index];
  var answer = document.getElementById('audioTestInput').value.trim();
  if (!answer) return;

  // Stop any remaining audio sequence when answer is submitted
  App.state.audioTest.currentSequence = null;
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();

  var correct = App.isSpellingCorrect(answer, w);
  var feedback = document.getElementById('audioTestFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (correct) {
    App.state.audioTest.score++;
    document.getElementById('audioTestScore').textContent = App.state.audioTest.score;
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct!';
    App.setStatus(w.word, App.getStatus(w.word) === 'mastered' ? 'mastered' : 'studied');
    App.recordAccuracy(w.word, true);
  } else {
    feedback.classList.add('incorrect');
    feedback.innerHTML = '\u2717 Incorrect. The correct spelling is: <strong>' + App.escapeHtml(w.word) + '</strong>' +
      (w.alt ? ' (also accepted: ' + App.escapeHtml(w.alt) + ')' : '');
    App.recordMiss(w.word, 'audio');
    App.recordAccuracy(w.word, false);
  }

  App.state.audioTest.results.push({
    word: w.word,
    def: w.def,
    answer: answer,
    correct: correct
  });

  document.getElementById('audioTestSubmit').classList.add('hidden');
  document.getElementById('audioTestNext').classList.remove('hidden');
  document.getElementById('audioTestInput').disabled = true;
};

App.nextAudioTestWord = function() {
  App.state.audioTest.index++;
  if (App.state.audioTest.index >= App.state.audioTest.words.length) {
    App.showAudioTestResults();
  } else {
    App.playAudioTestWord();
  }
};

App.showAudioTestResults = function() {
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();
  App.state.audioTest.currentSequence = null;

  document.getElementById('audioTestActive').classList.add('hidden');
  document.getElementById('audioTestResults').classList.remove('hidden');

  var total = App.state.audioTest.words.length;
  var score = App.state.audioTest.score;
  var pct = Math.round(score / total * 100);

  document.getElementById('audioTestResultsScore').textContent = score + ' / ' + total + ' (' + pct + '%)';

  var gradeEl = document.getElementById('audioTestGrade');
  var grade, gradeClass;
  if (pct >= 90) { grade = 'A'; gradeClass = 'grade-a'; }
  else if (pct >= 80) { grade = 'B'; gradeClass = 'grade-b'; }
  else if (pct >= 70) { grade = 'C'; gradeClass = 'grade-c'; }
  else if (pct >= 60) { grade = 'D'; gradeClass = 'grade-d'; }
  else { grade = 'F'; gradeClass = 'grade-f'; }
  gradeEl.innerHTML = '<span class="grade-letter ' + gradeClass + '">' + grade + '</span>';

  var missed = App.state.audioTest.results.filter(function(r) { return !r.correct; });
  document.getElementById('reviewMissedWords').style.display = missed.length > 0 ? '' : 'none';

  var list = document.getElementById('audioTestResultsList');
  list.innerHTML = App.state.audioTest.results.map(function(r, i) {
    return '<div class="result-item">' +
      '<span class="result-num">' + (i + 1) + '.</span>' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<span><strong>' + App.escapeHtml(r.word) + '</strong></span>' +
      (!r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};

App.reviewMissedAudioWords = function() {
  var missed = App.state.audioTest.results.filter(function(r) { return !r.correct; });
  if (missed.length === 0) return;

  App.state.studyDeck = missed.map(function(r) {
    return App.state.words.find(function(w) {
      return w.word.toLowerCase() === r.word.toLowerCase();
    }) || { id: -1, word: r.word, alt: null, vocab: false, number: 0 };
  });
  App.state.currentCard = 0;

  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  document.querySelector('[data-tab="study"]').classList.add('active');
  document.getElementById('tab-study').classList.add('active');

  App.showCard();
};
