// ==UserScript==
// @name         GeoGuessr Eventframework with Responses
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Trigger round_start and round_end with response data
// @match        https://www.geoguessr.com/*
// @grant        none
// @run-at       document-start
// @grant        unsafeWindow
// @require      https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/eventframework.js
// @downloadURL  https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/framework_test.user.js
// @updateURL    https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/framework_test.user.js
// ==/UserScript==





document.addEventListener('round_start', (event) => {
    console.log('Round started!');
    // console.log('XHR response:', event.detail.xhrResponse);
});

document.addEventListener('round_end', (event) => {
    console.log('Round ended!', event);

    const guesses = event.detail.fetchResponse.player.guesses;
    //last object of guesses array
    const lastguess = guesses[guesses.length - 1].roundScoreInPoints;
    console.log('Fetch response:', lastguess);
    const rounds = event.detail.fetchResponse.rounds;
    const lastRoundCC = rounds[rounds.length - 1].streakLocationCode;
    console.log("steeak:", lastRoundCC);


    const lat = guesses[guesses.length -1].lat;
    const lng = guesses[guesses.length -1].lng;
// https://nominatim.openstreetmap.org/reverse.php?lat=-43.53097&lon=172.63691&zoom=18&format=jsonv2
    fetch(`https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lng}&zoom=2&format=jsonv2`)
        .then(response => response.json())
        .then(data => {
            const countryCode = data.address.country_code

            if (countryCode !== lastRoundCC) {
                console.warn(`Country code mismatch: ${countryCode} vs ${lastRoundCC}`);
            }
            else {
                console.log(`Country code match: ${countryCode}`);
            }
            // You can do something with the address here, like displaying it in the UI
        })
        .catch(error => {
            console.error('Error fetching address:', error);
        });
});