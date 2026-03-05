// UIL Spelling & Vocabulary Practice - Study Cards Tab
'use strict';

App.setupStudyCards = function() {
  document.getElementById('studyFilter').addEventListener('change', App.buildStudyDeck);
  document.getElementById('shuffleCards').addEventListener('click', function() {
    App.shuffleArray(App.state.studyDeck);
    App.state.currentCard = 0;
    App.showCard();
  });
  document.getElementById('flashcard').addEventListener('click', function() {
    document.getElementById('flashcard').classList.toggle('flipped');
  });
  document.getElementById('prevCard').addEventListener('click', function() {
    if (App.state.currentCard > 0) {
      App.state.currentCard--;
      App.showCard();
    }
  });
  document.getElementById('nextCard').addEventListener('click', function() {
    if (App.state.currentCard < App.state.studyDeck.length - 1) {
      App.state.currentCard++;
      App.showCard();
    }
  });
  document.getElementById('markStudiedCard').addEventListener('click', function() {
    if (App.state.studyDeck.length > 0) {
      var w = App.state.studyDeck[App.state.currentCard];
      App.setStatus(w.word, 'studied');
      document.getElementById('markStudiedCard').textContent = 'Studied \u2713';
    }
  });
  document.getElementById('speakCard').addEventListener('click', function() {
    if (App.state.studyDeck.length > 0) {
      App.speak(App.state.studyDeck[App.state.currentCard].word);
    }
  });

  App.buildStudyDeck();
  App.setupSwipeNavigation();
};

App.buildStudyDeck = function() {
  var filter = document.getElementById('studyFilter').value;
  switch (filter) {
    case 'vocab': App.state.studyDeck = App.state.words.filter(function(w) { return w.vocab; }); break;
    case 'unstudied': App.state.studyDeck = App.state.words.filter(function(w) { return !App.getStatus(w.word); }); break;
    case 'difficult': App.state.studyDeck = App.state.words.filter(function(w) { return w.word.replace(/\s/g,'').length >= CONFIG.STUDY_MIN_DIFFICULT_LENGTH; }); break;
    case 'missed': App.state.studyDeck = App.state.words.filter(function(w) { return App.getMissCount(w.word) > 0; }); break;
    case 'needsreview': App.state.studyDeck = App.state.words.filter(function(w) {
      var acc = App.state.accuracy[w.word.toLowerCase()];
      if (!acc) return false;
      var total = acc.correct + acc.incorrect;
      return total > 0 && (acc.incorrect / total) >= 0.5;
    }); break;
    default: App.state.studyDeck = App.state.words.slice();
  }
  App.state.currentCard = 0;
  App.showCard();
};

App.showCard = function() {
  var card = document.getElementById('flashcard');
  card.classList.remove('flipped');

  document.getElementById('cardIndex').textContent = App.state.studyDeck.length > 0 ? App.state.currentCard + 1 : 0;
  document.getElementById('cardTotal').textContent = App.state.studyDeck.length;

  if (App.state.studyDeck.length === 0) {
    document.getElementById('flashcardWord').textContent = 'No words match filter';
    document.getElementById('flashcardWordBack').textContent = '';
    document.getElementById('flashcardDetails').innerHTML = '';
    return;
  }

  var w = App.state.studyDeck[App.state.currentCard];
  document.getElementById('flashcardWord').textContent = w.word;
  document.getElementById('flashcardWordBack').textContent = w.word;

  var status = App.getStatus(w.word);
  document.getElementById('markStudiedCard').textContent = status ? (status === 'mastered' ? 'Mastered \u2605' : 'Studied \u2713') : 'Mark Studied';

  var analysis = analyzeWord(w.word);
  var def = App.findDefinition(w);

  App.buildCardDetails(w, def, analysis);

  if (!def) {
    App.fetchDefinition(w.word).then(function(fetchedDef) {
      if (App.state.studyDeck.length > 0 && App.state.studyDeck[App.state.currentCard] === w && fetchedDef) {
        App.buildCardDetails(w, fetchedDef, analysis);
      }
    });
  }
};

App.buildCardDetails = function(w, def, analysis) {
  var details = '';

  if (w.alt) {
    details += '<div class="detail-row"><div class="detail-label">Also spelled</div>' + App.escapeHtml(w.alt) + '</div>';
  }
  if (w.vocab) {
    details += '<div class="detail-row"><div class="detail-label">Type</div>Vocabulary Study Word</div>';
  }
  if (def) {
    details += '<div class="detail-row"><div class="detail-label">Definition</div>' + App.escapeHtml(def) + '</div>';
  } else {
    details += '<div class="detail-row"><div class="detail-label">Definition</div><em style="color:var(--text-light)">Loading...</em></div>';
  }
  if (analysis.prefixes.length > 0 || analysis.suffixes.length > 0) {
    var parts = '';
    analysis.prefixes.forEach(function(p) { parts += '<strong>' + App.escapeHtml(p.prefix) + '</strong> (' + App.escapeHtml(p.meaning) + ') '; });
    analysis.suffixes.forEach(function(s) { parts += '<strong>' + App.escapeHtml(s.suffix) + '</strong> (' + App.escapeHtml(s.meaning) + ') '; });
    details += '<div class="detail-row"><div class="detail-label">Word Parts</div>' + parts + '</div>';
  }
  var origin = App.getWordOrigin(w.word);
  if (origin) {
    var oc = App.getOriginColor(origin);
    details += '<div class="detail-row"><div class="detail-label">Origin</div><span class="origin-badge" style="background:' + oc.bg + ';color:' + oc.color + ';border-color:' + oc.border + '">' + App.escapeHtml(origin) + '</span></div>';
  }
  details += '<div class="detail-row"><div class="detail-label">Letters</div>' + w.word.length + ' characters, ~' + App.countSyllables(w.word) + ' syllable(s)</div>';

  document.getElementById('flashcardDetails').innerHTML = details;
};

// ==================== SWIPE NAVIGATION ====================
App.setupSwipeNavigation = function() {
  var container = document.querySelector('.flashcard-container');
  if (!container || !('ontouchstart' in window)) return;

  var startX = 0, startY = 0, startTime = 0;

  container.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    container.classList.remove('swipe-left', 'swipe-right');
  }, { passive: true });

  container.addEventListener('touchend', function(e) {
    var deltaX = e.changedTouches[0].clientX - startX;
    var deltaY = e.changedTouches[0].clientY - startY;
    var elapsed = Date.now() - startTime;

    if (elapsed > 300 || Math.abs(deltaX) < 50) return;

    // Only count near-horizontal swipes
    var angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
    if (angle > 30 && angle < 150) return;

    if (deltaX < 0) {
      container.classList.add('swipe-left');
      document.getElementById('nextCard').click();
    } else {
      container.classList.add('swipe-right');
      document.getElementById('prevCard').click();
    }
    setTimeout(function() {
      container.classList.remove('swipe-left', 'swipe-right');
    }, 150);
  }, { passive: true });

  // Update hint text for touch users
  var hints = document.querySelectorAll('.flashcard-hint');
  if (hints.length > 0) hints[0].textContent = 'Tap to reveal \u00B7 Swipe to navigate';
};
