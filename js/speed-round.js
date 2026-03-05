// UIL Spelling & Vocabulary Practice - Speed Round (60-second drill)
'use strict';

App.setupSpeedRound = function() {
  document.getElementById('speedStart').addEventListener('click', App.startSpeedRound);
  document.getElementById('speedInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.checkSpeedAnswer();
  });
  document.getElementById('speedRestart').addEventListener('click', function() {
    document.getElementById('speedResults').classList.add('hidden');
    document.getElementById('speedSetup').classList.remove('hidden');
  });
};

App.startSpeedRound = function() {
  var source = document.getElementById('speedSource').value;
  var pool;
  switch (source) {
    case 'vocab': pool = App.state.words.filter(function(w) { return w.vocab; }); break;
    case 'missed': pool = App.state.words.filter(function(w) { return App.getMissCount(w.word) > 0; }); break;
    case 'accented': pool = App.getAccentedWords(); break;
    default: pool = App.state.words.slice();
  }

  if (pool.length < 5) {
    alert('Not enough words for this filter. Try a different source.');
    return;
  }

  App.weightedShuffle(pool);
  App.state.speedRound = {
    pool: pool,
    index: 0,
    score: 0,
    total: 0,
    results: [],
    timeLeft: CONFIG.SPEED_ROUND_SECONDS,
    timer: null,
    bestScore: parseInt(localStorage.getItem(CONFIG.STORAGE_SPEED_BEST) || '0')
  };

  document.getElementById('speedSetup').classList.add('hidden');
  document.getElementById('speedActive').classList.remove('hidden');
  document.getElementById('speedScore').textContent = '0';
  document.getElementById('speedTimerText').textContent = CONFIG.SPEED_ROUND_SECONDS;

  App.showSpeedWord();
  App.startSpeedTimer();
};

App.startSpeedTimer = function() {
  var timerText = document.getElementById('speedTimerText');
  var timerBar = document.getElementById('speedTimerBar');
  var totalTime = CONFIG.SPEED_ROUND_SECONDS;

  App.state.speedRound.timer = setInterval(function() {
    App.state.speedRound.timeLeft--;
    timerText.textContent = App.state.speedRound.timeLeft;
    timerBar.style.width = (App.state.speedRound.timeLeft / totalTime * 100) + '%';

    // Color changes
    if (App.state.speedRound.timeLeft <= 10) {
      timerBar.className = 'speed-timer-fill speed-timer-danger';
    } else if (App.state.speedRound.timeLeft <= 20) {
      timerBar.className = 'speed-timer-fill speed-timer-warning';
    }

    if (App.state.speedRound.timeLeft <= 0) {
      App.endSpeedRound();
    }
  }, 1000);
};

App.showSpeedWord = function() {
  var sr = App.state.speedRound;
  // Cycle through pool, re-shuffle if exhausted
  if (sr.index >= sr.pool.length) {
    App.shuffleArray(sr.pool);
    sr.index = 0;
  }
  var w = sr.pool[sr.index];
  var def = App.findDefinition(w) || 'Spell the word as pronounced.';

  document.getElementById('speedDef').textContent = def;
  document.getElementById('speedInput').value = '';
  document.getElementById('speedInput').focus();
  document.getElementById('speedFlash').className = 'speed-flash';

  // Pronounce the word
  App.speak(w.word);
};

App.checkSpeedAnswer = function() {
  var sr = App.state.speedRound;
  if (!sr || sr.timeLeft <= 0) return;

  var w = sr.pool[sr.index];
  var answer = document.getElementById('speedInput').value.trim();
  if (!answer) return;

  var correct = App.isSpellingCorrect(answer, w);
  sr.total++;

  if (correct) {
    sr.score++;
    document.getElementById('speedScore').textContent = sr.score;
    document.getElementById('speedFlash').className = 'speed-flash speed-flash-correct';
  } else {
    document.getElementById('speedFlash').className = 'speed-flash speed-flash-wrong';
    App.recordMiss(w.word, 'speed');
  }
  App.recordAccuracy(w.word, correct);

  sr.results.push({ word: w.word, answer: answer, correct: correct });
  sr.index++;

  // Brief flash then next word
  setTimeout(function() {
    if (sr.timeLeft > 0) App.showSpeedWord();
  }, 200);
};

App.endSpeedRound = function() {
  var sr = App.state.speedRound;
  clearInterval(sr.timer);

  document.getElementById('speedActive').classList.add('hidden');
  document.getElementById('speedResults').classList.remove('hidden');

  // Update personal best
  if (sr.score > sr.bestScore) {
    sr.bestScore = sr.score;
    localStorage.setItem(CONFIG.STORAGE_SPEED_BEST, sr.score.toString());
  }

  document.getElementById('speedFinalScore').textContent = sr.score;
  document.getElementById('speedFinalTotal').textContent = sr.total;
  document.getElementById('speedFinalAccuracy').textContent = sr.total > 0 ? Math.round(sr.score / sr.total * 100) + '%' : '0%';
  document.getElementById('speedBestScore').textContent = sr.bestScore;

  // Show new record badge
  var newRecord = document.getElementById('speedNewRecord');
  if (sr.score >= sr.bestScore && sr.score > 0) {
    newRecord.classList.remove('hidden');
  } else {
    newRecord.classList.add('hidden');
  }

  // Results list
  document.getElementById('speedResultsList').innerHTML = sr.results.map(function(r) {
    return '<div class="result-item">' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<strong>' + App.escapeHtml(r.word) + '</strong>' +
      (r.answer && !r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};
