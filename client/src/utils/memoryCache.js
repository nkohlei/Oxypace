// Lightweight RAM-first SWR cache with deduplicated idle storage persistence.
// Reads hit in-memory Map in <0.01ms (zero synchronous JSON.parse on route switches),
// while writes defer JSON.stringify + sessionStorage/localStorage off the active frame.

const RAM_CACHE = new Map();
const MAX_RAM_ENTRIES = 120;
const PENDING_PERSIST = new Map();
let flushScheduled = false;

const scheduleFlush = (fn) => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(fn, { timeout: 600 });
    } else {
        setTimeout(fn, 16);
    }
};

const flushPendingWrites = () => {
    flushScheduled = false;
    const entries = Array.from(PENDING_PERSIST.entries());
    PENDING_PERSIST.clear();

    for (const [key, job] of entries) {
        try {
            const serialized = JSON.stringify(job.value);
            if (job.session) {
                try {
                    sessionStorage.setItem(key, serialized);
                } catch (_) {
                    if (job.fallbackValue !== undefined) {
                        try {
                            sessionStorage.setItem(key, JSON.stringify(job.fallbackValue));
                        } catch (__) {}
                    }
                }
            }
            if (job.local) {
                const localPayload = job.localValue !== undefined ? JSON.stringify(job.localValue) : serialized;
                try {
                    localStorage.setItem(key, localPayload);
                } catch (_) {}
            }
        } catch (_) {}
    }
};

export const getCached = (key, { checkLocal = true } = {}) => {
    if (!key) return null;
    if (RAM_CACHE.has(key)) {
        return RAM_CACHE.get(key);
    }
    try {
        const raw = sessionStorage.getItem(key) || (checkLocal ? localStorage.getItem(key) : null);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        setRamOnly(key, parsed);
        return parsed;
    } catch (_) {
        return null;
    }
};

export const setRamOnly = (key, value) => {
    if (!key) return;
    if (RAM_CACHE.size >= MAX_RAM_ENTRIES && !RAM_CACHE.has(key)) {
        const oldestKey = RAM_CACHE.keys().next().value;
        RAM_CACHE.delete(oldestKey);
    }
    RAM_CACHE.set(key, value);
};

export const setCached = (
    key,
    value,
    { session = true, local = false, localValue, fallbackValue } = {}
) => {
    if (!key) return;
    setRamOnly(key, value);
    if (!session && !local) return;

    PENDING_PERSIST.set(key, { value, session, local, localValue, fallbackValue });
    if (!flushScheduled) {
        flushScheduled = true;
        scheduleFlush(flushPendingWrites);
    }
};

export const clearMemoryCache = () => {
    RAM_CACHE.clear();
    PENDING_PERSIST.clear();
};

export const persistLocalIdle = (key, value) => {
    if (!key) return;
    PENDING_PERSIST.set(key, { value, session: false, local: true });
    if (!flushScheduled) {
        flushScheduled = true;
        scheduleFlush(flushPendingWrites);
    }
};
