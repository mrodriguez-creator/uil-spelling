// UIL Spelling & Vocabulary Practice - Word Family Groups
'use strict';

// ==================== FAMILY INDEX BUILDER ====================
App.buildFamilyIndex = function() {
  var index = { roots: {}, prefixes: {}, suffixes: {} };
  var words = App.state.words;

  // Build root families from COMMON_ROOTS
  COMMON_ROOTS.forEach(function(r) {
    var matches = [];
    var rootLower = r.root.toLowerCase();
    words.forEach(function(w) {
      var clean = w.word.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length >= rootLower.length + 2 && clean.indexOf(rootLower) !== -1) {
        matches.push(w);
      }
    });
    if (matches.length >= 2) {
      index.roots[r.root] = {
        meaning: r.meaning,
        origin: r.origin,
        words: matches
      };
    }
  });

  // Build prefix families
  var prefixKeys = Object.keys(PREFIXES).sort(function(a, b) { return b.length - a.length; });
  prefixKeys.forEach(function(prefix) {
    var clean = prefix.replace(/-$/, '').toLowerCase();
    if (clean.length < 2) return;
    var matches = [];
    words.forEach(function(w) {
      var wLower = w.word.toLowerCase().replace(/[^a-z]/g, '');
      if (wLower.length > clean.length + 2 && wLower.indexOf(clean) === 0) {
        matches.push(w);
      }
    });
    if (matches.length >= 2) {
      index.prefixes[prefix] = {
        meaning: PREFIXES[prefix],
        words: matches
      };
    }
  });

  // Build suffix families
  var suffixKeys = Object.keys(SUFFIXES).sort(function(a, b) { return b.length - a.length; });
  suffixKeys.forEach(function(suffix) {
    var clean = suffix.replace(/^-/, '').toLowerCase();
    if (clean.length < 2) return;
    var matches = [];
    words.forEach(function(w) {
      var wLower = w.word.toLowerCase().replace(/[^a-z]/g, '');
      if (wLower.length > clean.length + 2 && wLower.indexOf(clean) === wLower.length - clean.length) {
        matches.push(w);
      }
    });
    if (matches.length >= 2) {
      index.suffixes[suffix] = {
        meaning: SUFFIXES[suffix],
        words: matches
      };
    }
  });

  App.state.familyIndex = index;
};

// ==================== SETUP & RENDERING ====================
App.setupWordFamilies = function() {
  App.buildFamilyIndex();

  // Sub-tab switching
  document.querySelectorAll('.family-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.family-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      App.renderFamilyBrowser(btn.dataset.familytype);
    });
  });

  App.renderFamilyBrowser('roots');
};

App.renderFamilyBrowser = function(type) {
  var container = document.getElementById('familyBrowser');
  var data = App.state.familyIndex[type];
  if (!data || Object.keys(data).length === 0) {
    container.innerHTML = '<div class="family-empty">No word families found for this category.</div>';
    return;
  }

  // Sort by word count descending
  var entries = Object.keys(data).map(function(key) {
    return { key: key, info: data[key] };
  }).sort(function(a, b) {
    return b.info.words.length - a.info.words.length;
  });

  container.innerHTML = '<div class="family-grid">' + entries.map(function(entry) {
    var info = entry.info;
    var originHtml = info.origin ? '<div class="family-origin">' + App.escapeHtml(info.origin) + '</div>' : '';
    return '<div class="family-card" data-family-type="' + type + '" data-family-key="' + App.escapeHtml(entry.key) + '">' +
      '<div class="family-card-header">' +
        '<div>' +
          '<div class="family-root">' + App.escapeHtml(entry.key) + '</div>' +
          '<div class="family-meaning">' + App.escapeHtml(info.meaning) + '</div>' +
          originHtml +
        '</div>' +
        '<span class="family-count">' + info.words.length + '</span>' +
      '</div>' +
      '<div class="family-words">' +
        '<div class="family-word-list">' +
          info.words.map(function(w) {
            return '<span class="family-word-item" data-word="' + App.escapeHtml(w.word) + '">' +
              App.highlightMorpheme(w.word, entry.key, type) + '</span>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('') + '</div>';

  // Attach click handlers
  container.querySelectorAll('.family-card').forEach(function(card) {
    card.querySelector('.family-card-header').addEventListener('click', function() {
      card.classList.toggle('expanded');
    });
  });

  container.querySelectorAll('.family-word-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      var wordStr = item.dataset.word;
      var wordObj = App.state.words.find(function(w) { return w.word === wordStr; });
      if (wordObj) App.openModal(wordObj);
    });
  });
};

// ==================== HIGHLIGHT MORPHEME ====================
App.highlightMorpheme = function(word, morpheme, type) {
  var clean = morpheme.replace(/^-|-$/g, '').toLowerCase();
  var lower = word.toLowerCase();
  var idx = -1;

  if (type === 'prefixes') {
    idx = 0;
    if (lower.indexOf(clean) !== 0) return App.escapeHtml(word);
  } else if (type === 'suffixes') {
    idx = lower.length - clean.length;
    if (lower.indexOf(clean, idx) === -1) return App.escapeHtml(word);
  } else {
    idx = lower.indexOf(clean);
    if (idx === -1) return App.escapeHtml(word);
  }

  return App.escapeHtml(word.substring(0, idx)) +
    '<mark class="family-highlight">' + App.escapeHtml(word.substring(idx, idx + clean.length)) + '</mark>' +
    App.escapeHtml(word.substring(idx + clean.length));
};
