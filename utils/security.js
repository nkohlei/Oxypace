import dns from 'dns/promises';
import net from 'net';

/**
 * Escapes special regex characters to prevent RegExp Injection and ReDoS attacks.
 * @param {string} str Input search term
 * @returns {string} Cleaned search term safe to put inside a RegExp constructor or MongoDB $regex query.
 */
export const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * SSRF Protection — checks whether a parsed URL hostname resolves to a
 * private, loopback, link-local, or otherwise reserved IP range.
 * Blocks cloud metadata endpoints (AWS/GCP/Azure), RFC-1918 private ranges,
 * IPv6 loopback/ULA, and localhost variants.
 *
 * @param {string} hostname — raw hostname from URL (already lowercased)
 * @returns {boolean} true if the hostname is dangerous/private
 */
export function isPrivateOrReservedHost(hostname) {
    if (!hostname || typeof hostname !== 'string') return true;
    const h = hostname.toLowerCase().trim();

    // Strip IPv6 brackets FIRST (URL.hostname returns IPv6 literals as "[::1]")
    const stripped = h.startsWith('[') ? h.slice(1, -1) : h;

    // Localhost variants
    if (h === 'localhost' || h === 'local' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;

    // IPv6 loopback / unspecified (bracketed or not)
    if (stripped === '::1' || stripped === '0:0:0:0:0:0:0:1' || stripped === '::' || stripped === '0:0:0:0:0:0:0:0') return true;

    // IPv4-mapped / IPv4-compatible IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1) can smuggle private IPv4 targets
    if (/^::(ffff:)?[0-9a-f.:]+$/i.test(stripped)) return true;

    // IPv4 check
    const ipv4Parts = stripped.split('.');
    if (ipv4Parts.length === 4) {
        const [a, b, c] = ipv4Parts.map(Number);
        if (
            a === 127 ||                          // 127.0.0.0/8  — loopback
            a === 10 ||                           // 10.0.0.0/8   — RFC-1918
            a === 0 ||                            // 0.0.0.0/8    — reserved
            (a === 172 && b >= 16 && b <= 31) || // 172.16-31/12 — RFC-1918
            (a === 192 && b === 168) ||           // 192.168.0.0/16 — RFC-1918
            (a === 169 && b === 254) ||           // 169.254.0.0/16 — link-local / AWS metadata
            (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 — CGNAT
            a === 198 && (b === 18 || b === 19) || // 198.18.0.0/15 — benchmarking
            (a === 192 && b === 0 && c === 2) ||  // 192.0.2.0/24 — documentation
            (a === 203 && b === 0 && c === 113) || // 203.0.113.0/24 — documentation
            a === 255                              // broadcast
        ) return true;
    }

    // IPv6 ULA (fc00::/7) and link-local (fe80::/10)
    if (/^fc[0-9a-f]{2}:/i.test(stripped) || /^fd[0-9a-f]{2}:/i.test(stripped)) return true;
    if (/^fe[89ab][0-9a-f]:/i.test(stripped)) return true;

    // Cloud metadata endpoints (hostname-based)
    const blockedHosts = [
        'metadata.google.internal',
        'metadata.goog',
        '169.254.169.254',        // AWS/GCP/Azure instance metadata
        '169.254.170.2',          // AWS ECS credentials endpoint
        'fd00:ec2::254',          // AWS IPv6 metadata
        'instance-data',
        'computemetadata.v1',
    ];
    if (blockedHosts.includes(h) || blockedHosts.includes(stripped)) return true;

    return false;
}

/**
 * Validates a URL string for SSRF safety.
 * @param {string} urlStr — the full URL to validate
 * @returns {{ safe: boolean, reason?: string }}
 */
export function validateSsrfUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') {
        return { safe: false, reason: 'Missing URL' };
    }

    let parsed;
    try {
        parsed = new URL(urlStr);
    } catch {
        return { safe: false, reason: 'Invalid URL format' };
    }

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    if (isPrivateOrReservedHost(parsed.hostname)) {
        return { safe: false, reason: `Private/reserved host blocked: ${parsed.hostname}` };
    }

    return { safe: true };
}

/**
 * DNS-aware check: true when the hostname is (or resolves to) a private/reserved address.
 * Lookup failures are treated as "not private" so the real fetch fails naturally with its own error.
 */
export async function resolvesToPrivateAddress(hostname) {
    const bare = hostname && hostname.startsWith('[') ? hostname.slice(1, -1) : hostname;
    if (!bare) return true;
    if (net.isIP(bare)) return isPrivateOrReservedHost(bare);
    try {
        const addrs = await dns.lookup(bare, { all: true, verbatim: true });
        return addrs.some((a) => isPrivateOrReservedHost(a.address));
    } catch {
        return false;
    }
}

/**
 * SSRF-safe fetch: validates the URL and its DNS resolution, follows redirects manually
 * and re-validates every hop (a public host redirecting to 127.0.0.1 / metadata is rejected).
 * Throws an Error whose message starts with "SSRF_BLOCKED" when a hop is disallowed.
 */
export async function safeFetch(url, options = {}, maxRedirects = 5) {
    let current = url;
    for (let hop = 0; hop <= maxRedirects; hop++) {
        const check = validateSsrfUrl(current);
        if (!check.safe) throw new Error(`SSRF_BLOCKED: ${check.reason}`);
        if (await resolvesToPrivateAddress(new URL(current).hostname)) {
            throw new Error('SSRF_BLOCKED: host resolves to a private address');
        }
        const res = await fetch(current, { ...options, redirect: 'manual' });
        const location = res.headers.get('location');
        if (res.status >= 300 && res.status < 400 && location) {
            try { await res.body?.cancel(); } catch { /* ignore */ }
            current = new URL(location, current).toString();
            continue;
        }
        return res;
    }
    throw new Error('Too many redirects');
}
