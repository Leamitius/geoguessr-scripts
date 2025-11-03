// ==UserScript==
// @name         Remove Extenssr Nav Item
// @namespace    http://tampermonkey.net/
// @version      1.0
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @description  Removes elements with data-qa="extenssr__nav-item"
// @match        *://*.geoguessr.com/*
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function removeExtenssrNavItems() {
        document.querySelectorAll('[data-qa="extenssr__nav-item"]').forEach(el => el.remove());

    }

    // Run once on page load
    removeExtenssrNavItems();

    // Watch for dynamically added elements
    const observer = new MutationObserver(removeExtenssrNavItems);
    observer.observe(document.body, { childList: true, subtree: true });
})();