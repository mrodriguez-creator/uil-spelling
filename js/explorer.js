// UIL Spelling & Vocabulary Practice - Word Explorer Tab
'use strict';

App.setupExplorer = function() {
  var letters = [];
  var seen = {};
  App.state.words.forEach(function(w) {
    var first = w.word[0].toUpperCase();
    var letter = /[A-Z]/.test(first) ? first : '#';
    if (!seen[letter]) { seen[letter] = true; letters.push(letter); }
  });
  letters.sort();

  var letterSelect = document.getElementById('letterFilter');
  letters.forEach(function(l) {
    var opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l === '#' ? 'Special Characters' : l;
    letterSelect.appendChild(opt);
  });

  document.getElementById('searchInput').addEventListener('input', App.filterWords);
  document.getElementById('letterFilter').addEventListener('change', App.filterWords);
  document.getElementById('vocabFilter').addEventListener('change', App.filterWords);
  document.getElementById('statusFilter').addEventListener('change', App.filterWords);

  document.getElementById('modalClose').addEventListener('click', App.closeModal);
  document.getElementById('wordModal').addEventListener('click', function(e) {
    if (e.target.id === 'wordModal') App.closeModal();
  });

  App.renderWordGrid();
};

App.filterWords = function() {
  var search = document.getElementById('searchInput').value.toLowerCase();
  var letter = document.getElementById('letterFilter').value;
  var vocabFilter = document.getElementById('vocabFilter').value;
  var statusFilter = document.getElementById('statusFilter').value;

  App.state.filteredWords = App.state.words.filter(function(w) {
    if (search && !w.word.toLowerCase().includes(search) &&
        !(w.alt && w.alt.toLowerCase().includes(search))) return false;

    if (letter) {
      var first = w.word[0].toUpperCase();
      var wordLetter = /[A-Z]/.test(first) ? first : '#';
      if (wordLetter !== letter) return false;
    }

    if (vocabFilter === 'vocab' && !w.vocab) return false;
    if (vocabFilter === 'regular' && w.vocab) return false;

    if (statusFilter === 'unstudied' && App.getStatus(w.word)) return false;
    if (statusFilter === 'studied' && App.getStatus(w.word) !== 'studied') return false;
    if (statusFilter === 'mastered' && App.getStatus(w.word) !== 'mastered') return false;

    return true;
  });

  App.renderWordGrid();
};

App.renderWordGrid = function() {
  var grid = document.getElementById('wordGrid');
  var count = document.getElementById('wordCount');
  count.textContent = 'Showing ' + App.state.filteredWords.length + ' of ' + App.state.words.length + ' words';

  var visible = App.state.filteredWords.slice(0, CONFIG.EXPLORER_MAX_VISIBLE);
  grid.innerHTML = visible.map(function(w) {
    var status = App.getStatus(w.word);
    var statusIcon = status === 'mastered' ? '&#9733;' : status === 'studied' ? '&#10003;' : '';
    var classes = ['word-card'];
    if (w.vocab) classes.push('vocab');
    if (status) classes.push(status);

    return '<div class="' + classes.join(' ') + '" data-id="' + w.id + '">' +
      '<span class="word-number">' + w.number + '.</span>' +
      '<span class="word-text">' + App.escapeHtml(w.word) + '</span>' +
      '<span class="word-status">' + statusIcon + '</span>' +
      '</div>';
  }).join('');

  if (App.state.filteredWords.length > CONFIG.EXPLORER_MAX_VISIBLE) {
    grid.innerHTML += '<div class="word-card" style="grid-column: 1/-1; text-align:center; color: var(--text-light);">' +
      'Showing first ' + CONFIG.EXPLORER_MAX_VISIBLE + ' of ' + App.state.filteredWords.length + ' results. Use search or filters to narrow down.</div>';
  }

  grid.querySelectorAll('.word-card[data-id]').forEach(function(card) {
    card.addEventListener('click', function() {
      App.openModal(App.state.words[parseInt(card.dataset.id)]);
    });
  });
};

App.openModal = function(wordObj) {
  var modal = document.getElementById('wordModal');
  document.getElementById('modalWord').textContent = wordObj.word;
  document.getElementById('modalAlt').textContent = wordObj.alt ? 'Also: ' + wordObj.alt : '';
  var vocabBadge = document.getElementById('modalVocab');
  wordObj.vocab ? vocabBadge.classList.remove('hidden') : vocabBadge.classList.add('hidden');

  var defEl = document.getElementById('modalDef');
  var cached = App.findDefinition(wordObj);
  if (cached) {
    defEl.textContent = cached;
  } else {
    defEl.textContent = 'Loading definition...';
    App.fetchDefinition(wordObj.word).then(function(def) {
      defEl.textContent = def;
    });
  }

  var analysis = analyzeWord(wordObj.word);
  var analysisEl = document.getElementById('modalAnalysis');
  var analysisHtml = '';
  if (analysis.prefixes.length > 0) {
    analysis.prefixes.forEach(function(p) {
      analysisHtml += '<div class="morph-tag"><strong>' + App.escapeHtml(p.prefix) + '</strong> ' + App.escapeHtml(p.meaning) + '</div>';
    });
  }
  if (analysis.suffixes.length > 0) {
    analysis.suffixes.forEach(function(s) {
      analysisHtml += '<div class="morph-tag"><strong>' + App.escapeHtml(s.suffix) + '</strong> ' + App.escapeHtml(s.meaning) + '</div>';
    });
  }
  if (!analysisHtml) {
    analysisHtml = '<span style="color:var(--text-light);font-size:13px;">No common prefixes or suffixes detected. Study this word as a whole.</span>';
  }
  analysisEl.innerHTML = analysisHtml;

  var tipsEl = document.getElementById('modalTips');
  tipsEl.innerHTML = App.generateSpellingTips(wordObj);

  var markStudied = document.getElementById('modalMarkStudied');
  var markMastered = document.getElementById('modalMarkMastered');
  var status = App.getStatus(wordObj.word);

  markStudied.textContent = status === 'studied' ? 'Studied \u2713' : 'Mark as Studied';
  markMastered.textContent = status === 'mastered' ? 'Mastered \u2605' : 'Mark as Mastered';

  markStudied.onclick = function() {
    App.setStatus(wordObj.word, 'studied');
    markStudied.textContent = 'Studied \u2713';
    App.renderWordGrid();
  };
  markMastered.onclick = function() {
    App.setStatus(wordObj.word, 'mastered');
    markMastered.textContent = 'Mastered \u2605';
    App.renderWordGrid();
  };

  document.getElementById('modalSpeak').onclick = function() { App.speak(wordObj.word); };

  modal.classList.add('active');
};

App.closeModal = function() {
  document.getElementById('wordModal').classList.remove('active');
};

// ==================== SPELLING TIPS ====================
App.generateSpellingTips = function(wordObj) {
  var word = wordObj.word;
  var tips = [];

  var difficult = App.findDifficultParts(word);
  var breakdown = '';
  for (var i = 0; i < word.length; i++) {
    if (difficult.includes(i)) {
      breakdown += '<span class="highlight">' + App.escapeHtml(word[i]) + '</span>';
    } else {
      breakdown += App.escapeHtml(word[i]);
    }
  }
  tips.push('<div class="letter-breakdown">' + breakdown + '</div>');

  var syllables = App.countSyllables(word);
  if (syllables > 1) {
    tips.push('<div class="tip-item"><strong>' + syllables + ' syllables</strong> - Break it down: try spelling one syllable at a time.</div>');
  }

  if (word.includes('ei') || word.includes('ie')) {
    tips.push('<div class="tip-item"><strong>IE/EI pattern:</strong> Remember "I before E except after C" (with exceptions).</div>');
  }
  if (/([a-z])\1/.test(word.toLowerCase())) {
    var match = word.toLowerCase().match(/([a-z])\1/);
    tips.push('<div class="tip-item"><strong>Double letter:</strong> Note the double "' + match[0] + '" in this word.</div>');
  }
  if (word.includes('-')) {
    tips.push('<div class="tip-item"><strong>Hyphenated word:</strong> Don\'t forget the hyphen(s)!</div>');
  }
  if (word.includes("'")) {
    tips.push('<div class="tip-item"><strong>Apostrophe:</strong> This word contains an apostrophe - pay attention to its placement.</div>');
  }
  if (/[A-Z]/.test(word[0]) && word !== word.toUpperCase()) {
    tips.push('<div class="tip-item"><strong>Capitalization:</strong> This word starts with a capital letter (proper noun/adjective).</div>');
  }
  if (/[àáâãäåæçèéêëìíîïñòóôõöùúûüý]/i.test(word)) {
    tips.push('<div class="tip-item"><strong>Accent marks:</strong> This word has accent marks from its original language. These are required in UIL competition!</div>');
  }
  if (wordObj.alt) {
    tips.push('<div class="tip-item"><strong>Alternate spelling:</strong> "' + wordObj.alt + '" is also accepted.</div>');
  }

  return tips.join('');
};

App.findDifficultParts = function(word) {
  var indices = [];
  var lower = word.toLowerCase();
  var patterns = ['ph', 'gh', 'ough', 'tion', 'sion', 'eous', 'ious', 'ei', 'ie', 'oe', 'ae'];
  for (var p = 0; p < patterns.length; p++) {
    var idx = lower.indexOf(patterns[p]);
    while (idx !== -1) {
      for (var i = idx; i < idx + patterns[p].length; i++) indices.push(i);
      idx = lower.indexOf(patterns[p], idx + 1);
    }
  }
  for (var i = 0; i < lower.length - 1; i++) {
    if (lower[i] === lower[i + 1] && /[a-z]/.test(lower[i])) {
      indices.push(i, i + 1);
    }
  }
  return indices.filter(function(v, i, a) { return a.indexOf(v) === i; });
};
