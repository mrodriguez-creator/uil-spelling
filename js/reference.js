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
};
