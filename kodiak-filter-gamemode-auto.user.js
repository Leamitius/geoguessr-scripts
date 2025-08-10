// ==UserScript==
// @name         Kodiak Filter Gamemode automatic
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Submits score to API and overrides "Weiter" button with full debug logging enabled.
// @author       Mael
// @icon         https://static-cdn.jtvnw.net/jtv_user_pictures/18dd44f1-9431-488c-a88f-74b363f52579-profile_image-70x70.png
// @match        https://www.geoguessr.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js?v=15
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-streak-framework.min.js?v=15
// @downloadURL  https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/kodiak-filter-gamemode-auto.user.js
// @updateURL    https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/kodiak-filter-gamemode-auto.user.js
// ==/UserScript==


const DEBUG = true;
const API_ENDPOINT = 'https://pihezigo.myhostpoint.ch/api.php?action=submit_score';
const USERNAME = 'USER'; // <-- Enter Username (replace 'USER')
const TIMEOUT = 60000; // after 60 seconds of inactivity the script will stop working


var streak = 0;

var text = "";

var ready = false; // Flag to check if the page is ready

function log(...args) {
    if (DEBUG) console.log('[GeoTamper]', ...args);
}

if (!GeoGuessrEventFramework) {
    throw new Error('GeoGuessr World Score Reference requires GeoGuessr Event Framework');
}

const keyMap = {
    "Grayscale": "extenssr-grayscale",
    "Invert colours": "extenssr-invert",
    "Sepia effect": "extenssr-sepia",
    "Mirror": "extenssr-mirror",
    "Fish eye lens": "extenssr-fisheye",
    "CTR TV filter": "extenssr-chromaticAberration",
    "Edge filter": "extenssr-sobel",
    "Vignette": "extenssr-vignette",
    "Water effect": "extenssr-water",
    "Min filter": "extenssr-min",
    "Screen scambler": "extenssr-scramble",
};



const LANGUAGE = "de";   // ISO 639-1 language code - https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
const CHALLENGE = true;  // Set to false to disable streaks on challenge links
const AUTOMATIC = true;  // Set to false for a manual counter (controlled by keyboard shortcuts only)



function sendScore(score, gameId) {
    if (streak) {
        let lastStreakRelevant = null;

        const interval = setInterval(() => {
            const raw = localStorage.getItem("KodiakChallengeCountryStreak");
            if (!raw) return;

            try {
                const parsed = JSON.parse(raw);

                // last_guess_identifier ignorieren
                const { last_guess_identifier, ...relevant } = parsed;

                if (!lastStreakRelevant) {
                    lastStreakRelevant = relevant;
                    return; // Erste Runde: nur speichern, nicht vergleichen
                }

                // Vergleiche alte und neue relevante Felder
                const differences = [];
                for (const key of Object.keys(relevant)) {
                    if (relevant[key] !== lastStreakRelevant[key]) {
                        differences.push({
                            key,
                            old: lastStreakRelevant[key],
                            new: relevant[key]
                        });
                    }
                }

                if (differences.length > 0) {
                    console.log("🕵️ Änderungen erkannt:");
                    differences.forEach(diff => {
                        console.log(` - ${diff.key}:`, diff.old, "→", diff.new);
                    });

                    lastStreakRelevant = { ...relevant }; // Update Zustand

                    // Score berechnen
                    let calculatedScore = 0;
                    if (relevant.guess_name === relevant.location_name) {
                        console.log("✅ Richtiges Land: " + relevant.guess_name);
                        calculatedScore = 1;
                    } else {
                        console.log("❌ Falsches Land: " + relevant.guess_name + " ≠ " + relevant.location_name);
                        calculatedScore = 0;
                    }

                    clearInterval(interval); // ⛔ Stoppe Überwachung
                    log("📊 Final score for streak:", calculatedScore);
                    actuallySendScore(calculatedScore, gameId);
                }

            } catch (err) {
                console.warn("❗ Fehler beim Parsen oder Vergleichen:", err);
            }
        }, 100);
    } else {
        // Streak aus → direkt senden
        log("➡️ Streak deaktiviert, übergebe Score direkt:", score);
        actuallySendScore(score, gameId);
    }

    function actuallySendScore(finalScore, gameId) {
        const payload = {
            username: USERNAME,
            score: finalScore,
            gameId: gameId || null
        };

        log("📤 Sende an API:", payload);

        fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => {
                log("🌐 API Status:", res.status);
                return res.json().catch(() => {
                    log("⚠️ API-Antwort ist kein JSON");
                    return { error: "Invalid JSON response" };
                });
            })
            .then(data => {
                log("✅ API Antwort:", data);
            })
            .catch(err => {
                log("❌ Fehler beim Senden an API:", err);
            });
    }
}


async function fetchAndStoreUserFeatures() {
    const username = USERNAME; // your hardcoded username
    const oldBlinkTime = localStorage.getItem('blinkTime');
    const reloaded = localStorage.getItem("reloaded", false)

    try {

        const res = await fetch("https://pihezigo.myhostpoint.ch/api.php?action=get_streak");
        const streakdata = await res.json();

        streak = streakdata.streak;
        log(streak);

        const response = await fetch(`https://pihezigo.myhostpoint.ch/api.php?action=get_features&username=${encodeURIComponent(username)}`);
        const data = await response.json();

        const testres = await fetch(`https://pihezigo.myhostpoint.ch/api.php?action=get_text&username=${encodeURIComponent(username)}`);
        text = await testres.json();
        const filter = text.text.split(", ");
        log(filter)
        ready = true; // Set the flag to true when data is ready

        //set all key to false

        Object.values(keyMap).forEach(key => {
            if (key !== "50" && key !== "25") {
                localStorage.setItem(key, "false");
                log(`Set ${key} to false in localStorage`);
            }
        });
        localStorage.setItem("extenssr-pixelateMap", false);


        // filter.forEach(name => {

        //     const key = keyMap[name];
        //     if (key) {
        //         if (key === "50" || key === "25") {
        //             localStorage.setItem("extenssr-pixelateMap", true);
        //             localStorage.setItem("extenssr-pixelateScale", 300 * parseInt(key) / 100)
        //             log("set pixelateMap to true and pixelateScale to " + 300 * parseInt(key) / 100);
        //         }
        //         else {
        //             localStorage.setItem(key, "true");
        //             log(`Set ${key} to true in localStorage`);
        //         }

        //     } else {
        //         log(`No mapping found for "${name}"`);
        //     }
        // });

        filter.forEach(name => {

            const key = keyMap[name];
            if (key) {
                localStorage.setItem(key, "true");
                log(`Set ${key} to true in localStorage`);
            } else {
                if (name.startsWith("Pixelate")) {
                    // name = "Pixelate 30%"
                    // Extract the number after Pixelate (supports float) without %
                    const match = name.match(/Pixelate ([\d.]+)/);
                    const pixelateNumber = match ? parseFloat(match[1]) : null;
                    localStorage.setItem("extenssr-pixelateMap", true);
                    localStorage.setItem("extenssr-pixelateScale", 300 * pixelateNumber / 100)
                    log("set pixelateMap to true and pixelateScale to " + 300 * pixelateNumber / 100);

                }
                else {
                    log(`No mapping found for "${name}"`);

                }
            }
        });







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
        } else {
            console.log('blinkTime unchanged, no reload.');
        }
        if (reloaded !== "true") {
            localStorage.setItem("reloaded", "true");
            location.reload();
            return;
        }
        localStorage.setItem("reloaded", "false");

    } catch (err) {
        console.error("❌ Failed to fetch user features:", err);
    }
}






function overrideWeiterButtonIfNeeded() {
    const maxRetries = 50; // retry for ~5 seconds if interval is 100ms
    let attempts = 0;

    const interval = setInterval(() => {
        const button = document.querySelector('button[data-qa="close-round-result"]');


        // Wiederhole regelmäßig den Versuch, das Element einzufügen

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

    }, 100); // check every 100ms
}

function waitForRoundToStart(callback) {
    const state = JSON.parse(localStorage.getItem('GeoGuessrEventFramework_STATE'));
    if (state && state.round_in_progress) {
        callback();
    } else {
        // log("Waiting for round to start...");
        setTimeout(() => waitForRoundToStart(callback), 100);
    }
}



fetch(`https://pihezigo.myhostpoint.ch/api.php?action=get_text&username=${encodeURIComponent(USERNAME)}`)
    .then(res => res.json())
    .then(data => {
        var diffMS = new Date() - new Date(data.timestamp.replace(' ', 'T'));
        log("Time difference in milliseconds:", diffMS);
        if (diffMS > TIMEOUT) {
            localStorage.setItem("kodiak-enable", "false");
        }
        else {
            localStorage.setItem("kodiak-enable", "true");
        }
    })
    .then(() => {
        if (localStorage.getItem("kodiak-enable") === "true") {

            const GSF = new GeoGuessrStreakFramework({
                storage_identifier: 'KodiakChallengeCountryStreak',
                name: 'Country Streak',
                terms: {
                    single: 'country',
                    plural: 'countries'
                },
                enabled_on_challenges: CHALLENGE,
                automatic: AUTOMATIC,
                language: LANGUAGE,
                only_match_country_code: true,
                address_matches: ['country'],
            });


            GeoGuessrEventFramework.init()
                .then(GEF => {
                    fetchAndStoreUserFeatures();

                    waitForRoundToStart(() => {
                        log("init frame");
                        GEF.events.addEventListener('round_end', (event) => {

                            log('🎯 round_end detected');
                            log(event);

                            overrideWeiterButtonIfNeeded();

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
                });

        }
        else {
            let resetCount = 0;
            let changed = false;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("extenssr-")) {
                    if (localStorage.getItem(key) !== "false") {
                        localStorage.setItem(key, "false");
                        resetCount++;
                        changed = true;
                    }
                }
            }
            console.log("Reset extenssr keys:", resetCount);
            sendResponse({ success: true, resetCount });
            if (changed) {
                location.reload();
            } else {
                console.log("No extenssr keys needed resetting, no reload.");
            }
        }
    });