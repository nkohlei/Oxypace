/**
 * Checks if the text should show a translation options.
 * Heuristic: Returns true if the text contains common English stop words.
 * This effectively filters out Turkish-only posts as they won't contain these words,
 * satisfying the requirement "Only show for English posts".
 *
 * @param {string} text
 * @returns {boolean}
 */

// Compiled once at module load — do NOT move inside the function (avoids re-creating
// 21 RegExp objects on every PostCard render which contributed to hover jank).
const ENGLISH_STOP_WORDS = [
    /\bthe\b/,
    /\band\b/,
    /\bis\b/,
    /\bare\b/,
    /\bwas\b/,
    /\bwere\b/,
    /\bthis\b/,
    /\bthat\b/,
    /\bwith\b/,
    /\bfrom\b/,
    /\bhave\b/,
    /\bhas\b/,
    /\bfor\b/,
    /\bnot\b/,
    /\but\b/,
    /\byou\b/,
    /\bmy\b/,
    /\bwe\b/,
    /\bcan\b/,
    /\bwill\b/,
    /\babout\b/,
    /\bthere\b/,
];

const TURKISH_CHARS = /[ğĞşŞıİöÖüÜçÇ]/;

export const shouldShowTranslation = (text) => {
    if (!text) return false;

    // If text has Turkish specific chars, definitely hide it.
    if (TURKISH_CHARS.test(text)) return false;

    // Convert to lowercase for matching
    const lowerText = text.toLowerCase();

    // Check if any English stop word exists
    return ENGLISH_STOP_WORDS.some((regex) => regex.test(lowerText));
};
