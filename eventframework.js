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

    let fetchDetected = false;
    let xhrDetected = false;
    let fetchResponseData = null;
    let xhrResponseData = null;
    let combinedTimeout = null;

    function triggerEvent(name, data) {
        console.log(`>>> Event: ${name}`);
        document.dispatchEvent(new CustomEvent(name, { detail: data }));
    }

    // --- Intercept fetch ---
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        return originalFetch.apply(this, args).then(async response => {
            try {
                const u = getURLFromFetchArgs(args);
                if (isExactGameFetch(u)) {
                    fetchDetected = true;

                    // clone response so we can read it without breaking normal behavior
                    const cloned = response.clone();
                    fetchResponseData = await cloned.json().catch(() => null);

                    clearTimeout(combinedTimeout);
                    combinedTimeout = setTimeout(() => {
                        if (fetchDetected && xhrDetected) {
                            triggerEvent('round_end', { fetchResponse: fetchResponseData });
                        }
                        fetchDetected = false;
                        xhrDetected = false;
                        fetchResponseData = null;
                        xhrResponseData = null;
                    }, 500);
                }
            } catch (e) {
                console.warn("[Fetch] detection error:", e);
            }
            return response;
        });
    };

    // --- Intercept XHR ---
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
                xhrDetected = true;

                try {
                    xhrResponseData = JSON.parse(this.responseText);
                } catch {
                    xhrResponseData = this.responseText;
                }

                clearTimeout(combinedTimeout);
                combinedTimeout = setTimeout(() => {
                    if (xhrDetected && !fetchDetected) {
                        triggerEvent('round_start', { xhrResponse: xhrResponseData });
                    } else if (xhrDetected && fetchDetected) {
                        triggerEvent('round_end', { fetchResponse: fetchResponseData });
                    }

                    fetchDetected = false;
                    xhrDetected = false;
                    fetchResponseData = null;
                    xhrResponseData = null;
                }, 300);
            });
        }
        return originalSend.apply(this, arguments);
    };
})();