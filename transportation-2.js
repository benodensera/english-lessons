// ══════════════════════════════════════════
// AUDIO — Web Speech API
// ══════════════════════════════════════════

function speak(text, lang) {

  if (!window.speechSynthesis) {
    alert('Your browser does not support audio playback.');
    return;
  }

  window.speechSynthesis.cancel();

  var u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'en-US';
  u.rate = 0.88;

  var selector = '.speak-btn[data-word="' + text + '"][data-lang="' + (lang || 'en-US') + '"]';
  var btns = document.querySelectorAll(selector);

  btns.forEach(function(b) {
    b.classList.add('speaking');
  });

  u.onend = function() {
    btns.forEach(function(b) {
      b.classList.remove('speaking');
    });
  };

  window.speechSynthesis.speak(u);

}



// ══════════════════════════════════════════
// CHECKLIST — localStorage persistence
// ══════════════════════════════════════════

var TOTAL = 5;
var state = JSON.parse(localStorage.getItem('transp-p2-wrapup') || '[]');


function renderChecklist() {

  var done = 0;

  document.querySelectorAll('#wrapup-checklist li').forEach(function(li) {
    var i = parseInt(li.getAttribute('data-i'));

    if (state.indexOf(i) > -1) {
      li.classList.add('done');
      done++;
    } else {
      li.classList.remove('done');
    }
  });

  // update counter text
  document.getElementById('check-count').textContent = done + ' / ' + TOTAL;

  // update progress bar width
  document.getElementById('prog-fill').style.width = (done / TOTAL * 100) + '%';

  // show or hide completion message
  var msg = document.getElementById('all-done-msg');

  if (done === TOTAL) {
    msg.classList.add('show');
  } else {
    msg.classList.remove('show');
  }

}


function toggle(li) {

  var i = parseInt(li.getAttribute('data-i'));
  var idx = state.indexOf(i);

  if (idx > -1) {

    // already checked — remove it
    state.splice(idx, 1);

  } else {

    // not checked — add it and animate
    state.push(i);

    var cb = li.querySelector('.check-box');
    cb.classList.add('popping');

    setTimeout(function() {
      cb.classList.remove('popping');
    }, 260);

  }

  // save to localStorage
  localStorage.setItem('transp-p2-wrapup', JSON.stringify(state));

  renderChecklist();

}


// restore saved state on page load
document.addEventListener('DOMContentLoaded', renderChecklist);