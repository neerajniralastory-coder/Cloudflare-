(function () {
  'use strict';
  var input = document.getElementById('searchInput');
  var btn = document.getElementById('searchBtn');
  var msg = document.getElementById('noResult');
  if (!input) return;
  var items = document.querySelectorAll(
    '.main-content li, .sidebar li, .link-table-container td, .scholarship-table-container tr:not(:has(th))'
  );
  function run() {
    var q = input.value.trim().toLowerCase().slice(0, 80);
    var shown = 0;
    items.forEach(function (el) {
      var match = !q || el.textContent.toLowerCase().indexOf(q) !== -1;
      el.hidden = !match;
      if (match) shown++;
    });
    msg.hidden = shown !== 0;
  }
  input.addEventListener('input', run);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  if (btn) btn.addEventListener('click', run);
})();
