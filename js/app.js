// UIL Spelling & Vocabulary Practice - Main Entry Point
'use strict';

(function() {
  function init() {
    // Build word objects from raw data
    App.state.words = WORD_LIST.map(function(w, i) {
      return {
        id: i,
        word: w[0],
        alt: w[1],
        vocab: w[2],
        number: i + 1
      };
    });
    App.state.filteredWords = App.state.words.slice();

    // Load audio manifest
    fetch('audio/manifest.json')
      .then(function(r) { return r.json(); })
      .then(function(data) { App.state.audioManifest = data; })
      .catch(function() { App.state.audioManifest = null; });

    setupTabs();
    App.setupExplorer();
    App.setupStudyCards();
    App.setupPractice();
    App.setupQuiz();
    App.setupReference();
    App.setupAudioTest();
    App.updateProgress();
  }

  function setupTabs() {
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
