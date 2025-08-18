(function () {
    'use strict';

    function getURLFromFetchArgs(args) {
        let input = args[0];
        let href;
        try {
            if (input instanceof Request) href = input.url;
            else if (input instanceof URL) href = input.href;
            else if (typeof input === 'string') href = input;
            if (!href) return null;
            return new URL(href, location.href);
        } catch {
            return null;
        }
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

    // --- Intercept fetch (round_end) ---
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        return originalFetch.apply(this, args).then(async response => {
            try {
                const u = getURLFromFetchArgs(args);
                console.log(u)
                if (isExactGameFetch(u)) {
                    // clone response so we can read it
                    const cloned = response.clone();
                    const fetchResponseData = await cloned.json().catch(() => null);

                    // wait a bit to let the XHR fire (but ignore it)
                    setTimeout(() => {
                        triggerEvent('round_end', { fetchResponse: fetchResponseData });
                    }, 300);
                }
            } catch (e) {
                console.warn("[Fetch] detection error:", e);
            }
            return response;
        });
    };

    // --- Intercept XHR (round_start) ---
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        this._requestUrl = url;
        this._isTarget = typeof url === 'string' && url.includes('GetMetadata');
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (this._isTarget) {
            this.addEventListener('load', () => {
                let xhrResponseData;
                try {
                    xhrResponseData = JSON.parse(this.responseText);
                } catch {
                    xhrResponseData = this.responseText;
                }

                // fire immediately → round_start
                triggerEvent('round_start', { xhrResponse: xhrResponseData });
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