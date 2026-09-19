/**
 * Client-side Profanity, Insult & Vulgarity Filter
 * Provides immediate validation before submitting profile changes.
 */

const CHAR_MAP = {
    '@': 'a', '4': 'a',
    '8': 'b',
    '3': 'e',
    '1': 'i', '!': 'i', '|': 'i', 'ı': 'i', 'İ': 'i',
    '0': 'o', 'ö': 'o',
    '5': 's', '$': 's', 'ş': 's',
    '7': 't',
    'ü': 'u',
    'ç': 'c',
    'ğ': 'g',
};

const BLOCKED_WORDS = [
    // Turkish - Sexual & Genital
    'am', 'amcik', 'amcigi', 'amcuk', 'amguard', 'ami', 'amk', 'amina', 'amkoyim', 'amkoyarim',
    'aq', 'amina', 'aminakoyim', 'aminakoyayim', 'amq', 'sik', 'sikim', 'sikik', 'siktir', 'sikeyim',
    'siktim', 'sikise', 'sikis', 'siktigim', 'sikmis', 'sikeli', 'siktirgit', 'yarrak', 'yarak',
    'yarragi', 'yarram', 'dassak', 'tassak', 'tasak', 'dasak', 'got', 'göt', 'gotlek', 'gotveren',
    'gotunu', 'gotun', 'gotunden', 'sakso', 'saksofoncu', 'saksocu', 'dol', 'döl', 'bosalma',
    'meme', 'amli', 'amdelisi', 'gotdelisi',

    // Turkish - Insults & Slurs
    'orospu', 'orospucocugu', 'oc', 'o.c', 'pic', 'picin', 'pust', 'puşt', 'pezevenk', 'pezo',
    'ibne', 'ibnetor', 'kaltak', 'fahise', 'fahişe', 'kahpe', 'kasar', 'kaşar', 'yavsak', 'yavşak',
    'gavat', 'kavat', 'top', 'lubunya', 'dingil', 'haysiyetsiz', 'namussuz', 'serefsiz', 'şerefsiz',
    'itoglu', 'kopek', 'oglan', 'malfatma',

    // English - Explicit / Sexual
    'fuck', 'fucker', 'fucking', 'fuckin', 'fck', 'fuk', 'motherfucker', 'cock', 'cocksucker',
    'dick', 'dickhead', 'pussy', 'cunt', 'twat', 'clit', 'vagina', 'penis', 'dildo', 'masturbate',
    'ejaculat', 'blowjob', 'handjob', 'orgasm', 'porn', 'porno', 'pornography', 'xxx', 'hentai',
    'erotic', 'sex', 'sexy', 'boobs', 'tits', 'anal',

    // English - Insults & Slurs
    'shit', 'shitty', 'bitch', 'bitches', 'bastard', 'asshole', 'ass', 'arse', 'arsehole',
    'wanker', 'retard', 'nigger', 'nigga', 'fag', 'faggot', 'whore', 'slut', 'skank',
    'spic', 'chink', 'kike', 'dyke', 'tranny',

    // German / Spanish / Russian common profanities
    'arschloch', 'hurensohn', 'fotze', 'scheisse', 'puta', 'puto', 'mierda', 'coño', 'chinga',
    'suka', 'blyat', 'cyka', 'kurwa', 'pedik',
];

const EXACT_PATTERNS = BLOCKED_WORDS.map((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
});

function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.toLowerCase().trim();
    cleaned = cleaned
        .split('')
        .map((char) => CHAR_MAP[char] || char)
        .join('');

    return cleaned;
}

export function hasProfanity(text) {
    if (!text || typeof text !== 'string') return false;

    const normalized = normalizeText(text);

    // 1. Direct word boundary check
    for (const pattern of EXACT_PATTERNS) {
        if (pattern.test(normalized)) {
            return true;
        }
    }

    // 2. Remove all spaces and punctuation
    const stripped = normalized.replace(/[^a-z0-9]/g, '');

    for (const word of BLOCKED_WORDS) {
        if (word.length >= 3 && stripped.includes(word)) {
            if (word === 'got' || word === 'am' || word === 'oc' || word === 'aq') {
                const regex = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, 'i');
                if (regex.test(normalized)) return true;
            } else if (word === 'ass' || word === 'sex') {
                const regex = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, 'i');
                if (regex.test(normalized)) return true;
            } else {
                return true;
            }
        }
    }

    // 3. Repeated consecutive characters check
    const collapsed = stripped.replace(/(.)\1+/g, '$1');
    for (const word of BLOCKED_WORDS) {
        if (word.length >= 4 && collapsed.includes(word)) {
            return true;
        }
    }

    return false;
}

export function validateProfileFields(fields) {
    if (!fields || typeof fields !== 'object') {
        return { hasProfanity: false, field: null, message: null };
    }

    if (fields.username && hasProfanity(fields.username)) {
        return {
            hasProfanity: true,
            field: 'username',
            message: 'Kullanıcı adı küfür, hakaret veya müstehcen ifade içeremez.',
        };
    }

    if (fields.displayName && hasProfanity(fields.displayName)) {
        return {
            hasProfanity: true,
            field: 'displayName',
            message: 'Görünen isim küfür, hakaret veya müstehcen ifade içeremez.',
        };
    }

    if (fields.bio && hasProfanity(fields.bio)) {
        return {
            hasProfanity: true,
            field: 'bio',
            message: 'Biyografi küfür, hakaret veya müstehcen ifade içeremez.',
        };
    }

    return { hasProfanity: false, field: null, message: null };
}

export default {
    hasProfanity,
    validateProfileFields,
};
