// ==UserScript==
// @name         GTE replay cover
// @namespace    http://tampermonkey.net/
// @version      1.8
// @icon         https://static-cdn.jtvnw.net/jtv_user_pictures/18dd44f1-9431-488c-a88f-74b363f52579-profile_image-70x70.png
// @description  Safely remove elements, rename first/second switch labels, auto-click 3rd round once, no flash, no React freeze
// @match        https://www.geoguessr.com/duels/*/replay*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 0️⃣ Prevent flash
    const hideStyle = document.createElement('style');
    hideStyle.textContent = `
        .health-bar-2_avatarContainer__Q1G0O,
        .health-bar-2_nickContainer__ZO0eM,
        .replay-footer_playedRoundsHeader__0sWNX {
            display: none !important;
        }
        .version4_layout__XumXk{
        --sidetray-compact-width: 0;
        }

    `;
    document.documentElement.appendChild(hideStyle);

    // 1️⃣ Elements to remove
    const classesToRemove = [
        'health-bar-2_avatarContainer__Q1G0O',
        'health-bar-2_nickContainer__ZO0eM',
        'replay-footer_playedRoundsHeader__0sWNX',
        "version4_headerWrapper__oyraB",
        "version4_sidebar__YO8X8"
    ];

    function removeElements() {
        for (const cls of classesToRemove) {
            document.querySelectorAll(`.${cls}`).forEach(el => el.remove());
        }
    }

    // 2️⃣ Safe rename (wait until React finished rendering them)
    function safeRenameLabels() {
        const labels = document.querySelectorAll('.switch_label__KrnMF');
        if (labels.length >= 2) {
            // only rename if both exist and have text already
            if ((labels[0].textContent.trim() && labels[1].textContent.trim())&& labels[0].textContent != 'Me') {
                labels[0].textContent = 'Me';
                labels[1].textContent = 'Opponent';


                console.log('✅ Labels safely renamed');
                return true;
            }
        }
        return false;
    }

    // 3️⃣ Click 3rd round once
    function clickRound(round) {
        const rounds = document.querySelectorAll('.game-summary_playedRound__VukPu.game-summary_compact__gm_o_');
        if (rounds.length >= 3) {
            const third = rounds[round-1];
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
            third.dispatchEvent(clickEvent);
            console.log('✅ Clicked 3rd round once');
        }
    }

    // 4️⃣ Apply everything
    function applyAll() {
        removeElements();
        safeRenameLabels();
    }


    const observer = new MutationObserver(applyAll);
    observer.observe(document.body, { childList: true, subtree: true });

    const newSrc = 'https://www.geoguessr.com/images/resize:auto:48:48/gravity:ce/plain/pin/fcb275d1f1f1ef366f4a44ef294fd1f0.png';

    // Beobachter erstellen
    const observer2 = new MutationObserver(() => {
        const img = document.querySelector('.styles_image__vpfH1');
        if (img) {
            img.src = newSrc;         // src ändern
            observer.disconnect();    // Beobachtung stoppen, wenn gefunden
            console.log('Bild gefunden und geändert!');
        }
    });

    // Beobachtung starten (auf dem gesamten Dokument)
    observer2.observe(document.body, {
        childList: true,
        subtree: true
    });


})();
