import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { translate } from 'google-translate-api-x';
import axios from 'axios';
import startBotLoop from './bots/newsBot.js';
import BotHistory from './models/BotHistory.js';

dotenv.config();

async function testEliteFeatures() {
    try {
        console.log('🧪 Testing Elite Features...');
        
        // 1. Test Translation
        const testText = "Breaking News: NASA discovers life on Mars!";
        const tr = await translate(testText, { to: 'tr' });
        console.log(`🌍 Translation Test: "${testText}" -> "${tr.text}"`);

        // 2. Test HD Image Scraping
        const testUrl = "https://techcrunch.com/2024/04/03/apple-layoffs-over-600-employees/";
        console.log(`🔍 Scraping Metadata for: ${testUrl}`);
        const { data: html } = await axios.get(testUrl);
        const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i);
        console.log(`🖼️ HD Image Found: ${ogImageMatch ? ogImageMatch[1] : 'NOT FOUND'}`);

        // 3. Clear History and Run Blast
        console.log('\n🚀 Triggering Final Elite Blast...');
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        const botUsernames = ['GamesNews', 'TechNews', 'SportNews'];
        await BotHistory.deleteMany({ botName: { $in: botUsernames } });
        
        // Trigger the loop (which runs immediately once)
        await startBotLoop();

        console.log('⌛ Waiting 20 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        console.log('✅ Cycle Complete. Check the UI!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test Failed:', err);
        process.exit(1);
    }
}

testEliteFeatures();
