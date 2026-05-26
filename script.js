// audio player + tooltip

const player = document.getElementById("player");
const tooltip = document.getElementById("tooltip");
player.volume = 1;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function showTooltip(el, message) {
    const rect = el.getBoundingClientRect();
    tooltip.textContent = message;
    tooltip.style.left = `${window.scrollX + rect.left + rect.width / 2}px`;
    tooltip.style.top = `${window.scrollY + rect.top - 10}px`;
    tooltip.classList.add("show");

    clearTimeout(tooltip._hideTimer);
    tooltip._hideTimer = setTimeout(() => tooltip.classList.remove("show"), 2200);
}

function hideTooltip() {
    tooltip.classList.remove("show");
}

async function ensureAudioReady() {
    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }
}

async function playLocalFallback(el) {
    const fallbackAudio = el.dataset.fallbackAudio;
    if (!fallbackAudio) return false;

    try {
        await ensureAudioReady();
        player.pause();
        player.src = fallbackAudio;
        player.load();
        await player.play();
        return true;
    } catch (err) {
        console.error("local fallback failed", err);
        return false;
    }
}

async function measureRmsFromUrl(url) {
    await ensureAudioReady();
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = decoded.getChannelData(0);

    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
        sumSquares += channelData[i] * channelData[i];
    }

    const rms = Math.sqrt(sumSquares / channelData.length);
    return { decoded, rms };
}

async function playDecodedBuffer(decoded, boost = 1) {
    await ensureAudioReady();

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = decoded;
    gainNode.gain.value = boost;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start();

    await new Promise((resolve) => {
        source.onended = resolve;
    });
}

async function playMeasuredAudio(url, threshold = 0.04, boost = 1.8, el = null) {
    const { decoded, rms } = await measureRmsFromUrl(url);
    const isStrong = el?.classList.contains("strong-audio");
    const gain = isStrong ? Math.max(boost, 4.0) : rms < threshold ? boost : 1;
    await playDecodedBuffer(decoded, gain);
    return { rms, boosted: gain > 1 };
}

async function playWordSequence(words, el = null) {
    for (const word of words) {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        const res = await fetch(url);
        const data = await res.json();
        const audioUrl = data?.[0]?.phonetics?.find((p) => p.audio)?.audio;
        if (!audioUrl) continue;

        const finalUrl = audioUrl.startsWith("//") ? `https:${audioUrl}` : audioUrl;
        await playMeasuredAudio(finalUrl, 0.04, 1.8, el);
    }
}

document.addEventListener("click", async (e) => {
    const el = e.target.closest(".pronounceable");
    if (!el) return;

    hideTooltip();
    await ensureAudioReady();

    const word = el.dataset.word.trim();
    const fallbackAudio = el.dataset.fallbackAudio;

    try {
        if (fallbackAudio) {
            if (await playLocalFallback(el)) return;
        }

        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        const res = await fetch(url);
        const data = await res.json();
        const audioUrl = data?.[0]?.phonetics?.find((p) => p.audio)?.audio;

        if (audioUrl) {
            const finalUrl = audioUrl.startsWith("//") ? `https:${audioUrl}` : audioUrl;
            await playMeasuredAudio(finalUrl, 0.04, 1.8, el);
            return;
        }

        if (word.includes(" ")) {
            try {
                await playWordSequence(word.split(/\s+/), el);
                return;
            } catch (seqErr) {
                console.error(seqErr);
            }
        }

        showTooltip(el, "sorry, no pronunciation audio found for this word");
    } catch (err) {
        if (!fallbackAudio) {
            if (word.includes(" ")) {
                try {
                    await playWordSequence(word.split(/\s+/), el);
                    return;
                } catch (seqErr) {
                    console.error(seqErr);
                }
            }
        }

        showTooltip(el, "sorry, no pronunciation audio found for this word");
        console.error(err);
    }
});

document.addEventListener("scroll", hideTooltip, true);
window.addEventListener("resize", hideTooltip);



// progress bar for tasks

var TOTAL = 5;
var state = JSON.parse(localStorage.getItem("transp-p2-wrapup") || "[]");

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

    localStorage.setItem("transp-p2-wrapup", JSON.stringify(state));
    renderChecklist();
}

document.addEventListener("DOMContentLoaded", renderChecklist);
