// ==UserScript==
// @name         Kodiak Filter Gamemode 
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Submits score to API and overrides "Weiter" button with full debug logging enabled.
// @author       Mael
// @icon         https://static-cdn.jtvnw.net/jtv_user_pictures/18dd44f1-9431-488c-a88f-74b363f52579-profile_image-70x70.png
// @match        https://www.geoguessr.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js?v=15
// @downloadURL  https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/kodiak-filter-gamemode.user.js
// @updateURL    https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/kodiak-filter-gamemode.user.js
// ==/UserScript==


const DEBUG = true;
const API_ENDPOINT = 'https://pihezigo.myhostpoint.ch/api.php?action=submit_score';
const USERNAME = 'mael'; // <-- Enter Username (replace 'USER')

function log(...args) {
    if (DEBUG) console.log('[GeoTamper]', ...args);
}

if (!GeoGuessrEventFramework) {
	throw new Error('GeoGuessr World Score Reference requires GeoGuessr Event Framework');
}


function sendScore(score, gameId) {

    const payload = {
        username: USERNAME,
        score: score,
        gameId: gameId || null
    };

    log('📤 Sending score to API:', payload);

    fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => {
        log('🌐 API status:', res.status);
        return res.json().catch(() => {
            log('⚠️ Response is not valid JSON');
            return { error: 'Invalid JSON response' };
        });
    })
        .then(data => {
        log('✅ API response:', data);
    })
        .catch(err => {
        log('❌ Fetch error:', err);
    });
}

async function fetchAndStoreUserFeatures() {
    const username = USERNAME; // your hardcoded username
    const oldBlinkTime = localStorage.getItem('blinkTime');

    try {
        const response = await fetch(`https://pihezigo.myhostpoint.ch/api.php?action=get_features&username=${encodeURIComponent(username)}`);
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.warn("Invalid data from feature API:", data);
            return;
        }

        // Assuming we only care about the last entry or first entry
        // If multiple entries, pick the first:
        const entry = data[0];
        if (!entry || !entry.value || !entry.status) {
            console.warn("Incomplete feature data:", entry);
            return;
        }

        const newBlinkTime = entry.value.toString();
        const newBlinkEnabled = entry.status;

        localStorage.setItem('blinkTime', newBlinkTime);
        localStorage.setItem('blinkEnabled', newBlinkEnabled);
        localStorage.setItem('delayTime', '1');

        console.log("✅ Features stored in localStorage:", {
            blinkTime: newBlinkTime,
            blinkEnabled: newBlinkEnabled,
            delayTime: '1'
        });

        if (oldBlinkTime !== newBlinkTime) {
            console.log('blinkTime changed, reloading page...');
            location.reload();
        } else {
            console.log('blinkTime unchanged, no reload.');
        }

    } catch (err) {
        console.error("❌ Failed to fetch user features:", err);
    }
}


function overrideWeiterButtonIfNeeded() {
    const maxRetries = 50; // retry for ~5 seconds if interval is 100ms
    let attempts = 0;

    const interval = setInterval(() => {
        const button = document.querySelector('button[data-qa="close-round-result"]');
        if (!button) {
            attempts++;
            if (attempts >= maxRetries) {
                log('⏱️ Timeout: "Weiter" button not found.');
                clearInterval(interval);
            }
            return;
        }

        clearInterval(interval); // stop checking once found

        if (button.dataset.tamperHandled) {
            log('🔘 Weiter button already handled.');
            return;
        }

        button.dataset.tamperHandled = 'true';
        const shouldGoBack = sessionStorage.getItem('roundJustEnded') === 'true';
        log('🔘 Weiter button found. Should go back?', shouldGoBack);

        if (shouldGoBack) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                sessionStorage.removeItem('roundJustEnded');
                log('🔙 Going back (window.history.back())');
                window.history.back();
            }, true);

            const labelSpan = button.querySelector('span.button_label__ERkjz');
            if (labelSpan) {
                labelSpan.textContent = 'Back';
                log('📝 Button label changed to "Back"');
            }
        }
    }, 100); // check every 100ms
}



fetchAndStoreUserFeatures();

GeoGuessrEventFramework.init().then(GEF => {
    GEF.events.addEventListener('round_end', (event) => {
        log('🎯 round_end detected');
        log(event);
        sessionStorage.setItem('roundJustEnded', 'true');

        overrideWeiterButtonIfNeeded()

        const state = event.detail;
        const roundData = state.rounds?.[state.rounds.length - 1] ?? {};
        const score = roundData.score.amount ?? null;
        const gameId = state.token ?? null;

        log('📊 Extracted score:', score, '| Game ID:', gameId);

        if (score !== null && !isNaN(score)) {
            sendScore(score, gameId);
        } else {
            log('⚠️ Invalid or missing score');
        }
    });
});
