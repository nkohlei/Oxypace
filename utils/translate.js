import { translate } from 'google-translate-api-x';

/**
 * Unified Translation Utility
 * Uses the latest Google Neural Machine Translation (NMT) models via the webapp client.
 * 
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language (default: 'tr')
 * @returns {Promise<string>} - The translated text
 */
export const translateText = async (text, targetLang = 'tr') => {
    if (!text || text.trim() === '') return '';

    try {
        const res = await translate(text, {
            to: targetLang,
            client: 'webapp', // Forces the more accurate browser-style motor
            forceBatch: false, // Ensures individual processing for higher quality
            autoCorrect: true // Enables Google's semantic correction
        });

        if (res && res.text) {
            return res.text;
        }
        return text;
    } catch (error) {
        console.error('❌ Translation Engine Error:', error.message);
        // If webapp fails, try fallback or return original
        return text;
    }
};

export default translateText;
