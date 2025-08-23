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
        console.log(`>>>< Event: ${name}`, data);
        document.dispatchEvent(new CustomEvent(name, { detail: data }));
    }

    // --- Intercept fetch (only round_end) ---
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        return originalFetch.apply(this, args).then(async response => {
            const u = getURLFromFetchArgs(args);
            if (isExactGameFetch(u)) {
                const cloned = response.clone();
                const data = await cloned.json().catch(() => null);
                triggerEvent("round_end", { fetchResponse: data });
            }
            return response;
        });
    };
})();

// Listen for round_end event
document.addEventListener("round_end", function (event) {
    localStorage.setItem("roundStatus", "ended");
    // Handle round end logic here
});
