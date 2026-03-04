// UIL Spelling & Vocabulary Practice - Application Logic
(function() {
  'use strict';

  // ==================== STATE ====================
  const state = {
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
      currentSequence: null  // tracks the current audio playback sequence
    }
  };

  // ==================== INIT ====================
  function init() {
    // Build word objects from raw data
    state.words = WORD_LIST.map((w, i) => ({
      id: i,
      word: w[0],
      alt: w[1],
      vocab: w[2],
      number: i + 1
    }));
    state.filteredWords = [...state.words];

    // Load audio manifest
    fetch('audio/manifest.json')
      .then(r => r.json())
      .then(data => { state.audioManifest = data; })
      .catch(() => { state.audioManifest = null; });

    setupTabs();
    setupExplorer();
    setupStudyCards();
    setupPractice();
    setupQuiz();
    setupReference();
    setupAudioTest();
    updateProgress();
  }

  // ==================== TABS ====================
  function setupTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });
  }

  // ==================== PROGRESS ====================
  function saveStudied() {
    localStorage.setItem('uil-studied', JSON.stringify(state.studied));
    updateProgress();
  }

  function updateProgress() {
    const studied = Object.keys(state.studied).length;
    document.getElementById('progressCount').textContent = studied;
    document.getElementById('totalWords').textContent = state.words.length;
  }

  function getStatus(word) {
    return state.studied[word.toLowerCase()] || null;
  }

  function setStatus(word, status) {
    state.studied[word.toLowerCase()] = status;
    saveStudied();
  }

  // ==================== WORD EXPLORER ====================
  function setupExplorer() {
    // Populate letter filter
    const letters = [...new Set(state.words.map(w => {
      const first = w.word[0].toUpperCase();
      return /[A-Z]/.test(first) ? first : '#';
    }))].sort();

    const letterSelect = document.getElementById('letterFilter');
    letters.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l === '#' ? 'Special Characters' : l;
      letterSelect.appendChild(opt);
    });

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', filterWords);
    document.getElementById('letterFilter').addEventListener('change', filterWords);
    document.getElementById('vocabFilter').addEventListener('change', filterWords);
    document.getElementById('statusFilter').addEventListener('change', filterWords);

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('wordModal').addEventListener('click', e => {
      if (e.target.id === 'wordModal') closeModal();
    });

    renderWordGrid();
  }

  function filterWords() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const letter = document.getElementById('letterFilter').value;
    const vocabFilter = document.getElementById('vocabFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    state.filteredWords = state.words.filter(w => {
      if (search && !w.word.toLowerCase().includes(search) &&
          !(w.alt && w.alt.toLowerCase().includes(search))) return false;

      if (letter) {
        const first = w.word[0].toUpperCase();
        const wordLetter = /[A-Z]/.test(first) ? first : '#';
        if (wordLetter !== letter) return false;
      }

      if (vocabFilter === 'vocab' && !w.vocab) return false;
      if (vocabFilter === 'regular' && w.vocab) return false;

      if (statusFilter === 'unstudied' && getStatus(w.word)) return false;
      if (statusFilter === 'studied' && getStatus(w.word) !== 'studied') return false;
      if (statusFilter === 'mastered' && getStatus(w.word) !== 'mastered') return false;

      return true;
    });

    renderWordGrid();
  }

  function renderWordGrid() {
    const grid = document.getElementById('wordGrid');
    const count = document.getElementById('wordCount');
    count.textContent = `Showing ${state.filteredWords.length} of ${state.words.length} words`;

    // Virtual rendering for performance - show first 200
    const visible = state.filteredWords.slice(0, 200);
    grid.innerHTML = visible.map(w => {
      const status = getStatus(w.word);
      const statusIcon = status === 'mastered' ? '&#9733;' : status === 'studied' ? '&#10003;' : '';
      const classes = ['word-card'];
      if (w.vocab) classes.push('vocab');
      if (status) classes.push(status);

      return `<div class="${classes.join(' ')}" data-id="${w.id}">
        <span class="word-number">${w.number}.</span>
        <span class="word-text">${escapeHtml(w.word)}</span>
        <span class="word-status">${statusIcon}</span>
      </div>`;
    }).join('');

    if (state.filteredWords.length > 200) {
      grid.innerHTML += `<div class="word-card" style="grid-column: 1/-1; text-align:center; color: var(--text-light);">
        Showing first 200 of ${state.filteredWords.length} results. Use search or filters to narrow down.
      </div>`;
    }

    // Click handlers
    grid.querySelectorAll('.word-card[data-id]').forEach(card => {
      card.addEventListener('click', () => openModal(state.words[parseInt(card.dataset.id)]));
    });
  }

  function openModal(wordObj) {
    const modal = document.getElementById('wordModal');
    document.getElementById('modalWord').textContent = wordObj.word;
    document.getElementById('modalAlt').textContent = wordObj.alt ? `Also: ${wordObj.alt}` : '';
    const vocabBadge = document.getElementById('modalVocab');
    wordObj.vocab ? vocabBadge.classList.remove('hidden') : vocabBadge.classList.add('hidden');

    // Definition
    const defEl = document.getElementById('modalDef');
    const cached = findDefinition(wordObj);
    if (cached) {
      defEl.textContent = cached;
    } else {
      defEl.textContent = 'Loading definition...';
      fetchDefinition(wordObj.word).then(def => {
        defEl.textContent = def;
      });
    }

    // Word analysis
    const analysis = analyzeWord(wordObj.word);
    const analysisEl = document.getElementById('modalAnalysis');
    let analysisHtml = '';
    if (analysis.prefixes.length > 0) {
      analysis.prefixes.forEach(p => {
        analysisHtml += `<div class="morph-tag"><strong>${escapeHtml(p.prefix)}</strong> ${escapeHtml(p.meaning)}</div>`;
      });
    }
    if (analysis.suffixes.length > 0) {
      analysis.suffixes.forEach(s => {
        analysisHtml += `<div class="morph-tag"><strong>${escapeHtml(s.suffix)}</strong> ${escapeHtml(s.meaning)}</div>`;
      });
    }
    if (!analysisHtml) {
      analysisHtml = '<span style="color:var(--text-light);font-size:13px;">No common prefixes or suffixes detected. Study this word as a whole.</span>';
    }
    analysisEl.innerHTML = analysisHtml;

    // Spelling tips
    const tipsEl = document.getElementById('modalTips');
    tipsEl.innerHTML = generateSpellingTips(wordObj);

    // Action buttons
    const markStudied = document.getElementById('modalMarkStudied');
    const markMastered = document.getElementById('modalMarkMastered');
    const status = getStatus(wordObj.word);

    markStudied.textContent = status === 'studied' ? 'Studied ✓' : 'Mark as Studied';
    markMastered.textContent = status === 'mastered' ? 'Mastered ★' : 'Mark as Mastered';

    markStudied.onclick = () => {
      setStatus(wordObj.word, 'studied');
      markStudied.textContent = 'Studied ✓';
      renderWordGrid();
    };
    markMastered.onclick = () => {
      setStatus(wordObj.word, 'mastered');
      markMastered.textContent = 'Mastered ★';
      renderWordGrid();
    };

    // Speak button
    document.getElementById('modalSpeak').onclick = () => speak(wordObj.word);

    modal.classList.add('active');
  }

  function closeModal() {
    document.getElementById('wordModal').classList.remove('active');
  }

  function findDefinition(wordObj) {
    // Check practice test data
    for (const meet of Object.values(PRACTICE_TESTS)) {
      const found = meet.words.find(w => w.word.toLowerCase() === wordObj.word.toLowerCase());
      if (found) return found.def;
    }
    // Check cache
    return state.definitionCache[wordObj.word.toLowerCase()] || null;
  }

  async function fetchDefinition(word) {
    const cleanWord = word.replace(/[^a-zA-Z-\s]/g, '').trim();
    if (!cleanWord) return 'Definition not available for this term.';

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      if (!res.ok) return 'Definition not available. Check a dictionary for this word.';
      const data = await res.json();
      if (data && data[0] && data[0].meanings) {
        const defs = data[0].meanings.map(m =>
          `(${m.partOfSpeech}) ${m.definitions[0].definition}`
        ).join(' | ');
        state.definitionCache[word.toLowerCase()] = defs;
        // Save cache periodically
        if (Object.keys(state.definitionCache).length % 10 === 0) {
          localStorage.setItem('uil-defs', JSON.stringify(state.definitionCache));
        }
        return defs;
      }
    } catch (e) { /* silent */ }
    return 'Definition not available. Check a dictionary for this word.';
  }

  function generateSpellingTips(wordObj) {
    const word = wordObj.word;
    const tips = [];

    // Letter-by-letter breakdown with difficult parts highlighted
    const difficult = findDifficultParts(word);
    let breakdown = '';
    for (let i = 0; i < word.length; i++) {
      if (difficult.includes(i)) {
        breakdown += `<span class="highlight">${escapeHtml(word[i])}</span>`;
      } else {
        breakdown += escapeHtml(word[i]);
      }
    }
    tips.push(`<div class="letter-breakdown">${breakdown}</div>`);

    // Syllable count
    const syllables = countSyllables(word);
    if (syllables > 1) {
      tips.push(`<div class="tip-item"><strong>${syllables} syllables</strong> - Break it down: try spelling one syllable at a time.</div>`);
    }

    // Specific pattern tips
    if (word.includes('ei') || word.includes('ie')) {
      tips.push(`<div class="tip-item"><strong>IE/EI pattern:</strong> Remember "I before E except after C" (with exceptions).</div>`);
    }
    if (/([a-z])\1/.test(word.toLowerCase())) {
      const match = word.toLowerCase().match(/([a-z])\1/);
      tips.push(`<div class="tip-item"><strong>Double letter:</strong> Note the double "${match[0]}" in this word.</div>`);
    }
    if (word.includes('-')) {
      tips.push(`<div class="tip-item"><strong>Hyphenated word:</strong> Don't forget the hyphen(s)!</div>`);
    }
    if (word.includes("'")) {
      tips.push(`<div class="tip-item"><strong>Apostrophe:</strong> This word contains an apostrophe - pay attention to its placement.</div>`);
    }
    if (/[A-Z]/.test(word[0]) && word !== word.toUpperCase()) {
      tips.push(`<div class="tip-item"><strong>Capitalization:</strong> This word starts with a capital letter (proper noun/adjective).</div>`);
    }
    if (/[àáâãäåæçèéêëìíîïñòóôõöùúûüý]/i.test(word)) {
      tips.push(`<div class="tip-item"><strong>Accent marks:</strong> This word has accent marks from its original language. These are required in UIL competition!</div>`);
    }
    if (wordObj.alt) {
      tips.push(`<div class="tip-item"><strong>Alternate spelling:</strong> "${wordObj.alt}" is also accepted.</div>`);
    }

    return tips.join('');
  }

  function findDifficultParts(word) {
    const indices = [];
    const lower = word.toLowerCase();
    // Highlight double letters, silent letters, unusual combos
    const patterns = ['ph', 'gh', 'ough', 'tion', 'sion', 'eous', 'ious', 'ei', 'ie', 'oe', 'ae'];
    for (const p of patterns) {
      let idx = lower.indexOf(p);
      while (idx !== -1) {
        for (let i = idx; i < idx + p.length; i++) indices.push(i);
        idx = lower.indexOf(p, idx + 1);
      }
    }
    // Double letters
    for (let i = 0; i < lower.length - 1; i++) {
      if (lower[i] === lower[i + 1] && /[a-z]/.test(lower[i])) {
        indices.push(i, i + 1);
      }
    }
    return [...new Set(indices)];
  }

  function countSyllables(word) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length <= 3) return 1;
    let count = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
                      .replace(/^y/, '')
                      .match(/[aeiouy]{1,2}/g);
    return count ? count.length : 1;
  }

  // ==================== STUDY CARDS ====================
  function setupStudyCards() {
    document.getElementById('studyFilter').addEventListener('change', buildStudyDeck);
    document.getElementById('shuffleCards').addEventListener('click', () => {
      shuffleArray(state.studyDeck);
      state.currentCard = 0;
      showCard();
    });
    document.getElementById('flashcard').addEventListener('click', () => {
      document.getElementById('flashcard').classList.toggle('flipped');
    });
    document.getElementById('prevCard').addEventListener('click', () => {
      if (state.currentCard > 0) {
        state.currentCard--;
        showCard();
      }
    });
    document.getElementById('nextCard').addEventListener('click', () => {
      if (state.currentCard < state.studyDeck.length - 1) {
        state.currentCard++;
        showCard();
      }
    });
    document.getElementById('markStudiedCard').addEventListener('click', () => {
      if (state.studyDeck.length > 0) {
        const w = state.studyDeck[state.currentCard];
        setStatus(w.word, 'studied');
        document.getElementById('markStudiedCard').textContent = 'Studied ✓';
      }
    });
    document.getElementById('speakCard').addEventListener('click', () => {
      if (state.studyDeck.length > 0) {
        speak(state.studyDeck[state.currentCard].word);
      }
    });

    buildStudyDeck();
  }

  function buildStudyDeck() {
    const filter = document.getElementById('studyFilter').value;
    switch (filter) {
      case 'vocab': state.studyDeck = state.words.filter(w => w.vocab); break;
      case 'unstudied': state.studyDeck = state.words.filter(w => !getStatus(w.word)); break;
      case 'difficult': state.studyDeck = state.words.filter(w => w.word.replace(/\s/g,'').length >= 6); break;
      default: state.studyDeck = [...state.words];
    }
    state.currentCard = 0;
    showCard();
  }

  function showCard() {
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');

    document.getElementById('cardIndex').textContent = state.studyDeck.length > 0 ? state.currentCard + 1 : 0;
    document.getElementById('cardTotal').textContent = state.studyDeck.length;

    if (state.studyDeck.length === 0) {
      document.getElementById('flashcardWord').textContent = 'No words match filter';
      document.getElementById('flashcardWordBack').textContent = '';
      document.getElementById('flashcardDetails').innerHTML = '';
      return;
    }

    const w = state.studyDeck[state.currentCard];
    document.getElementById('flashcardWord').textContent = w.word;
    document.getElementById('flashcardWordBack').textContent = w.word;

    const status = getStatus(w.word);
    document.getElementById('markStudiedCard').textContent = status ? `${status === 'mastered' ? 'Mastered ★' : 'Studied ✓'}` : 'Mark Studied';

    // Build back details
    const analysis = analyzeWord(w.word);
    const def = findDefinition(w);

    buildCardDetails(w, def, analysis);

    // If no definition found locally, fetch from API and update the card
    if (!def) {
      fetchDefinition(w.word).then(fetchedDef => {
        // Only update if we're still on the same card
        if (state.studyDeck.length > 0 && state.studyDeck[state.currentCard] === w && fetchedDef) {
          buildCardDetails(w, fetchedDef, analysis);
        }
      });
    }
  }

  function buildCardDetails(w, def, analysis) {
    let details = '';

    if (w.alt) {
      details += `<div class="detail-row"><div class="detail-label">Also spelled</div>${escapeHtml(w.alt)}</div>`;
    }
    if (w.vocab) {
      details += `<div class="detail-row"><div class="detail-label">Type</div>Vocabulary Study Word</div>`;
    }
    if (def) {
      details += `<div class="detail-row"><div class="detail-label">Definition</div>${escapeHtml(def)}</div>`;
    } else {
      details += `<div class="detail-row"><div class="detail-label">Definition</div><em style="color:var(--text-light)">Loading...</em></div>`;
    }
    if (analysis.prefixes.length > 0 || analysis.suffixes.length > 0) {
      let parts = '';
      analysis.prefixes.forEach(p => { parts += `<strong>${escapeHtml(p.prefix)}</strong> (${escapeHtml(p.meaning)}) `; });
      analysis.suffixes.forEach(s => { parts += `<strong>${escapeHtml(s.suffix)}</strong> (${escapeHtml(s.meaning)}) `; });
      details += `<div class="detail-row"><div class="detail-label">Word Parts</div>${parts}</div>`;
    }
    details += `<div class="detail-row"><div class="detail-label">Letters</div>${w.word.length} characters, ~${countSyllables(w.word)} syllable(s)</div>`;

    document.getElementById('flashcardDetails').innerHTML = details;
  }

  // ==================== SPELLING PRACTICE ====================
  function setupPractice() {
    document.getElementById('startPractice').addEventListener('click', startPractice);
    document.getElementById('practiceSubmit').addEventListener('click', checkPracticeAnswer);
    document.getElementById('practiceInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') checkPracticeAnswer();
    });
    document.getElementById('practiceNext').addEventListener('click', nextPracticeWord);
    document.getElementById('restartPractice').addEventListener('click', () => {
      document.getElementById('practiceResults').classList.add('hidden');
      document.getElementById('practiceSetup').classList.remove('hidden');
    });
    document.getElementById('practiceSpeak').addEventListener('click', () => {
      if (state.practiceWords.length > 0) {
        speak(state.practiceWords[state.practiceIndex].word);
      }
    });
  }

  function startPractice() {
    const count = parseInt(document.getElementById('practiceCount').value);
    const source = document.getElementById('practiceSource').value;

    let pool;
    switch (source) {
      case 'vocab': pool = state.words.filter(w => w.vocab); break;
      case 'unstudied': pool = state.words.filter(w => !getStatus(w.word)); break;
      case 'meet1':
        pool = PRACTICE_TESTS.meet1.words.map((w, i) => ({
          id: 1000 + i,
          word: w.word,
          alt: w.alt || null,
          vocab: false,
          number: i + 1,
          def: w.def
        }));
        break;
      default: pool = [...state.words];
    }

    if (pool.length === 0) {
      alert('No words match your filter. Try a different source.');
      return;
    }

    shuffleArray(pool);
    state.practiceWords = pool.slice(0, Math.min(count, pool.length));
    state.practiceIndex = 0;
    state.practiceScore = 0;
    state.practiceResults = [];

    document.getElementById('practiceSetup').classList.add('hidden');
    document.getElementById('practiceActive').classList.remove('hidden');
    document.getElementById('practiceTotal').textContent = state.practiceWords.length;
    document.getElementById('practiceScore').textContent = '0';

    showPracticeWord();
  }

  function showPracticeWord() {
    const w = state.practiceWords[state.practiceIndex];
    document.getElementById('practiceNum').textContent = state.practiceIndex + 1;
    document.getElementById('practiceProgressBar').style.width =
      ((state.practiceIndex) / state.practiceWords.length * 100) + '%';

    // Show definition
    const def = w.def || findDefinition(w) || 'Listen to the pronunciation and spell the word.';
    document.getElementById('practiceDef').textContent = def;

    document.getElementById('practiceInput').value = '';
    document.getElementById('practiceInput').focus();
    document.getElementById('practiceFeedback').classList.add('hidden');
    document.getElementById('practiceNext').classList.add('hidden');
    document.getElementById('practiceSubmit').classList.remove('hidden');
    document.getElementById('practiceInput').disabled = false;
  }

  function checkPracticeAnswer() {
    const w = state.practiceWords[state.practiceIndex];
    const answer = document.getElementById('practiceInput').value.trim();
    if (!answer) return;

    const correct = isSpellingCorrect(answer, w);
    const feedback = document.getElementById('practiceFeedback');
    feedback.classList.remove('hidden', 'correct', 'incorrect');

    if (correct) {
      state.practiceScore++;
      document.getElementById('practiceScore').textContent = state.practiceScore;
      feedback.classList.add('correct');
      feedback.textContent = '✓ Correct!';
      setStatus(w.word, getStatus(w.word) === 'mastered' ? 'mastered' : 'studied');
    } else {
      feedback.classList.add('incorrect');
      feedback.innerHTML = `✗ Incorrect. The correct spelling is: <strong>${escapeHtml(w.word)}</strong>` +
        (w.alt ? ` (also accepted: ${escapeHtml(w.alt)})` : '');
    }

    state.practiceResults.push({ word: w.word, answer, correct });
    document.getElementById('practiceSubmit').classList.add('hidden');
    document.getElementById('practiceNext').classList.remove('hidden');
    document.getElementById('practiceInput').disabled = true;
  }

  function nextPracticeWord() {
    state.practiceIndex++;
    if (state.practiceIndex >= state.practiceWords.length) {
      showPracticeResults();
    } else {
      showPracticeWord();
    }
  }

  function showPracticeResults() {
    document.getElementById('practiceActive').classList.add('hidden');
    document.getElementById('practiceResults').classList.remove('hidden');

    const pct = Math.round(state.practiceScore / state.practiceWords.length * 100);
    document.getElementById('resultsScore').textContent = `${state.practiceScore}/${state.practiceWords.length} (${pct}%)`;

    const list = document.getElementById('resultsList');
    list.innerHTML = state.practiceResults.map(r =>
      `<div class="result-item">
        <span class="result-icon ${r.correct ? 'result-correct' : 'result-wrong'}">${r.correct ? '✓' : '✗'}</span>
        <span><strong>${escapeHtml(r.word)}</strong></span>
        ${!r.correct ? `<span class="result-answer">You typed: ${escapeHtml(r.answer)}</span>` : ''}
      </div>`
    ).join('');
  }

  function isSpellingCorrect(answer, wordObj) {
    const clean = s => s.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents for comparison
      .replace(/['']/g, "'");

    if (clean(answer) === clean(wordObj.word)) return true;
    if (wordObj.alt && clean(answer) === clean(wordObj.alt)) return true;
    return false;
  }

  // ==================== QUIZ MODE ====================
  function setupQuiz() {
    document.querySelectorAll('.quiz-type-card').forEach(card => {
      card.addEventListener('click', () => startQuiz(card.dataset.quiz));
    });
    document.getElementById('quizNext').addEventListener('click', nextQuizQuestion);
    document.getElementById('quizSubmitAnswer').addEventListener('click', submitQuizAnswer);
    document.getElementById('quizAnswer').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitQuizAnswer();
    });
    document.getElementById('restartQuiz').addEventListener('click', () => {
      document.getElementById('quizResults').classList.add('hidden');
      document.getElementById('quizSetup').classList.remove('hidden');
    });
  }

  function startQuiz(type) {
    state.quizType = type;
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizResults = [];

    switch (type) {
      case 'proofreading': generateProofreadingQuiz(); break;
      case 'spelling': generateSpellingQuiz(); break;
      case 'vocabulary': generateVocabularyQuiz(); break;
    }

    document.getElementById('quizSetup').classList.add('hidden');
    document.getElementById('quizActive').classList.remove('hidden');
    document.getElementById('quizTotal').textContent = state.quizQuestions.length;
    document.getElementById('quizScore').textContent = '0';

    // Start timer
    state.quizTimeLeft = 900; // 15 minutes
    updateTimer();
    state.quizTimer = setInterval(() => {
      state.quizTimeLeft--;
      updateTimer();
      if (state.quizTimeLeft <= 0) {
        clearInterval(state.quizTimer);
        showQuizResults();
      }
    }, 1000);

    showQuizQuestion();
  }

  function updateTimer() {
    const m = Math.floor(state.quizTimeLeft / 60);
    const s = state.quizTimeLeft % 60;
    document.getElementById('quizTimer').textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }

  function generateProofreadingQuiz() {
    // Create sets of 5 words where one is misspelled
    const questions = [];
    const pool = shuffleArray([...state.words]).slice(0, 75);

    for (let i = 0; i < 15 && i * 5 < pool.length; i++) {
      const group = pool.slice(i * 5, i * 5 + 5);
      const misspellIdx = Math.floor(Math.random() * 5);
      const original = group[misspellIdx].word;
      const misspelled = createMisspelling(original);

      questions.push({
        type: 'proofreading',
        words: group.map((w, j) => j === misspellIdx ? misspelled : w.word),
        correctIndex: misspellIdx,
        correctSpelling: original,
        misspelled: misspelled
      });
    }
    state.quizQuestions = questions;
  }

  function createMisspelling(word) {
    const lower = word.toLowerCase();
    const strategies = [
      // Double a letter
      () => { const i = Math.floor(Math.random() * (word.length - 1)) + 1; return word.slice(0, i) + word[i] + word.slice(i); },
      // Remove a letter
      () => { const i = Math.floor(Math.random() * word.length); return word.slice(0, i) + word.slice(i + 1); },
      // Swap adjacent letters
      () => {
        const i = Math.floor(Math.random() * (word.length - 1));
        return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
      },
      // Change a vowel
      () => {
        const vowels = 'aeiou';
        const indices = [];
        for (let i = 0; i < lower.length; i++) { if (vowels.includes(lower[i])) indices.push(i); }
        if (indices.length === 0) return word.slice(0, -1) + 'e';
        const i = indices[Math.floor(Math.random() * indices.length)];
        const newVowel = vowels.replace(lower[i], '')[Math.floor(Math.random() * 4)];
        return word.slice(0, i) + newVowel + word.slice(i + 1);
      }
    ];

    const result = strategies[Math.floor(Math.random() * strategies.length)]();
    return result === word ? word.slice(0, -1) + (word.endsWith('e') ? 'a' : 'e') : result;
  }

  function generateSpellingQuiz() {
    // Use words that have definitions
    const wordsWithDefs = [];
    for (const meet of Object.values(PRACTICE_TESTS)) {
      meet.words.forEach(w => wordsWithDefs.push(w));
    }
    shuffleArray(wordsWithDefs);
    state.quizQuestions = wordsWithDefs.slice(0, 15).map(w => ({
      type: 'spelling',
      def: w.def,
      answer: w.word,
      alt: w.alt
    }));
  }

  function generateVocabularyQuiz() {
    const wordsWithDefs = [];
    for (const meet of Object.values(PRACTICE_TESTS)) {
      meet.words.forEach(w => wordsWithDefs.push(w));
    }
    shuffleArray(wordsWithDefs);

    state.quizQuestions = wordsWithDefs.slice(0, 15).map(w => {
      const wrongDefs = wordsWithDefs
        .filter(x => x.word !== w.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.def);

      const options = shuffleArray([w.def, ...wrongDefs]);

      return {
        type: 'vocabulary',
        word: w.word,
        correctDef: w.def,
        options: options,
        correctIndex: options.indexOf(w.def)
      };
    });
  }

  function showQuizQuestion() {
    const q = state.quizQuestions[state.quizIndex];
    document.getElementById('quizNum').textContent = state.quizIndex + 1;
    document.getElementById('quizFeedback').classList.add('hidden');
    document.getElementById('quizNext').classList.add('hidden');

    const questionEl = document.getElementById('quizQuestion');
    const optionsEl = document.getElementById('quizOptions');
    const inputEl = document.getElementById('quizInput');

    optionsEl.innerHTML = '';
    inputEl.classList.add('hidden');

    if (q.type === 'proofreading') {
      questionEl.textContent = 'Find the misspelled word and click on it:';
      optionsEl.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'proof-group';
      q.words.forEach((w, i) => {
        const btn = document.createElement('button');
        btn.className = 'proof-word';
        btn.textContent = w;
        btn.addEventListener('click', () => handleProofAnswer(i, q, grid));
        grid.appendChild(btn);
      });
      optionsEl.appendChild(grid);
    } else if (q.type === 'spelling') {
      questionEl.textContent = `Spell the word defined as: "${q.def}"`;
      inputEl.classList.remove('hidden');
      document.getElementById('quizAnswer').value = '';
      document.getElementById('quizAnswer').focus();
    } else if (q.type === 'vocabulary') {
      questionEl.textContent = `What is the definition of "${q.word}"?`;
      q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => handleVocabAnswer(i, q, optionsEl));
        optionsEl.appendChild(btn);
      });
    }
  }

  function handleProofAnswer(selectedIdx, q, grid) {
    const buttons = grid.querySelectorAll('.proof-word');
    buttons.forEach(b => b.style.pointerEvents = 'none');

    const feedback = document.getElementById('quizFeedback');
    feedback.classList.remove('hidden', 'correct', 'incorrect');

    if (selectedIdx === q.correctIndex) {
      state.quizScore++;
      document.getElementById('quizScore').textContent = state.quizScore;
      buttons[selectedIdx].classList.add('correct-answer');
      feedback.classList.add('correct');
      feedback.textContent = `✓ Correct! "${q.misspelled}" should be spelled "${q.correctSpelling}".`;
    } else {
      buttons[selectedIdx].classList.add('wrong-answer');
      buttons[q.correctIndex].classList.add('correct-answer');
      feedback.classList.add('incorrect');
      feedback.textContent = `✗ Wrong. "${q.misspelled}" (position ${q.correctIndex + 1}) should be "${q.correctSpelling}".`;
    }

    state.quizResults.push({ correct: selectedIdx === q.correctIndex, word: q.correctSpelling });
    document.getElementById('quizNext').classList.remove('hidden');
  }

  function submitQuizAnswer() {
    const answer = document.getElementById('quizAnswer').value.trim();
    if (!answer) return;

    const q = state.quizQuestions[state.quizIndex];
    const correct = isSpellingCorrect(answer, { word: q.answer, alt: q.alt });

    const feedback = document.getElementById('quizFeedback');
    feedback.classList.remove('hidden', 'correct', 'incorrect');

    if (correct) {
      state.quizScore++;
      document.getElementById('quizScore').textContent = state.quizScore;
      feedback.classList.add('correct');
      feedback.textContent = '✓ Correct!';
    } else {
      feedback.classList.add('incorrect');
      feedback.innerHTML = `✗ Incorrect. Correct spelling: <strong>${escapeHtml(q.answer)}</strong>`;
    }

    state.quizResults.push({ correct, word: q.answer, answer });
    document.getElementById('quizAnswer').disabled = true;
    document.getElementById('quizSubmitAnswer').disabled = true;
    document.getElementById('quizNext').classList.remove('hidden');
  }

  function handleVocabAnswer(selectedIdx, q, container) {
    const buttons = container.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.style.pointerEvents = 'none');

    const feedback = document.getElementById('quizFeedback');
    feedback.classList.remove('hidden', 'correct', 'incorrect');

    if (selectedIdx === q.correctIndex) {
      state.quizScore++;
      document.getElementById('quizScore').textContent = state.quizScore;
      buttons[selectedIdx].classList.add('correct-answer');
      feedback.classList.add('correct');
      feedback.textContent = '✓ Correct!';
    } else {
      buttons[selectedIdx].classList.add('wrong-answer');
      buttons[q.correctIndex].classList.add('correct-answer');
      feedback.classList.add('incorrect');
      feedback.textContent = '✗ Incorrect.';
    }

    state.quizResults.push({ correct: selectedIdx === q.correctIndex, word: q.word });
    document.getElementById('quizNext').classList.remove('hidden');
  }

  function nextQuizQuestion() {
    state.quizIndex++;
    // Reset input state
    document.getElementById('quizAnswer').disabled = false;
    document.getElementById('quizSubmitAnswer').disabled = false;

    if (state.quizIndex >= state.quizQuestions.length) {
      clearInterval(state.quizTimer);
      showQuizResults();
    } else {
      showQuizQuestion();
    }
  }

  function showQuizResults() {
    document.getElementById('quizActive').classList.add('hidden');
    document.getElementById('quizResults').classList.remove('hidden');
    clearInterval(state.quizTimer);

    const total = state.quizResults.length;
    const pct = total > 0 ? Math.round(state.quizScore / total * 100) : 0;
    document.getElementById('quizResultsScore').textContent = `${state.quizScore}/${total} (${pct}%)`;

    document.getElementById('quizResultsList').innerHTML = state.quizResults.map(r =>
      `<div class="result-item">
        <span class="result-icon ${r.correct ? 'result-correct' : 'result-wrong'}">${r.correct ? '✓' : '✗'}</span>
        <strong>${escapeHtml(r.word)}</strong>
        ${r.answer && !r.correct ? `<span class="result-answer">You typed: ${escapeHtml(r.answer)}</span>` : ''}
      </div>`
    ).join('');
  }

  // ==================== REFERENCE ====================
  function setupReference() {
    // Populate prefix/suffix tables
    const prefixGrid = document.getElementById('ref-prefixes');
    prefixGrid.innerHTML = '<div class="ref-grid">' +
      Object.entries(PREFIXES).map(([p, m]) =>
        `<div class="ref-item"><strong>${escapeHtml(p)}</strong><span>${escapeHtml(m)}</span></div>`
      ).join('') + '</div>';

    const suffixGrid = document.getElementById('ref-suffixes');
    suffixGrid.innerHTML = '<div class="ref-grid">' +
      Object.entries(SUFFIXES).map(([s, m]) =>
        `<div class="ref-item"><strong>${escapeHtml(s)}</strong><span>${escapeHtml(m)}</span></div>`
      ).join('') + '</div>';

    // Tab switching
    document.querySelectorAll('.ref-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ref-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.ref-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ref-' + btn.dataset.reftab).classList.add('active');
      });
    });

    // Search
    document.getElementById('refSearch').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.ref-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // ==================== AUDIO TEST ====================
  function setupAudioTest() {
    // Word count buttons
    document.querySelectorAll('.word-count-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.word-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.audioTest.wordCount = parseInt(btn.dataset.count);
      });
    });

    document.getElementById('startAudioTest').addEventListener('click', startAudioTest);
    document.getElementById('audioTestSubmit').addEventListener('click', submitAudioTestAnswer);
    document.getElementById('audioTestInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitAudioTestAnswer();
    });
    document.getElementById('audioTestNext').addEventListener('click', nextAudioTestWord);
    document.getElementById('audioTestReplay').addEventListener('click', replayAudioTestWord);
    document.getElementById('restartAudioTest').addEventListener('click', () => {
      document.getElementById('audioTestResults').classList.add('hidden');
      document.getElementById('audioTestSetup').classList.remove('hidden');
    });
    document.getElementById('reviewMissedWords').addEventListener('click', reviewMissedAudioWords);
  }

  function startAudioTest() {
    const count = state.audioTest.wordCount;
    const source = document.getElementById('audioTestSource').value;

    let pool;
    switch (source) {
      case 'vocab':
        pool = state.words.filter(w => w.vocab);
        break;
      case 'unstudied':
        pool = state.words.filter(w => !getStatus(w.word));
        break;
      case 'meet1':
        pool = PRACTICE_TESTS.meet1.words.map((w, i) => ({
          id: 2000 + i,
          word: w.word,
          alt: w.alt || null,
          vocab: false,
          number: i + 1,
          def: w.def
        }));
        break;
      default:
        pool = [...state.words];
    }

    if (pool.length === 0) {
      alert('No words match your filter. Try a different source.');
      return;
    }

    shuffleArray(pool);
    const selected = pool.slice(0, Math.min(count, pool.length));

    // Attach any already-known definitions but do NOT fetch from API yet
    // Definitions will be fetched on-the-fly for each word during its audio sequence
    const wordsReady = selected.map(w => {
      const def = w.def || findDefinition(w) || null;
      return { ...w, def: def };
    });

    state.audioTest.words = wordsReady;
    state.audioTest.index = 0;
    state.audioTest.score = 0;
    state.audioTest.results = [];

    // Show the test screen immediately
    document.getElementById('audioTestSetup').classList.add('hidden');
    document.getElementById('audioTestActive').classList.remove('hidden');
    document.getElementById('audioTestTotal').textContent = wordsReady.length;
    document.getElementById('audioTestScore').textContent = '0';

    playAudioTestWord();
  }

  function playAudioTestWord() {
    const w = state.audioTest.words[state.audioTest.index];
    const statusEl = document.getElementById('audioTestStatus');
    const inputEl = document.getElementById('audioTestInput');
    const submitEl = document.getElementById('audioTestSubmit');

    // Update progress
    document.getElementById('audioTestNum').textContent = state.audioTest.index + 1;
    document.getElementById('audioTestProgressBar').style.width =
      ((state.audioTest.index) / state.audioTest.words.length * 100) + '%';

    // Reset UI
    inputEl.value = '';
    inputEl.disabled = true;
    submitEl.disabled = true;
    document.getElementById('audioTestFeedback').classList.add('hidden');
    document.getElementById('audioTestNext').classList.add('hidden');
    document.getElementById('audioTestSubmit').classList.remove('hidden');

    state.audioTest.isPlaying = true;

    // Create a sequence ID to allow cancellation
    const sequenceId = Date.now();
    state.audioTest.currentSequence = sequenceId;

    // Play sequence: word, word, definition, word
    runAudioSequence(w, sequenceId);
  }

  async function runAudioSequence(wordObj, sequenceId) {
    const statusEl = document.getElementById('audioTestStatus');

    // Start fetching definition in the background while word is pronounced
    let defPromise = null;
    if (!wordObj.def) {
      defPromise = fetchDefinition(wordObj.word);
    }

    // Step 1: Say the word (first time)
    statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word...</span>';
    await playWordAudio(wordObj.word);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Brief pause
    await delay(600);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Step 2: Say the word (second time)
    statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word again...</span>';
    await playWordAudio(wordObj.word);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Resolve the definition before reading it aloud
    if (defPromise) {
      const fetchedDef = await defPromise;
      wordObj.def = fetchedDef || 'Spell the word as pronounced.';
      // Update it in the state array too
      state.audioTest.words[state.audioTest.index] = wordObj;
    }
    if (!wordObj.def) {
      wordObj.def = 'Spell the word as pronounced.';
    }

    // Brief pause
    await delay(800);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Step 3: Read the definition
    statusEl.innerHTML = '<div class="audio-pulse pulse-green"></div><span>Reading definition...</span>';
    await speakTTSAsync(wordObj.def);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Brief pause
    await delay(800);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Step 4: Say the word one more time
    statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word one last time...</span>';
    await playWordAudio(wordObj.word);
    if (state.audioTest.currentSequence !== sequenceId) return;

    // Done - enable input
    state.audioTest.isPlaying = false;
    statusEl.innerHTML = '<span class="audio-ready">&#9998; Type your answer below</span>';
    document.getElementById('audioTestInput').disabled = false;
    document.getElementById('audioTestSubmit').disabled = false;
    document.getElementById('audioTestInput').focus();
  }

  function playWordAudio(word) {
    return new Promise((resolve) => {
      // Stop any currently playing audio
      if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
      }

      if (state.audioManifest && state.audioManifest[word]) {
        const audio = new Audio('audio/words/' + state.audioManifest[word]);
        state.currentAudio = audio;
        audio.onended = () => {
          state.currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          state.currentAudio = null;
          // Fallback to TTS
          speakTTSAsync(word).then(resolve);
        };
        audio.play().catch(() => {
          state.currentAudio = null;
          speakTTSAsync(word).then(resolve);
        });
      } else {
        speakTTSAsync(word).then(resolve);
      }
    });
  }

  function speakTTSAsync(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.pitch = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      // Safety timeout in case onend never fires
      const timeout = setTimeout(() => resolve(), 15000);
      u.onend = () => { clearTimeout(timeout); resolve(); };
      u.onerror = () => { clearTimeout(timeout); resolve(); };
      speechSynthesis.speak(u);
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function replayAudioTestWord() {
    if (state.audioTest.index < state.audioTest.words.length) {
      const w = state.audioTest.words[state.audioTest.index];
      const sequenceId = Date.now();
      state.audioTest.currentSequence = sequenceId;
      state.audioTest.isPlaying = true;

      // Disable input during replay
      document.getElementById('audioTestInput').disabled = true;
      document.getElementById('audioTestSubmit').disabled = true;

      runAudioSequence(w, sequenceId);
    }
  }

  function submitAudioTestAnswer() {
    const w = state.audioTest.words[state.audioTest.index];
    const answer = document.getElementById('audioTestInput').value.trim();
    if (!answer) return;

    const correct = isSpellingCorrect(answer, w);
    const feedback = document.getElementById('audioTestFeedback');
    feedback.classList.remove('hidden', 'correct', 'incorrect');

    if (correct) {
      state.audioTest.score++;
      document.getElementById('audioTestScore').textContent = state.audioTest.score;
      feedback.classList.add('correct');
      feedback.textContent = '✓ Correct!';
      setStatus(w.word, getStatus(w.word) === 'mastered' ? 'mastered' : 'studied');
    } else {
      feedback.classList.add('incorrect');
      feedback.innerHTML = `✗ Incorrect. The correct spelling is: <strong>${escapeHtml(w.word)}</strong>` +
        (w.alt ? ` (also accepted: ${escapeHtml(w.alt)})` : '');
    }

    state.audioTest.results.push({
      word: w.word,
      def: w.def,
      answer: answer,
      correct: correct
    });

    document.getElementById('audioTestSubmit').classList.add('hidden');
    document.getElementById('audioTestNext').classList.remove('hidden');
    document.getElementById('audioTestInput').disabled = true;
  }

  function nextAudioTestWord() {
    state.audioTest.index++;
    if (state.audioTest.index >= state.audioTest.words.length) {
      showAudioTestResults();
    } else {
      playAudioTestWord();
    }
  }

  function showAudioTestResults() {
    // Stop any playing audio
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    speechSynthesis.cancel();
    state.audioTest.currentSequence = null;

    document.getElementById('audioTestActive').classList.add('hidden');
    document.getElementById('audioTestResults').classList.remove('hidden');

    const total = state.audioTest.words.length;
    const score = state.audioTest.score;
    const pct = Math.round(score / total * 100);

    document.getElementById('audioTestResultsScore').textContent = `${score} / ${total} (${pct}%)`;

    // Letter grade
    const gradeEl = document.getElementById('audioTestGrade');
    let grade, gradeClass;
    if (pct >= 90) { grade = 'A'; gradeClass = 'grade-a'; }
    else if (pct >= 80) { grade = 'B'; gradeClass = 'grade-b'; }
    else if (pct >= 70) { grade = 'C'; gradeClass = 'grade-c'; }
    else if (pct >= 60) { grade = 'D'; gradeClass = 'grade-d'; }
    else { grade = 'F'; gradeClass = 'grade-f'; }
    gradeEl.innerHTML = `<span class="grade-letter ${gradeClass}">${grade}</span>`;

    // Show/hide review button
    const missed = state.audioTest.results.filter(r => !r.correct);
    document.getElementById('reviewMissedWords').style.display = missed.length > 0 ? '' : 'none';

    // Results list
    const list = document.getElementById('audioTestResultsList');
    list.innerHTML = state.audioTest.results.map((r, i) =>
      `<div class="result-item">
        <span class="result-num">${i + 1}.</span>
        <span class="result-icon ${r.correct ? 'result-correct' : 'result-wrong'}">${r.correct ? '✓' : '✗'}</span>
        <span><strong>${escapeHtml(r.word)}</strong></span>
        ${!r.correct ? `<span class="result-answer">You typed: ${escapeHtml(r.answer)}</span>` : ''}
      </div>`
    ).join('');
  }

  function reviewMissedAudioWords() {
    // Switch to Study Cards tab with missed words
    const missed = state.audioTest.results.filter(r => !r.correct);
    if (missed.length === 0) return;

    // Build a study deck from missed words
    state.studyDeck = missed.map(r => {
      return state.words.find(w => w.word.toLowerCase() === r.word.toLowerCase()) || {
        id: -1, word: r.word, alt: null, vocab: false, number: 0
      };
    });
    state.currentCard = 0;

    // Switch to study tab
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="study"]').classList.add('active');
    document.getElementById('tab-study').classList.add('active');

    showCard();
  }

  // ==================== UTILITIES ====================
  function speak(text) {
    // Stop any currently playing audio
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }

    // Try to use pre-generated audio file first
    if (state.audioManifest && state.audioManifest[text]) {
      const audio = new Audio('audio/words/' + state.audioManifest[text]);
      audio.playbackRate = 1.0;
      state.currentAudio = audio;
      audio.play().catch(() => {
        // Fallback to browser TTS if audio file fails
        speakTTS(text);
      });
      return;
    }

    // Fallback to browser text-to-speech
    speakTTS(text);
  }

  function speakTTS(text) {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8;
      u.pitch = 1;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== START ====================
  document.addEventListener('DOMContentLoaded', init);
})();
