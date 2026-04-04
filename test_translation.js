import { translateText } from './utils/translate.js';

const testTranslation = async () => {
    const texts = [
        "The quick brown fox jumps over the lazy dog.",
        "Breaking news: Scientists discover a new planet in a distant galaxy.",
        "Innovation distinguishes between a leader and a follower.",
        "How are you doing today? I hope you have a great day!"
    ];

    console.log('🧪 Starting High-Accuracy Translation Test...\n');

    for (const text of texts) {
        try {
            const translated = await translateText(text, 'tr');
            console.log(`Original: "${text}"`);
            console.log(`Translated (TR): "${translated}"`);
            console.log('-----------------------------------');
        } catch (error) {
            console.error(`❌ Failed translating: ${text}`, error.message);
        }
    }
};

testTranslation();
