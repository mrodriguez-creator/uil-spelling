// UIL Spelling & Vocabulary Practice - Accent Marks & Difficult Patterns
'use strict';

// ==================== ACCENT MARK MAPPING ====================
// Words in WORD_LIST are stored without accents; this maps them to correct accented forms.
// In UIL competition, missing or wrong accent marks = misspelled.
var ACCENT_MAP = {
  "arriere-pensee": "arrière-pensée",
  "charge d'affaires": "chargé d'affaires",
  "chef-d'oeuvre": "chef-d'œuvre",
  "consomme": "consommé",
  "coup de grace": "coup de grâce",
  "decoupage": "découpage",
  "emigre": "émigré",
  "entree": "entrée",
  "expose": "exposé",
  "folie a deux": "folie à deux",
  "hors d'oeuvre": "hors d'œuvre",
  "idee fixe": "idée fixe",
  "jeunesse doree": "jeunesse dorée",
  "lese majesty": "lèse-majesté",
  "maitre d'hotel": "maître d'hôtel",
  "saute": "sauté",
  "soupcon": "soupçon",
  "tete-a-tete": "tête-à-tête"
};

// ==================== ACCENT MARK DETECTION ====================
App.hasAccentMark = function(word) {
  return /[àáâãäåæçèéêëìíîïðñòóôõöùúûüýþÿœ]/i.test(word);
};

// Get the accented form for a word (if it has one)
App.getAccentedForm = function(word) {
  return ACCENT_MAP[word.toLowerCase()] || null;
};

App.getAccentedWords = function() {
  return App.state.words.filter(function(w) {
    return App.hasAccentMark(w.word) || ACCENT_MAP[w.word.toLowerCase()];
  });
};

// ==================== ACCENT INPUT HELPER ====================
App.accentChars = [
  { char: 'é', name: 'acute e' },
  { char: 'è', name: 'grave e' },
  { char: 'ê', name: 'circumflex e' },
  { char: 'ë', name: 'diaeresis e' },
  { char: 'á', name: 'acute a' },
  { char: 'à', name: 'grave a' },
  { char: 'â', name: 'circumflex a' },
  { char: 'ä', name: 'diaeresis a' },
  { char: 'ç', name: 'cedilla' },
  { char: 'ñ', name: 'tilde n' },
  { char: 'ö', name: 'diaeresis o' },
  { char: 'ô', name: 'circumflex o' },
  { char: 'ü', name: 'diaeresis u' },
  { char: 'û', name: 'circumflex u' },
  { char: 'î', name: 'circumflex i' },
  { char: 'ï', name: 'diaeresis i' },
  { char: 'œ', name: 'oe ligature' }
];

App.insertAccentChar = function(inputId, char) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var start = input.selectionStart;
  var end = input.selectionEnd;
  var val = input.value;
  input.value = val.substring(0, start) + char + val.substring(end);
  input.selectionStart = input.selectionEnd = start + char.length;
  input.focus();
};

App.buildAccentHelper = function(inputId) {
  var html = '<div class="accent-helper">';
  html += '<span class="accent-helper-label">Insert accent:</span>';
  App.accentChars.forEach(function(a) {
    html += '<button type="button" class="accent-btn" data-char="' + a.char + '" title="' + a.name + '">' + a.char + '</button>';
  });
  html += '</div>';
  return html;
};

App.attachAccentButtons = function(containerId, inputId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.accent-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      App.insertAccentChar(inputId, btn.dataset.char);
    });
  });
};

// ==================== SPELLING PATTERN CLASSIFICATION ====================
var SPELLING_PATTERNS = {
  'Silent Letters': {
    desc: 'Words with silent letters (k, g, p, b, w, h, l, t)',
    test: function(word) {
      var w = word.toLowerCase();
      return /^kn|^gn|^pn|^ps|^wr|^wh|mb$|mn$|bt$|lk$|stl|stle|ght/.test(w);
    }
  },
  'Double Consonants': {
    desc: 'Words with doubled consonants that are easy to miss',
    test: function(word) {
      var w = word.toLowerCase().replace(/[^a-z]/g, '');
      return /([bcdfgklmnprst])\1/.test(w) && w.length >= 6;
    }
  },
  '-ible vs -able': {
    desc: 'Words ending in -ible or -able',
    test: function(word) {
      return /[ai]ble$/i.test(word);
    }
  },
  '-ance vs -ence': {
    desc: 'Words ending in -ance/-ence or -ant/-ent',
    test: function(word) {
      return /[ae]n[ct]e?$/i.test(word) && word.length >= 6;
    }
  },
  '-cede/-ceed/-sede': {
    desc: 'Words with these tricky endings',
    test: function(word) {
      return /[cs]ede$|ceed$/i.test(word);
    }
  },
  'ei/ie Patterns': {
    desc: 'Words with tricky ei or ie combinations',
    test: function(word) {
      return /[^c]ei|cie/i.test(word);
    }
  },
  'ph = f Sound': {
    desc: 'Words using ph for the f sound',
    test: function(word) {
      return /ph/i.test(word);
    }
  },
  'Unusual Vowels': {
    desc: 'Words with unusual vowel combinations (ae, oe, ou, eau)',
    test: function(word) {
      return /ae|oe|eau|eou|iou/i.test(word);
    }
  }
};

App.getWordPatterns = function(word) {
  var patterns = [];
  for (var name in SPELLING_PATTERNS) {
    if (SPELLING_PATTERNS[name].test(word)) {
      patterns.push(name);
    }
  }
  return patterns;
};

App.getWordsByPattern = function(patternName) {
  if (!SPELLING_PATTERNS[patternName]) return [];
  return App.state.words.filter(function(w) {
    return SPELLING_PATTERNS[patternName].test(w.word);
  });
};

// ==================== ACCENT DRILL SETUP ====================
App.setupAccentDrill = function() {
  document.getElementById('accentStart').addEventListener('click', App.startAccentDrill);
  document.getElementById('accentSubmit').addEventListener('click', App.checkAccentAnswer);
  document.getElementById('accentInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.checkAccentAnswer();
  });
  document.getElementById('accentNext').addEventListener('click', App.nextAccentWord);
  document.getElementById('accentRestart').addEventListener('click', function() {
    document.getElementById('accentResults').classList.add('hidden');
    document.getElementById('accentSetup').classList.remove('hidden');
  });

  // Attach accent helper buttons
  App.attachAccentButtons('accentHelperBtns', 'accentInput');

  // Show count of accented words
  var count = App.getAccentedWords().length;
  document.getElementById('accentWordCount').textContent = count;
  if (count === 0) {
    document.getElementById('accentStart').disabled = true;
  }
};

App.startAccentDrill = function() {
  var pool = App.getAccentedWords();
  if (pool.length === 0) {
    alert('No accented words found.');
    return;
  }

  App.weightedShuffle(pool);
  App.state.accentDrill = {
    words: pool,
    index: 0,
    score: 0,
    results: []
  };

  document.getElementById('accentSetup').classList.add('hidden');
  document.getElementById('accentActive').classList.remove('hidden');
  document.getElementById('accentTotal').textContent = pool.length;
  document.getElementById('accentScore').textContent = '0';

  App.showAccentWord();
};

App.showAccentWord = function() {
  var drill = App.state.accentDrill;
  var w = drill.words[drill.index];

  document.getElementById('accentNum').textContent = drill.index + 1;
  document.getElementById('accentProgressBar').style.width =
    (drill.index / drill.words.length * 100) + '%';

  // Show definition but NOT the word itself
  var def = App.findDefinition(w) || 'Spell the word as pronounced.';
  document.getElementById('accentDef').textContent = def;

  // Show the base (unaccented) spelling as a hint
  document.getElementById('accentHint').textContent = 'Base spelling: ' + w.word;

  document.getElementById('accentInput').value = '';
  document.getElementById('accentInput').focus();
  document.getElementById('accentFeedback').classList.add('hidden');
  document.getElementById('accentNext').classList.add('hidden');

  App.speak(w.word);
};

App.checkAccentAnswer = function() {
  var drill = App.state.accentDrill;
  var w = drill.words[drill.index];
  var answer = document.getElementById('accentInput').value.trim();
  if (!answer) return;

  document.getElementById('accentInput').disabled = true;
  document.getElementById('accentSubmit').disabled = true;

  // Get the correct accented form
  var accentedForm = App.getAccentedForm(w.word) || w.word;

  // Strict check: accents MUST match exactly
  var correct = answer.toLowerCase() === accentedForm.toLowerCase();
  var feedback = document.getElementById('accentFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (correct) {
    drill.score++;
    document.getElementById('accentScore').textContent = drill.score;
    feedback.classList.add('correct');
    feedback.innerHTML = '\u2713 Correct! <strong>' + App.escapeHtml(accentedForm) + '</strong>';
  } else {
    feedback.classList.add('incorrect');
    // Check if only accents are wrong
    var answerStripped = answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    var wordStripped = accentedForm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (answerStripped === wordStripped) {
      feedback.innerHTML = '\u2717 Close! The base spelling is right, but the accents are wrong.<br>Correct: <strong>' + App.escapeHtml(accentedForm) + '</strong>';
    } else {
      feedback.innerHTML = '\u2717 Incorrect. Correct spelling: <strong>' + App.escapeHtml(accentedForm) + '</strong>';
    }
    App.recordMiss(w.word, 'accent');
  }
  App.recordAccuracy(w.word, correct);
  drill.results.push({ word: accentedForm, answer: answer, correct: correct });

  document.getElementById('accentNext').classList.remove('hidden');
};

App.nextAccentWord = function() {
  var drill = App.state.accentDrill;
  drill.index++;

  if (drill.index >= drill.words.length) {
    App.endAccentDrill();
    return;
  }

  document.getElementById('accentInput').disabled = false;
  document.getElementById('accentSubmit').disabled = false;
  App.showAccentWord();
};

App.endAccentDrill = function() {
  var drill = App.state.accentDrill;
  document.getElementById('accentActive').classList.add('hidden');
  document.getElementById('accentResults').classList.remove('hidden');

  var pct = drill.words.length > 0 ? Math.round(drill.score / drill.words.length * 100) : 0;
  document.getElementById('accentResultsScore').innerHTML =
    '<div class="score-big">' + drill.score + ' / ' + drill.words.length + '</div>' +
    '<div class="score-pct">' + pct + '% correct</div>';

  document.getElementById('accentResultsList').innerHTML = drill.results.map(function(r) {
    return '<div class="result-item">' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<strong>' + App.escapeHtml(r.word) + '</strong>' +
      (r.answer && !r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};

// ==================== PATTERN DRILL SETUP ====================
App.setupPatternDrill = function() {
  // Build pattern selector
  var selector = document.getElementById('patternSelector');
  selector.innerHTML = '<option value="">Choose a pattern...</option>';
  for (var name in SPELLING_PATTERNS) {
    var count = App.getWordsByPattern(name).length;
    selector.innerHTML += '<option value="' + App.escapeHtml(name) + '">' + App.escapeHtml(name) + ' (' + count + ' words)</option>';
  }

  document.getElementById('patternStart').addEventListener('click', App.startPatternDrill);
  document.getElementById('patternSubmit').addEventListener('click', App.checkPatternAnswer);
  document.getElementById('patternInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.checkPatternAnswer();
  });
  document.getElementById('patternNext').addEventListener('click', App.nextPatternWord);
  document.getElementById('patternRestart').addEventListener('click', function() {
    document.getElementById('patternResults').classList.add('hidden');
    document.getElementById('patternSetup').classList.remove('hidden');
  });
};

App.startPatternDrill = function() {
  var patternName = document.getElementById('patternSelector').value;
  if (!patternName) {
    alert('Please select a spelling pattern.');
    return;
  }

  var pool = App.getWordsByPattern(patternName);
  if (pool.length === 0) {
    alert('No words found for this pattern.');
    return;
  }

  var count = Math.min(parseInt(document.getElementById('patternCount').value), pool.length);
  App.weightedShuffle(pool);

  App.state.patternDrill = {
    pattern: patternName,
    words: pool.slice(0, count),
    index: 0,
    score: 0,
    results: []
  };

  document.getElementById('patternSetup').classList.add('hidden');
  document.getElementById('patternActive').classList.remove('hidden');
  document.getElementById('patternName').textContent = patternName;
  document.getElementById('patternTotal').textContent = App.state.patternDrill.words.length;
  document.getElementById('patternScore').textContent = '0';

  App.showPatternWord();
};

App.showPatternWord = function() {
  var drill = App.state.patternDrill;
  var w = drill.words[drill.index];

  document.getElementById('patternNum').textContent = drill.index + 1;
  document.getElementById('patternProgressBar').style.width =
    (drill.index / drill.words.length * 100) + '%';

  var def = App.findDefinition(w) || 'Spell the word as pronounced.';
  document.getElementById('patternDef').textContent = def;

  // Show patterns found in this word
  var patterns = App.getWordPatterns(w.word);
  document.getElementById('patternTip').textContent = 'Pattern: ' + patterns.join(', ');

  document.getElementById('patternInput').value = '';
  document.getElementById('patternInput').focus();
  document.getElementById('patternFeedback').classList.add('hidden');
  document.getElementById('patternNext').classList.add('hidden');

  App.speak(w.word);
};

App.checkPatternAnswer = function() {
  var drill = App.state.patternDrill;
  var w = drill.words[drill.index];
  var answer = document.getElementById('patternInput').value.trim();
  if (!answer) return;

  document.getElementById('patternInput').disabled = true;
  document.getElementById('patternSubmit').disabled = true;

  var correct = App.isSpellingCorrect(answer, w);
  var feedback = document.getElementById('patternFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (correct) {
    drill.score++;
    document.getElementById('patternScore').textContent = drill.score;
    feedback.classList.add('correct');
    feedback.innerHTML = '\u2713 Correct!';
  } else {
    feedback.classList.add('incorrect');
    feedback.innerHTML = '\u2717 Incorrect. The correct spelling is: <strong>' + App.escapeHtml(w.word) + '</strong>';
    App.recordMiss(w.word, 'pattern');
  }
  App.recordAccuracy(w.word, correct);
  drill.results.push({ word: w.word, answer: answer, correct: correct });

  document.getElementById('patternNext').classList.remove('hidden');
};

App.nextPatternWord = function() {
  var drill = App.state.patternDrill;
  drill.index++;

  if (drill.index >= drill.words.length) {
    App.endPatternDrill();
    return;
  }

  document.getElementById('patternInput').disabled = false;
  document.getElementById('patternSubmit').disabled = false;
  App.showPatternWord();
};

App.endPatternDrill = function() {
  var drill = App.state.patternDrill;
  document.getElementById('patternActive').classList.add('hidden');
  document.getElementById('patternResults').classList.remove('hidden');

  var pct = drill.words.length > 0 ? Math.round(drill.score / drill.words.length * 100) : 0;
  document.getElementById('patternResultsScore').innerHTML =
    '<div class="score-big">' + drill.score + ' / ' + drill.words.length + '</div>' +
    '<div class="score-pct">' + pct + '% correct</div>';

  document.getElementById('patternResultsList').innerHTML = drill.results.map(function(r) {
    return '<div class="result-item">' +
      '<span class="result-icon ' + (r.correct ? 'result-correct' : 'result-wrong') + '">' + (r.correct ? '\u2713' : '\u2717') + '</span>' +
      '<strong>' + App.escapeHtml(r.word) + '</strong>' +
      (r.answer && !r.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(r.answer) + '</span>' : '') +
      '</div>';
  }).join('');
};
