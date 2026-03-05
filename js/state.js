// UIL Spelling & Vocabulary Practice - Shared State & Utilities
'use strict';

var App = {};

// ==================== SHARED STATE ====================
App.state = {
  words: [],
  filteredWords: [],
  studied: JSON.parse(localStorage.getItem(CONFIG.STORAGE_STUDIED) || '{}'),
  currentCard: 0,
  studyDeck: [],
  practiceWords: [],
  practiceIndex: 0,
  practiceScore: 0,
  practiceResults: [],
  quizType: null,
  quizQuestions: [],
  quizIndex: 0,
  quizScore: 0,
  quizTimer: null,
  quizTimeLeft: CONFIG.QUIZ_TIME_SECONDS,
  quizResults: [],
  fullTestMode: false,
  missed: JSON.parse(localStorage.getItem(CONFIG.STORAGE_MISSED) || '{}'),
  definitionCache: JSON.parse(localStorage.getItem(CONFIG.STORAGE_DEFS) || '{}'),
  audioManifest: typeof AUDIO_MANIFEST !== 'undefined' ? AUDIO_MANIFEST : null,
  currentAudio: null,
  audioTest: {
    words: [],
    index: 0,
    score: 0,
    results: [],
    wordCount: CONFIG.AUDIO_TEST_DEFAULT,
    isPlaying: false,
    currentSequence: null
  }
};

// ==================== PROGRESS ====================
App.saveStudied = function() {
  localStorage.setItem(CONFIG.STORAGE_STUDIED, JSON.stringify(App.state.studied));
  App.updateProgress();
};

App.updateProgress = function() {
  var studied = Object.keys(App.state.studied).length;
  document.getElementById('progressCount').textContent = studied;
  document.getElementById('totalWords').textContent = App.state.words.length;
};

App.getStatus = function(word) {
  return App.state.studied[word.toLowerCase()] || null;
};

App.setStatus = function(word, status) {
  App.state.studied[word.toLowerCase()] = status;
  App.saveStudied();
};

// ==================== MISSED WORDS ====================
App.recordMiss = function(word, mode) {
  var key = word.toLowerCase();
  if (!App.state.missed[key]) {
    App.state.missed[key] = { count: 0, lastMissed: null, modes: [] };
  }
  App.state.missed[key].count++;
  App.state.missed[key].lastMissed = Date.now();
  if (mode && App.state.missed[key].modes.indexOf(mode) === -1) {
    App.state.missed[key].modes.push(mode);
  }
  localStorage.setItem(CONFIG.STORAGE_MISSED, JSON.stringify(App.state.missed));
};

App.getMissCount = function(word) {
  var entry = App.state.missed[word.toLowerCase()];
  return entry ? entry.count : 0;
};

App.getMissedWords = function() {
  return Object.keys(App.state.missed);
};

// ==================== DEFINITIONS ====================
App.findDefinition = function(wordObj) {
  var lower = wordObj.word.toLowerCase();
  // Check embedded definitions first (fastest)
  if (typeof DEFINITIONS !== 'undefined' && DEFINITIONS[lower]) {
    return DEFINITIONS[lower];
  }
  // Then practice tests
  for (var key in PRACTICE_TESTS) {
    var meet = PRACTICE_TESTS[key];
    var found = meet.words.find(function(w) {
      return w.word.toLowerCase() === lower;
    });
    if (found) return found.def;
  }
  // Then localStorage cache (from previous API fetches)
  return App.state.definitionCache[lower] || null;
};

App.fetchDefinition = async function(word) {
  var cleanWord = word.replace(/[^a-zA-Z-\s]/g, '').trim();
  if (!cleanWord) return CONFIG.DEF_NOT_AVAILABLE_TEXT;

  try {
    var res = await fetch(CONFIG.DEF_API_URL + encodeURIComponent(cleanWord));
    if (!res.ok) return CONFIG.DEF_FALLBACK_TEXT;
    var data = await res.json();
    if (data && data[0] && data[0].meanings) {
      var defs = data[0].meanings.map(function(m) {
        return '(' + m.partOfSpeech + ') ' + m.definitions[0].definition;
      }).join(' | ');
      App.state.definitionCache[word.toLowerCase()] = defs;
      if (Object.keys(App.state.definitionCache).length % CONFIG.DEF_CACHE_SAVE_INTERVAL === 0) {
        localStorage.setItem(CONFIG.STORAGE_DEFS, JSON.stringify(App.state.definitionCache));
      }
      return defs;
    }
  } catch (e) { /* silent */ }
  return CONFIG.DEF_FALLBACK_TEXT;
};

// ==================== SPELLING CHECK ====================
App.isSpellingCorrect = function(answer, wordObj) {
  var clean = function(s) {
    return s.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, "'");
  };

  if (clean(answer) === clean(wordObj.word)) return true;
  if (wordObj.alt && clean(answer) === clean(wordObj.alt)) return true;
  return false;
};

// ==================== AUDIO UTILITIES ====================
App.speak = function(text) {
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }

  if (App.state.audioManifest && App.state.audioManifest[text]) {
    var audio = new Audio('audio/words/' + App.state.audioManifest[text]);
    audio.playbackRate = 1.0;
    App.state.currentAudio = audio;
    audio.play().catch(function() {
      App.speakTTS(text);
    });
    return;
  }

  App.speakTTS(text);
};

App.speakTTS = function(text) {
  if ('speechSynthesis' in window) {
    var u = new SpeechSynthesisUtterance(text);
    u.rate = CONFIG.AUDIO_TTS_RATE_NORMAL;
    u.pitch = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
};

App.speakTTSAsync = function(text) {
  return new Promise(function(resolve) {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = CONFIG.AUDIO_TTS_RATE;
    u.pitch = 1;
    var timeout = setTimeout(function() { resolve(); }, CONFIG.AUDIO_TTS_TIMEOUT);
    u.onend = function() { clearTimeout(timeout); resolve(); };
    u.onerror = function() { clearTimeout(timeout); resolve(); };
    speechSynthesis.speak(u);
  });
};

App.playWordAudio = function(word) {
  return new Promise(function(resolve) {
    if (App.state.currentAudio) {
      App.state.currentAudio.pause();
      App.state.currentAudio = null;
    }

    if (App.state.audioManifest && App.state.audioManifest[word]) {
      var audio = new Audio('audio/words/' + App.state.audioManifest[word]);
      App.state.currentAudio = audio;
      audio.onended = function() {
        App.state.currentAudio = null;
        resolve();
      };
      audio.onerror = function() {
        App.state.currentAudio = null;
        App.speakTTSAsync(word).then(resolve);
      };
      audio.play().catch(function() {
        App.state.currentAudio = null;
        App.speakTTSAsync(word).then(resolve);
      });
    } else {
      App.speakTTSAsync(word).then(resolve);
    }
  });
};

App.delay = function(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
};

// ==================== GENERAL UTILITIES ====================
App.shuffleArray = function(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
};

App.escapeHtml = function(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

App.countSyllables = function(word) {
  var clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  var count = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
                    .replace(/^y/, '')
                    .match(/[aeiouy]{1,2}/g);
  return count ? count.length : 1;
};
