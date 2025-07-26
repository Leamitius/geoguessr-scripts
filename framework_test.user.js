// ==UserScript==
// @name         fraework test
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Submits score to API and overrides "Weiter" button with full debug logging enabled.
// @author       Mael
// @icon         https://static-cdn.jtvnw.net/jtv_user_pictures/18dd44f1-9431-488c-a88f-74b363f52579-profile_image-70x70.png
// @match        https://www.geoguessr.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js?v=15
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-streak-framework.min.js?v=15
// @downloadURL  https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/framework_test.user.js
// @updateURL    https://github.com/Leamitius/geoguessr-scripts/raw/refs/heads/main/framework_test.user.js
// ==/UserScript==

GeoGuessrEventFramework.init().then(GEF => {
    GEF.events.addEventListener('round_end', (event) => {
        alert("Round ended")
    });
});

