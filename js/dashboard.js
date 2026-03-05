// UIL Spelling & Vocabulary Practice - Progress Dashboard
'use strict';

App.setupDashboard = function() {
  // Refresh dashboard whenever tab is shown
  document.querySelector('[data-tab="dashboard"]').addEventListener('click', function() {
    App.refreshDashboard();
  });
};

App.refreshDashboard = function() {
  var words = App.state.words;
  var total = words.length;

  // Status counts
  var studied = 0, mastered = 0, missed = 0, unstudied = 0;
  words.forEach(function(w) {
    var status = App.getStatus(w.word);
    if (status === 'mastered') mastered++;
    else if (status === 'studied') studied++;
    if (!status) unstudied++;
    if (App.getMissCount(w.word) > 0) missed++;
  });

  // Overall mastery %
  var masteryPct = total > 0 ? Math.round((studied + mastered) / total * 100) : 0;
  document.getElementById('dashMasteryPct').textContent = masteryPct + '%';
  document.getElementById('dashMasteryBar').style.width = masteryPct + '%';
  document.getElementById('dashMasteryLabel').textContent = (studied + mastered) + ' of ' + total + ' words studied';

  // Status breakdown
  document.getElementById('dashStudied').textContent = studied;
  document.getElementById('dashMastered').textContent = mastered;
  document.getElementById('dashUnstudied').textContent = unstudied;
  document.getElementById('dashMissed').textContent = missed;

  // Accuracy stats
  var totalAttempts = 0, totalCorrect = 0, wordsAttempted = 0;
  for (var key in App.state.accuracy) {
    var acc = App.state.accuracy[key];
    totalAttempts += acc.correct + acc.incorrect;
    totalCorrect += acc.correct;
    wordsAttempted++;
  }
  var accuracyPct = totalAttempts > 0 ? Math.round(totalCorrect / totalAttempts * 100) : 0;
  document.getElementById('dashAccuracyPct').textContent = accuracyPct + '%';
  document.getElementById('dashAccuracyBar').style.width = accuracyPct + '%';
  document.getElementById('dashAttempted').textContent = wordsAttempted;
  document.getElementById('dashTotalAttempts').textContent = totalAttempts;

  // Weakest words (highest error rate, minimum 2 attempts)
  var weakest = [];
  for (var key in App.state.accuracy) {
    var acc = App.state.accuracy[key];
    var attempts = acc.correct + acc.incorrect;
    if (attempts >= 2) {
      weakest.push({
        word: key,
        errorRate: acc.incorrect / attempts,
        attempts: attempts,
        incorrect: acc.incorrect
      });
    }
  }
  weakest.sort(function(a, b) { return b.errorRate - a.errorRate; });
  var topWeak = weakest.slice(0, 10);

  var weakestEl = document.getElementById('dashWeakest');
  if (topWeak.length === 0) {
    weakestEl.innerHTML = '<div class="dash-empty">Practice some words first to see your weakest areas.</div>';
  } else {
    weakestEl.innerHTML = topWeak.map(function(w) {
      var pct = Math.round(w.errorRate * 100);
      return '<div class="dash-weak-item">' +
        '<span class="dash-weak-word">' + App.escapeHtml(w.word) + '</span>' +
        '<div class="dash-weak-bar-wrap"><div class="dash-weak-bar" style="width:' + pct + '%"></div></div>' +
        '<span class="dash-weak-pct">' + pct + '% errors</span>' +
        '</div>';
    }).join('');
  }

  // Study recommendations
  var recsEl = document.getElementById('dashRecommendations');
  var recs = [];
  if (unstudied > 0) {
    recs.push({ icon: '1', text: unstudied + ' words not yet studied. Use Study Cards with "Not Yet Studied" filter.' });
  }
  if (weakest.length > 0) {
    recs.push({ icon: '2', text: weakest.length + ' word' + (weakest.length === 1 ? '' : 's') + ' with high error rates. Practice with "Needs Review" filter.' });
  }
  if (missed > 0) {
    recs.push({ icon: '3', text: missed + ' words missed at least once. Use "Missed Words" filter for targeted review.' });
  }

  // Check for accented words not yet practiced
  var accentedWords = App.getAccentedWords();
  var accentedPracticed = accentedWords.filter(function(w) {
    return App.state.accuracy[w.word.toLowerCase()];
  });
  if (accentedPracticed.length < accentedWords.length) {
    recs.push({ icon: '4', text: (accentedWords.length - accentedPracticed.length) + ' accented words need practice. Try Accent Mark Drills.' });
  }

  if (recs.length === 0) {
    recs.push({ icon: '\u2713', text: 'Great job! Keep practicing with Speed Rounds to build automaticity.' });
  }

  recsEl.innerHTML = recs.map(function(r) {
    return '<div class="dash-rec-item"><span class="dash-rec-icon">' + r.icon + '</span><span>' + r.text + '</span></div>';
  }).join('');
};
