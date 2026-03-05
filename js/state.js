// UIL Spelling & Vocabulary Practice - Shared State & Utilities
'use strict';

var App = {};

// ==================== SHARED STATE ====================
App.state = {
  words: [],
  filteredWords: [],
  studied: JSON.parse(localStorage.getItem('uil-studied') || '{}'),
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
  quizTimeLeft: 900,
  definitionCache: JSON.parse(localStorage.getItem('uil-defs') || '{}'),
  audioManifest: null,
  currentAudio: null,
  // Audio Test state
  audioTest: {
    words: [],
    index: 0,
    score: 0,
    results: [],
    wordCount: 35,
    isPlaying: false,
    currentSequence: null
  }
};

// ==================== PROGRESS ====================
App.saveStudied = function() {
  localStorage.setItem('uil-studied', JSON.stringify(App.state.studied));
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

// ==================== DEFINITIONS ====================
App.findDefinition = function(wordObj) {
  // Check practice test data
  for (var key in PRACTICE_TESTS) {
    var meet = PRACTICE_TESTS[key];
    var found = meet.words.find(function(w) {
      return w.word.toLowerCase() === wordObj.word.toLowerCase();
    });
    if (found) return found.def;
  }
  // Check cache
  return App.state.definitionCache[wordObj.word.toLowerCase()] || null;
};

App.fetchDefinition = async function(word) {
  var cleanWord = word.replace(/[^a-zA-Z-\s]/g, '').trim();
  if (!cleanWord) return 'Definition not available for this term.';

  try {
    var res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(cleanWord));
    if (!res.ok) return 'Definition not available. Check a dictionary for this word.';
    var data = await res.json();
    if (data && data[0] && data[0].meanings) {
      var defs = data[0].meanings.map(function(m) {
        return '(' + m.partOfSpeech + ') ' + m.definitions[0].definition;
      }).join(' | ');
      App.state.definitionCache[word.toLowerCase()] = defs;
      if (Object.keys(App.state.definitionCache).length % 10 === 0) {
        localStorage.setItem('uil-defs', JSON.stringify(App.state.definitionCache));
      }
      return defs;
    }
  } catch (e) { /* silent */ }
  return 'Definition not available. Check a dictionary for this word.';
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
    u.rate = 0.8;
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
    u.rate = 0.85;
    u.pitch = 1;
    var timeout = setTimeout(function() { resolve(); }, 15000);
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
