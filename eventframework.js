(function () {
    'use strict';

    function getURLFromFetchArgs(args) {
        let input = args[0];
        if (input instanceof Request) return new URL(input.url, location.href);
        if (input instanceof URL) return input;
        if (typeof input === 'string') return new URL(input, location.href);
        return null;
    }

    function currentGameId() {
        const parts = location.pathname.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : '';
    }

    function isExactGameFetch(u) {
        if (!u) return false;
        if (!/\.?geoguessr\.com$/i.test(u.hostname)) return false;
        const gid = currentGameId();
        if (!gid) return false;
        return u.pathname === `/api/v3/games/${gid}` && !u.search;
    }

    function triggerEvent(name, data) {
        console.log(`>>> Event: ${name}`, data);
        document.dispatchEvent(new CustomEvent(name, { detail: data }));
    }

    let lastFetchTimeout = null;

    // --- Intercept fetch ---
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        return originalFetch.apply(this, args).then(async response => {
            const u = getURLFromFetchArgs(args);
            if (isExactGameFetch(u)) {
                const cloned = response.clone();
                const data = await cloned.json().catch(() => null);

                // fetch → round_end
                clearTimeout(lastFetchTimeout);
                lastFetchTimeout = setTimeout(() => {
                    triggerEvent("round_end", { fetchResponse: data });
                }, 300);
            }
            return response;
        });
    };

    // --- Intercept XHR ---
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._isTarget = typeof url === 'string' && url.includes('GetMetadata');
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (this._isTarget) {
            this.addEventListener('load', () => {
                try {
                    const data = JSON.parse(this.responseText);
                    // if no fetch fired → round_start
                    if (!lastFetchTimeout) {
                        triggerEvent("round_start", { xhrResponse: data });
                    }
                } catch (e) {
                    console.warn("XHR parse failed", e);
                }
            });
        }
        return originalSend.apply(this, arguments);
    };
})();




document.addEventListener("round_start", function (event) {
    localStorage.setItem("roundStatus", "started");

    // Handle round start logic here
});

document.addEventListener("round_end", function (event) {
    localStorage.setItem("roundStatus", "ended");
    // Handle round end logic here
});