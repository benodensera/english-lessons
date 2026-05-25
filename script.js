// audio: web speech API

function speak(text, lang) {
    if (!window.speechSynthesis) {
        alert("Your browser does not support audio playback.");
        return;
    }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "en-US";
    u.rate = 0.88;
    var btns = document.querySelectorAll(
        '.speak-btn[data-word="' + text + '"][data-lang="' + (lang || "en-US") + '"]',
    );
    btns.forEach(function (b) {
        b.classList.add("speaking");
    });
    u.onend = function () {
        btns.forEach(function (b) {
            b.classList.remove("speaking");
        });
    };
    window.speechSynthesis.speak(u);
}



// checklist with localStorage persistence

var TOTAL = 5;
var state = JSON.parse(localStorage.getItem("transp-p1-wrapup") || "[]");

function renderChecklist() {
    var done = 0;
    document.querySelectorAll("#wrapup-checklist li").forEach(function (li) {
        var i = parseInt(li.getAttribute("data-i"));
        if (state.indexOf(i) > -1) {
            li.classList.add("done");
            done++;
        } else {
            li.classList.remove("done");
        }
    });
    document.getElementById("check-count").textContent = done + " / " + TOTAL;
    document.getElementById("prog-fill").style.width = (done / TOTAL) * 100 + "%";
    var msg = document.getElementById("all-done-msg");
    if (done === TOTAL) {
        msg.classList.add("show");
    } else {
        msg.classList.remove("show");
    }
}

function toggle(li) {
    var i = parseInt(li.getAttribute("data-i"));
    var idx = state.indexOf(i);
    if (idx > -1) {
        state.splice(idx, 1);
    } else {
        state.push(i);
        var cb = li.querySelector(".check-box");
        cb.classList.add("popping");
        setTimeout(function () {
            cb.classList.remove("popping");
        }, 260);
    }
    localStorage.setItem("transp-p1-wrapup", JSON.stringify(state));
    renderChecklist();
}

document.addEventListener("DOMContentLoaded", renderChecklist);
