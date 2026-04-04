import express from 'express';
import { translateText } from '../utils/translate.js';

const router = express.Router();

/**
 * @route   POST /api/translate
 * @desc    Translate text to Turkish using high-accuracy NMT
 * @access  Public (or Protected if needed)
 */
router.post('/', async (req, res) => {
    const { text, target = 'tr' } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required for translation' });
    }

    try {
        const translated = await translateText(text, target);
        res.json({ translated });
    } catch (error) {
        console.error('Translation Route Error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

export default router;
