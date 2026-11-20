/* Nirala Support - page search
   Sirf is page ke links ko filter karta hai. Koi data bahar nahi bhejta,
   koi cookie ya storage use nahi karta, innerHTML/eval nahi. */
(function () {
  'use strict';

  var input = document.getElementById('searchInput');
  var button = document.getElementById('searchBtn');
  var noResult = document.getElementById('noResult');
  if (!input || !button || !noResult) { return; }

  // Hindi <-> English / Hinglish shabd, taaki "ration" likhne par "राशन" bhi mile.
  var ALIASES = [
    [/राशन|ration/i, 'ration rashan raashan राशन'],
    [/जाति|caste/i, 'caste jati jaati जाति'],
    [/आय|income/i, 'income aay आय'],
    [/निवास|आवासीय|residence|domicile/i, 'residence domicile niwas nivas awasiya निवास'],
    [/छात्रवृत्ति|scholarship/i, 'scholarship chhatravriti chatravritti छात्रवृत्ति'],
    [/पेंशन|pension/i, 'pension penshan पेंशन'],
    [/किसान|kisan/i, 'kisan farmer kisaan किसान'],
    [/आवास|awas/i, 'awas house ghar आवास'],
    [/आयुष्मान|ayushman|pmjay/i, 'ayushman arogya health card आयुष्मान'],
    [/उज्ज्वला|ujjwala|lpg/i, 'ujjwala gas lpg cylinder उज्ज्वला'],
    [/श्रमिक|shram|labour/i, 'shramik labour mazdoor श्रमिक'],
    [/जमीन|भूमि|bhumi|खतियान|जमाबंदी/i, 'jamin zameen bhumi land khatiyan jamabandi जमीन'],
    [/पुलिस|police/i, 'police पुलिस'],
    [/रिजल्ट|परिणाम|result/i, 'result parinam रिजल्ट'],
    [/भर्ती|vacancy|job|रोजगार/i, 'job jobs vacancy bharti naukri rojgar भर्ती'],
    [/महिला|mahila|women/i, 'mahila women female महिला'],
    [/आधार|aadhaar|aadhar/i, 'aadhaar aadhar adhar आधार'],
    [/पैन|pan card/i, 'pan card पैन'],
    [/ड्राइविंग|driving|parivahan/i, 'driving licence license dl vehicle parivahan']
  ];

  function normalize(text) {
    return String(text || '')
      .normalize('NFC')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function haystackFor(el) {
    var text = el.textContent || '';
    var extra = '';
    var links = el.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      extra += ' ' + (links[i].getAttribute('href') || '');
    }
    for (var j = 0; j < ALIASES.length; j++) {
      if (ALIASES[j][0].test(text)) { extra += ' ' + ALIASES[j][1]; }
    }
    return normalize(text + ' ' + extra);
  }

  // ---- Page ke saare "units" ek baar collect kar lein ----
  var groups = [];

  function collectGroups() {
    var selector = '.link-table-container, .jobs-table-container, .scholarship-table-container, .widget';
    var containers = document.querySelectorAll(selector);

    for (var c = 0; c < containers.length; c++) {
      var box = containers[c];
      var group = { box: box, units: [], rows: [] };

      var lis = box.querySelectorAll('li');
      for (var l = 0; l < lis.length; l++) {
        if (lis[l].querySelector('a')) {
          group.units.push({ el: lis[l], text: haystackFor(lis[l]) });
        }
      }

      var trs = box.querySelectorAll('tr');
      for (var r = 0; r < trs.length; r++) {
        var tr = trs[r];
        if (tr.querySelector('th')) { continue; }
        // Jobs table ke andar li pehle hi ginay ja chuke hain
        if (tr.querySelector('li')) { continue; }
        var anchors = tr.querySelectorAll('a');
        if (!anchors.length) { continue; }

        if (anchors.length === 1) {
          group.units.push({ el: tr, text: haystackFor(tr) });
        } else {
          // Ek row me kai links: har cell alag filter hoga
          var cells = tr.querySelectorAll(':scope > td');
          var rowUnits = [];
          for (var t = 0; t < cells.length; t++) {
            if (cells[t].querySelector('a')) {
              var unit = { el: cells[t], text: haystackFor(cells[t]) };
              group.units.push(unit);
              rowUnits.push(unit);
            }
          }
          group.rows.push({ el: tr, units: rowUnits });
        }
      }

      if (group.units.length) { groups.push(group); }
    }
  }

  function matches(text, words) {
    for (var i = 0; i < words.length; i++) {
      if (text.indexOf(words[i]) === -1) { return false; }
    }
    return true;
  }

  function run() {
    var q = normalize(input.value);
    var words = q ? q.split(' ') : [];
    var anyVisible = false;

    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var groupVisible = false;

      for (var u = 0; u < group.units.length; u++) {
        var unit = group.units[u];
        var show = words.length === 0 || matches(unit.text, words);
        unit.shown = show;
        unit.el.hidden = !show;
        if (show) { groupVisible = true; }
      }

      for (var r = 0; r < group.rows.length; r++) {
        var row = group.rows[r];
        var rowShown = false;
        for (var k = 0; k < row.units.length; k++) {
          if (row.units[k].shown) { rowShown = true; break; }
        }
        row.el.hidden = !rowShown;
      }

      group.box.hidden = !groupVisible;
      if (groupVisible) { anyVisible = true; }
    }

    noResult.hidden = words.length === 0 || anyVisible;
  }

  var timer = null;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      run();
    } else if (event.key === 'Escape') {
      input.value = '';
      run();
    }
  });

  button.addEventListener('click', function (event) {
    event.preventDefault();
    run();
    var firstVisible = document.querySelector('.main-content > div:not([hidden])');
    if (firstVisible && input.value.trim() && firstVisible.scrollIntoView) {
      firstVisible.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  collectGroups();
})();
