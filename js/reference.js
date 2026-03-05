// UIL Spelling & Vocabulary Practice - Reference Tab
'use strict';

App.setupReference = function() {
  var prefixGrid = document.getElementById('ref-prefixes');
  prefixGrid.innerHTML = '<div class="ref-grid">' +
    Object.entries(PREFIXES).map(function(entry) {
      return '<div class="ref-item"><strong>' + App.escapeHtml(entry[0]) + '</strong><span>' + App.escapeHtml(entry[1]) + '</span></div>';
    }).join('') + '</div>';

  var suffixGrid = document.getElementById('ref-suffixes');
  suffixGrid.innerHTML = '<div class="ref-grid">' +
    Object.entries(SUFFIXES).map(function(entry) {
      return '<div class="ref-item"><strong>' + App.escapeHtml(entry[0]) + '</strong><span>' + App.escapeHtml(entry[1]) + '</span></div>';
    }).join('') + '</div>';

  document.querySelectorAll('.ref-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ref-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.ref-content').forEach(function(c) { c.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('ref-' + btn.dataset.reftab).classList.add('active');
    });
  });

  document.getElementById('refSearch').addEventListener('input', function(e) {
    var q = e.target.value.toLowerCase();
    document.querySelectorAll('.ref-item').forEach(function(item) {
      var text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // Word Roots tab
  App.setupWordRoots();

  // Confused Pairs tab
  App.setupConfusedPairs();
};

App.setupWordRoots = function() {
  // Render roots grid
  var rootsGrid = document.getElementById('rootsGrid');
  rootsGrid.innerHTML = COMMON_ROOTS.map(function(r) {
    return '<div class="ref-item root-ref-item">' +
      '<strong>' + App.escapeHtml(r.root) + '</strong>' +
      '<span>' + App.escapeHtml(r.meaning) + ' <em>(' + r.origin + ')</em> — ' + r.examples.join(', ') + '</span>' +
      '</div>';
  }).join('');

  // Analyze button
  document.getElementById('rootAnalyzeBtn').addEventListener('click', function() {
    var word = document.getElementById('rootWordInput').value.trim();
    if (word) App.showRootBreakdown(word);
  });
  document.getElementById('rootWordInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var word = e.target.value.trim();
      if (word) App.showRootBreakdown(word);
    }
  });
};

App.showRootBreakdown = function(word) {
  var result = analyzeWord(word);
  var container = document.getElementById('rootBreakdownResult');

  if (!result.prefixes.length && !result.suffixes.length) {
    // Try to find matching roots
    var lower = word.toLowerCase().replace(/[^a-z]/g, '');
    var matchedRoots = COMMON_ROOTS.filter(function(r) {
      return lower.includes(r.root);
    });

    if (matchedRoots.length === 0) {
      container.innerHTML = '<div class="root-breakdown-empty">No prefix, suffix, or common root detected for "<strong>' + App.escapeHtml(word) + '</strong>". Try another word.</div>';
      return;
    }

    container.innerHTML = '<div class="root-segments">' +
      '<div class="root-segment root-segment-root"><div class="segment-label">Word</div><div class="segment-text">' + App.escapeHtml(word) + '</div></div></div>' +
      '<div class="root-matches"><strong>Matching roots:</strong> ' +
      matchedRoots.map(function(r) {
        return '<span class="root-match-tag">' + r.root + ' = ' + r.meaning + ' (' + r.origin + ')</span>';
      }).join(' ') + '</div>';
    return;
  }

  var segments = [];

  if (result.prefixes.length > 0) {
    result.prefixes.forEach(function(p) {
      segments.push('<div class="root-segment root-segment-prefix"><div class="segment-label">Prefix</div><div class="segment-text">' +
        App.escapeHtml(p.prefix) + '</div><div class="segment-meaning">' + App.escapeHtml(p.meaning) + '</div></div>');
    });
    segments.push('<div class="root-connector">+</div>');
  }

  // Show root
  var rootText = result.root || word;
  // Check if root matches any known roots
  var lower = rootText.toLowerCase();
  var matchedRoots = COMMON_ROOTS.filter(function(r) { return lower.includes(r.root); });
  var rootMeaning = matchedRoots.length > 0 ? matchedRoots[0].meaning + ' (' + matchedRoots[0].origin + ')' : '';

  segments.push('<div class="root-segment root-segment-root"><div class="segment-label">Root</div><div class="segment-text">' +
    App.escapeHtml(rootText) + '</div>' + (rootMeaning ? '<div class="segment-meaning">' + App.escapeHtml(rootMeaning) + '</div>' : '') + '</div>');

  if (result.suffixes.length > 0) {
    segments.push('<div class="root-connector">+</div>');
    result.suffixes.forEach(function(s) {
      segments.push('<div class="root-segment root-segment-suffix"><div class="segment-label">Suffix</div><div class="segment-text">' +
        App.escapeHtml(s.suffix) + '</div><div class="segment-meaning">' + App.escapeHtml(s.meaning) + '</div></div>');
    });
  }

  container.innerHTML = '<div class="root-word-title">' + App.escapeHtml(word) + '</div><div class="root-segments">' + segments.join('') + '</div>';
};

App.setupConfusedPairs = function() {
  var grid = document.getElementById('confusedPairsGrid');
  grid.innerHTML = CONFUSED_PAIRS.map(function(pair) {
    var wordsHtml = pair.words.map(function(w) {
      return '<span class="confused-word">' + App.escapeHtml(w) + '</span>';
    }).join('<span class="confused-vs">vs</span>');

    var sentencesHtml = pair.sentences.map(function(s) {
      var filled = s.text.replace('_____', '<strong>' + App.escapeHtml(s.answer) + '</strong>');
      return '<div class="confused-sentence">' + filled + '</div>';
    }).join('');

    return '<div class="confused-pair-card">' +
      '<div class="confused-pair-header">' + wordsHtml + '</div>' +
      '<div class="confused-pair-hint">' + App.escapeHtml(pair.hint) + '</div>' +
      '<div class="confused-pair-examples">' + sentencesHtml + '</div>' +
      '</div>';
  }).join('');
};
