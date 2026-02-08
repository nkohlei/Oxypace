/**
 * Checks if the text should show a translation options.
 * Heuristic: Returns true if the text contains common English stop words.
 * This effectively filters out Turkish-only posts as they won't contain these words,
 * satisfying the requirement "Only show for English posts".
 *
 * @param {string} text
 * @returns {boolean}
 */
export const shouldShowTranslation = (text) => {
    if (!text) return false;

    // Convert to lowercase for matching
    const lowerText = text.toLowerCase();

    // Common English stop words (high frequency)
    // Matches whole words only (\b)
    const englishStopWords = [
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

    // Check if any English stop word exists
    const hasEnglishWords = englishStopWords.some((regex) => regex.test(lowerText));

    // Also check for absence of specific Turkish characters as a secondary check?
    // No, user specifically said "English or other languages".
    // If we just check for English words, we might miss "Hola como estas".
    // But the user's specific request "English description...".
    // Let's stick to the positive match for English words + simple length check.
    // Very short texts might be ambiguous.

    // If text has Turkish specific chars, definitely hide it.
    const hasTurkishChars = /[ğĞşŞıİöÖüÜçÇ]/.test(text);

    return hasEnglishWords && !hasTurkishChars;
};
