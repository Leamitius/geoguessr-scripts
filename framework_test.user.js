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
    console.log('Round ended!');
    console.log('Fetch response:', event.detail.fetchResponse.player.guesses);
});