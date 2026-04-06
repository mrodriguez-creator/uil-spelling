// UIL Spelling & Vocabulary Practice - Regional Test Module
// Self-paced test with PDF report and Google Form submission
'use strict';

// Google Form configuration
var REGIONAL_CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScGuVn0UyQwb08oGD9CgE6w5y6cNukrcz51ubTB152Gfej3XQ/formResponse',
  FIELD_STUDENT_NAME: 'entry.249505535',
  FIELD_MEET_NAME: 'entry.216451007',
  FIELD_SCORE: 'entry.2105211526',
  FIELD_DATE: 'entry.1893282082',
  DEFAULT_PROF_EMAIL: 'mrodriguez@alpineisd.net'
};

App.state.regional = {
  words: [],
  index: 0,
  score: 0,
  results: [],
  meetKey: null,
  studentName: '',
  profEmail: '',
  startTime: null,
  includeTiebreaker: false
};

App.setupRegionalTest = function() {
  // Mode selector cards
  document.getElementById('audioModeRandom').addEventListener('click', function() {
    document.getElementById('audioModeSelector').classList.add('hidden');
    document.getElementById('audioTestSetup').classList.remove('hidden');
  });
  document.getElementById('audioModeRegional').addEventListener('click', function() {
    document.getElementById('audioModeSelector').classList.add('hidden');
    document.getElementById('regionalSetup').classList.remove('hidden');
  });

  // Back buttons
  document.getElementById('audioTestBack').addEventListener('click', function() {
    document.getElementById('audioTestSetup').classList.add('hidden');
    document.getElementById('audioModeSelector').classList.remove('hidden');
  });
  document.getElementById('regionalBack').addEventListener('click', function() {
    document.getElementById('regionalSetup').classList.add('hidden');
    document.getElementById('audioModeSelector').classList.remove('hidden');
  });

  // Update restartAudioTest to go back to mode selector
  var origRestart = document.getElementById('restartAudioTest');
  origRestart.addEventListener('click', function() {
    document.getElementById('audioTestResults').classList.add('hidden');
    document.getElementById('audioModeSelector').classList.remove('hidden');
  });

  // Regional test controls
  document.getElementById('startRegional').addEventListener('click', App.startRegionalTest);
  document.getElementById('regionalPlayWord').addEventListener('click', App.regionalPlayWord);
  document.getElementById('regionalPlayDef').addEventListener('click', App.regionalPlayDef);
  document.getElementById('regionalReplay').addEventListener('click', App.regionalPlayWord);
  document.getElementById('regionalSubmit').addEventListener('click', App.submitRegionalAnswer);
  document.getElementById('regionalInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') App.submitRegionalAnswer();
  });
  document.getElementById('regionalNext').addEventListener('click', App.nextRegionalWord);
  document.getElementById('regionalDownloadPDF').addEventListener('click', App.downloadRegionalPDF);
  document.getElementById('regionalSubmitGoogle').addEventListener('click', App.submitToGoogleForm);
  document.getElementById('regionalEmailResults').addEventListener('click', App.emailRegionalResults);
  document.getElementById('restartRegional').addEventListener('click', function() {
    document.getElementById('regionalResults').classList.add('hidden');
    document.getElementById('audioModeSelector').classList.remove('hidden');
  });
  document.getElementById('regionalReviewMissed').addEventListener('click', App.reviewRegionalMissed);

  // Populate meet selector with available meets that have word data
  var select = document.getElementById('regionalMeetSelect');
  select.innerHTML = '';
  for (var key in PRACTICE_TESTS) {
    var meet = PRACTICE_TESTS[key];
    if (meet.words && meet.words.length > 0) {
      var opt = document.createElement('option');
      opt.value = key;
      var count = meet.words.length;
      if (meet.tiebreaker) count += ' + ' + meet.tiebreaker.length + ' tiebreaker';
      opt.textContent = meet.name + ' (' + count + ' words)';
      select.appendChild(opt);
    }
  }
  // Put meet5 first if it exists
  if (select.querySelector('option[value="meet5"]')) {
    var meet5Opt = select.querySelector('option[value="meet5"]');
    select.insertBefore(meet5Opt, select.firstChild);
    meet5Opt.selected = true;
  }

  // Show/hide tiebreaker option based on selected meet
  document.getElementById('regionalMeetSelect').addEventListener('change', function() {
    var meet = PRACTICE_TESTS[this.value];
    var tbSelect = document.getElementById('regionalTiebreaker');
    if (meet && meet.tiebreaker && meet.tiebreaker.length > 0) {
      tbSelect.closest('.audio-option-group').style.display = '';
    } else {
      tbSelect.closest('.audio-option-group').style.display = 'none';
      tbSelect.value = 'no';
    }
  });
  // Trigger initial check
  document.getElementById('regionalMeetSelect').dispatchEvent(new Event('change'));

  // Pre-fill professor email
  if (REGIONAL_CONFIG.DEFAULT_PROF_EMAIL) {
    document.getElementById('regionalProfEmail').value = REGIONAL_CONFIG.DEFAULT_PROF_EMAIL;
  }
};

App.startRegionalTest = function() {
  var meetKey = document.getElementById('regionalMeetSelect').value;
  var studentName = document.getElementById('regionalStudentName').value.trim();
  var profEmail = document.getElementById('regionalProfEmail').value.trim();
  var includeTB = document.getElementById('regionalTiebreaker').value === 'yes';

  if (!studentName) {
    alert('Please enter your name before starting the test.');
    document.getElementById('regionalStudentName').focus();
    return;
  }

  var meet = PRACTICE_TESTS[meetKey];
  if (!meet || !meet.words) {
    alert('Selected meet data not found.');
    return;
  }

  // Build word list (in order - not shuffled for official test)
  var words = meet.words.slice();
  if (includeTB && meet.tiebreaker) {
    words = words.concat(meet.tiebreaker);
  }

  App.state.regional = {
    words: words,
    index: 0,
    score: 0,
    results: [],
    meetKey: meetKey,
    meetName: meet.name,
    studentName: studentName,
    profEmail: profEmail,
    startTime: new Date(),
    includeTiebreaker: includeTB,
    mainWordCount: meet.words.length
  };

  document.getElementById('regionalSetup').classList.add('hidden');
  document.getElementById('regionalActive').classList.remove('hidden');
  document.getElementById('regionalTotal').textContent = words.length;
  document.getElementById('regionalScore').textContent = '0';

  App.showRegionalWord();
};

App.showRegionalWord = function() {
  var r = App.state.regional;
  var w = r.words[r.index];

  document.getElementById('regionalNum').textContent = r.index + 1;
  document.getElementById('regionalProgressBar').style.width =
    (r.index / r.words.length * 100) + '%';

  document.getElementById('regionalInput').value = '';
  document.getElementById('regionalInput').disabled = false;
  document.getElementById('regionalSubmit').disabled = false;
  document.getElementById('regionalFeedback').classList.add('hidden');
  document.getElementById('regionalNext').classList.add('hidden');
  document.getElementById('regionalSubmit').classList.remove('hidden');

  // Show section label
  var statusEl = document.getElementById('regionalStatus');
  var label = '';
  if (r.index < r.mainWordCount) {
    if (r.index < 40) label = 'Part II &mdash; Words 1-40';
    else label = 'Part II &mdash; Words 41-70';
  } else {
    label = 'Tiebreaker';
  }
  statusEl.innerHTML = '<span class="regional-section-label">' + label + '</span> ' +
    '<span class="audio-ready">Click "Play Word" to hear the pronunciation</span>';

  document.getElementById('regionalInput').focus();
};

App.regionalPlayWord = function() {
  var r = App.state.regional;
  if (r.index >= r.words.length) return;
  var w = r.words[r.index];

  // Stop any current audio
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();

  var statusEl = document.getElementById('regionalStatus');
  statusEl.innerHTML = '<div class="audio-pulse"></div><span>Pronouncing word...</span>';

  App.playWordAudio(w.word).then(function() {
    statusEl.innerHTML = '<span class="audio-ready">Type your answer below</span>';
    document.getElementById('regionalInput').focus();
  });
};

App.regionalPlayDef = function() {
  var r = App.state.regional;
  if (r.index >= r.words.length) return;
  var w = r.words[r.index];

  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();

  var statusEl = document.getElementById('regionalStatus');
  statusEl.innerHTML = '<div class="audio-pulse pulse-green"></div><span>Reading definition...</span>';

  var def = w.def || CONFIG.DEF_SPELL_ONLY_TEXT;
  App.speakTTSAsync(def).then(function() {
    statusEl.innerHTML = '<span class="audio-ready">Type your answer below</span>';
    document.getElementById('regionalInput').focus();
  });
};

App.submitRegionalAnswer = function() {
  var r = App.state.regional;
  var w = r.words[r.index];
  var answer = document.getElementById('regionalInput').value.trim();
  if (!answer) return;

  // Stop audio
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();

  var correct = App.isSpellingCorrect(answer, w);
  var feedback = document.getElementById('regionalFeedback');
  feedback.classList.remove('hidden', 'correct', 'incorrect');

  if (correct) {
    r.score++;
    document.getElementById('regionalScore').textContent = r.score;
    feedback.classList.add('correct');
    feedback.textContent = '\u2713 Correct!';
    App.recordAccuracy(w.word, true);
  } else {
    feedback.classList.add('incorrect');
    feedback.innerHTML = '\u2717 Incorrect. The correct spelling is: <strong>' + App.escapeHtml(w.word) + '</strong>' +
      (w.alt ? ' (also accepted: ' + App.escapeHtml(w.alt) + ')' : '');
    App.recordMiss(w.word, 'regional');
    App.recordAccuracy(w.word, false);
  }

  r.results.push({
    number: r.index + 1,
    word: w.word,
    def: w.def,
    answer: answer,
    correct: correct,
    outside: w.outside || false,
    section: r.index < r.mainWordCount ? 'main' : 'tiebreaker'
  });

  document.getElementById('regionalSubmit').classList.add('hidden');
  document.getElementById('regionalNext').classList.remove('hidden');
  document.getElementById('regionalInput').disabled = true;
};

App.nextRegionalWord = function() {
  var r = App.state.regional;
  r.index++;
  if (r.index >= r.words.length) {
    App.showRegionalResults();
  } else {
    App.showRegionalWord();
  }
};

App.showRegionalResults = function() {
  if (App.state.currentAudio) {
    App.state.currentAudio.pause();
    App.state.currentAudio = null;
  }
  speechSynthesis.cancel();

  var r = App.state.regional;
  document.getElementById('regionalActive').classList.add('hidden');
  document.getElementById('regionalResults').classList.remove('hidden');

  var total = r.words.length;
  var score = r.score;
  var pct = Math.round(score / total * 100);

  document.getElementById('regionalResultsScore').textContent = score + ' / ' + total + ' (' + pct + '%)';

  var gradeEl = document.getElementById('regionalGrade');
  var grade, gradeClass;
  if (pct >= 90) { grade = 'A'; gradeClass = 'grade-a'; }
  else if (pct >= 80) { grade = 'B'; gradeClass = 'grade-b'; }
  else if (pct >= 70) { grade = 'C'; gradeClass = 'grade-c'; }
  else if (pct >= 60) { grade = 'D'; gradeClass = 'grade-d'; }
  else { grade = 'F'; gradeClass = 'grade-f'; }
  gradeEl.innerHTML = '<span class="grade-letter ' + gradeClass + '">' + grade + '</span>';

  // Student info
  var infoEl = document.getElementById('regionalStudentInfo');
  var dateStr = r.startTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var timeStr = r.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  infoEl.innerHTML = '<div class="regional-info-row"><strong>Student:</strong> ' + App.escapeHtml(r.studentName) + '</div>' +
    '<div class="regional-info-row"><strong>Meet:</strong> ' + App.escapeHtml(r.meetName) + '</div>' +
    '<div class="regional-info-row"><strong>Date:</strong> ' + dateStr + ' at ' + timeStr + '</div>';

  // Show/hide missed review button
  var missed = r.results.filter(function(res) { return !res.correct; });
  document.getElementById('regionalReviewMissed').style.display = missed.length > 0 ? '' : 'none';

  // Results list
  var list = document.getElementById('regionalResultsList');
  var html = '';

  // Main words
  var mainResults = r.results.filter(function(res) { return res.section === 'main'; });
  if (mainResults.length > 0) {
    html += '<h3 class="regional-section-header">Part II: Words 1-70</h3>';
    html += mainResults.map(function(res) {
      return '<div class="result-item">' +
        '<span class="result-num">' + res.number + '.</span>' +
        '<span class="result-icon ' + (res.correct ? 'result-correct' : 'result-wrong') + '">' + (res.correct ? '\u2713' : '\u2717') + '</span>' +
        '<span><strong>' + App.escapeHtml(res.word) + '</strong>' + (res.outside ? ' <span class="outside-badge">*outside</span>' : '') + '</span>' +
        (!res.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(res.answer) + '</span>' : '') +
        '</div>';
    }).join('');
  }

  // Tiebreaker
  var tbResults = r.results.filter(function(res) { return res.section === 'tiebreaker'; });
  if (tbResults.length > 0) {
    html += '<h3 class="regional-section-header">Tiebreaker: Words 1-20</h3>';
    html += tbResults.map(function(res) {
      return '<div class="result-item">' +
        '<span class="result-num">' + (res.number - r.mainWordCount) + '.</span>' +
        '<span class="result-icon ' + (res.correct ? 'result-correct' : 'result-wrong') + '">' + (res.correct ? '\u2713' : '\u2717') + '</span>' +
        '<span><strong>' + App.escapeHtml(res.word) + '</strong>' + (res.outside ? ' <span class="outside-badge">*outside</span>' : '') + '</span>' +
        (!res.correct ? '<span class="result-answer">You typed: ' + App.escapeHtml(res.answer) + '</span>' : '') +
        '</div>';
    }).join('');
  }

  list.innerHTML = html;

  // Reset submit status
  document.getElementById('regionalSubmitStatus').classList.add('hidden');
};

// ==================== PDF GENERATION ====================
App.downloadRegionalPDF = function() {
  var r = App.state.regional;
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    alert('PDF library is still loading. Please wait a moment and try again.');
    return;
  }

  var jsPDF = (window.jspdf && window.jspdf.jsPDF) || jspdf.jsPDF;
  var doc = new jsPDF();
  var y = 20;
  var pageW = doc.internal.pageSize.getWidth();
  var margin = 15;
  var lineH = 6;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('UIL Spelling Regional Test Report', pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(r.meetName, pageW / 2, y, { align: 'center' });
  y += 12;

  // Student info
  doc.setFontSize(11);
  var dateStr = r.startTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var timeStr = r.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  doc.setFont('helvetica', 'bold');
  doc.text('Student:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(r.studentName, margin + 25, y);
  y += lineH;

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr + ' at ' + timeStr, margin + 25, y);
  y += lineH;

  // Score summary
  var total = r.words.length;
  var mainResults = r.results.filter(function(res) { return res.section === 'main'; });
  var mainCorrect = mainResults.filter(function(res) { return res.correct; }).length;
  var tbResults = r.results.filter(function(res) { return res.section === 'tiebreaker'; });
  var tbCorrect = tbResults.filter(function(res) { return res.correct; }).length;
  var pct = Math.round(r.score / total * 100);

  y += 4;
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, pageW - 2 * margin, 22, 3, 3, 'FD');
  y += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Score: ' + r.score + ' / ' + total + ' (' + pct + '%)', pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  var breakdown = 'Part II: ' + mainCorrect + '/' + mainResults.length;
  if (tbResults.length > 0) breakdown += '  |  Tiebreaker: ' + tbCorrect + '/' + tbResults.length;
  doc.text(breakdown, pageW / 2, y, { align: 'center' });
  y += 14;

  // Word-by-word table
  function drawTableHeader(yPos) {
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, yPos, pageW - 2 * margin, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('#', margin + 3, yPos + 5);
    doc.text('Correct Spelling', margin + 15, yPos + 5);
    doc.text('Student Answer', margin + 85, yPos + 5);
    doc.text('Result', pageW - margin - 15, yPos + 5);
    doc.setTextColor(0, 0, 0);
    return yPos + 9;
  }

  function drawRow(yPos, result, displayNum) {
    // Alternate row background
    if (displayNum % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPos - 4, pageW - 2 * margin, lineH, 'F');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(String(displayNum), margin + 3, yPos);
    doc.text(result.word + (result.outside ? ' *' : ''), margin + 15, yPos);
    doc.text(result.answer, margin + 85, yPos);

    if (result.correct) {
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
      doc.text('CORRECT', pageW - margin - 15, yPos);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('WRONG', pageW - margin - 15, yPos);
    }
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    return yPos + lineH;
  }

  // Main words section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Part II: Words 1-' + mainResults.length, margin, y);
  y += 3;
  y = drawTableHeader(y);

  for (var i = 0; i < mainResults.length; i++) {
    if (y > 270) {
      doc.addPage();
      y = 20;
      y = drawTableHeader(y);
    }
    y = drawRow(y, mainResults[i], i + 1);
  }

  // Tiebreaker section
  if (tbResults.length > 0) {
    y += 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Tiebreaker: Words 1-' + tbResults.length, margin, y);
    y += 3;
    y = drawTableHeader(y);

    for (var j = 0; j < tbResults.length; j++) {
      if (y > 270) {
        doc.addPage();
        y = 20;
        y = drawTableHeader(y);
      }
      y = drawRow(y, tbResults[j], j + 1);
    }
  }

  // Footer on last page
  y += 10;
  if (y > 275) { doc.addPage(); y = 20; }
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('* = outside word  |  Generated by UIL Spelling & Vocabulary Practice Tool  |  ' + dateStr, pageW / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Save
  var filename = 'UIL-Regional-' + r.meetName.replace(/[^a-zA-Z0-9]/g, '-') + '-' + r.studentName.replace(/[^a-zA-Z0-9]/g, '-') + '.pdf';
  doc.save(filename);
};

// ==================== GOOGLE FORM SUBMISSION ====================
App.submitToGoogleForm = function() {
  var r = App.state.regional;
  var statusEl = document.getElementById('regionalSubmitStatus');

  var total = r.words.length;
  var pct = Math.round(r.score / total * 100);
  var dateStr = r.startTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var timeStr = r.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Build form data matching Google Form fields
  var formData = new URLSearchParams();
  formData.append(REGIONAL_CONFIG.FIELD_STUDENT_NAME, r.studentName);
  formData.append(REGIONAL_CONFIG.FIELD_MEET_NAME, r.meetName);
  formData.append(REGIONAL_CONFIG.FIELD_SCORE, r.score + '/' + total + ' (' + pct + '%)');
  formData.append(REGIONAL_CONFIG.FIELD_DATE, dateStr + ' at ' + timeStr);

  statusEl.classList.remove('hidden');
  statusEl.className = 'regional-submit-status regional-submit-pending';
  statusEl.textContent = 'Submitting scores...';

  fetch(REGIONAL_CONFIG.GOOGLE_FORM_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  }).then(function() {
    statusEl.className = 'regional-submit-status regional-submit-success';
    statusEl.innerHTML = 'Scores submitted successfully! Your professor will see the results in their Google Sheet.';
  }).catch(function() {
    statusEl.className = 'regional-submit-status regional-submit-error';
    statusEl.innerHTML = 'Submission failed. Please download the PDF report and email it to your professor instead.';
  });
};

// ==================== REVIEW MISSED ====================
App.reviewRegionalMissed = function() {
  var missed = App.state.regional.results.filter(function(res) { return !res.correct; });
  if (missed.length === 0) return;

  App.state.studyDeck = missed.map(function(res) {
    return App.state.words.find(function(w) {
      return w.word.toLowerCase() === res.word.toLowerCase();
    }) || { id: -1, word: res.word, alt: null, vocab: false, number: 0 };
  });
  App.state.currentCard = 0;

  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
  document.querySelector('[data-tab="study"]').classList.add('active');
  document.getElementById('tab-study').classList.add('active');

  App.showCard();
};

// ==================== EMAIL RESULTS ====================
App.emailRegionalResults = function() {
  var r = App.state.regional;
  var total = r.words.length;
  var pct = Math.round(r.score / total * 100);
  var dateStr = r.startTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var timeStr = r.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  var subject = 'UIL Regional Test Results - ' + r.studentName + ' - ' + r.meetName;

  var body = 'UIL Spelling Regional Test Results\n';
  body += '================================\n\n';
  body += 'Student: ' + r.studentName + '\n';
  body += 'Meet: ' + r.meetName + '\n';
  body += 'Date: ' + dateStr + ' at ' + timeStr + '\n';
  body += 'Score: ' + r.score + '/' + total + ' (' + pct + '%)\n\n';

  var mainResults = r.results.filter(function(res) { return res.section === 'main'; });
  var mainCorrect = mainResults.filter(function(res) { return res.correct; }).length;
  body += 'Part II: ' + mainCorrect + '/' + mainResults.length + '\n';

  var tbResults = r.results.filter(function(res) { return res.section === 'tiebreaker'; });
  if (tbResults.length > 0) {
    var tbCorrect = tbResults.filter(function(res) { return res.correct; }).length;
    body += 'Tiebreaker: ' + tbCorrect + '/' + tbResults.length + '\n';
  }

  body += '\n--- DETAILED RESULTS ---\n\n';

  body += 'PART II (Words 1-' + mainResults.length + ')\n';
  mainResults.forEach(function(res, i) {
    body += (i + 1) + '. ' + (res.correct ? 'CORRECT' : 'WRONG') + ' | Answer: ' + res.word + ' | Typed: ' + res.answer + '\n';
  });

  if (tbResults.length > 0) {
    body += '\nTIEBREAKER (Words 1-' + tbResults.length + ')\n';
    tbResults.forEach(function(res, i) {
      body += (i + 1) + '. ' + (res.correct ? 'CORRECT' : 'WRONG') + ' | Answer: ' + res.word + ' | Typed: ' + res.answer + '\n';
    });
  }

  var email = r.profEmail || REGIONAL_CONFIG.DEFAULT_PROF_EMAIL || '';
  var mailto = 'mailto:' + encodeURIComponent(email) +
    '?subject=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);

  window.open(mailto, '_blank');
};
