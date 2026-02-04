import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';

import BotAuth from './utils/BotAuth.js';
import MediaHandler from './utils/MediaHandler.js';
import RSSService from './services/RSSService.js';

// Configuration
const API_URL = 'http://localhost:5000/api'; // Or your production URL
const HISTORY_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data/history.json');

// BOT CONFIGURATIONS - UPDATE THESE WITH REAL CREDENTIALS
const BOTS = [
    {
        name: 'Tech News Bot',
        email: 'techbot@oxypace.com',
        password: 'password123',
        feeds: [
            'http://feeds.bbci.co.uk/news/technology/rss.xml',
            'https://techcrunch.com/feed/'
        ]
    },
    {
        name: 'Sports Bot',
        email: 'sportsbot@oxypace.com',
        password: 'password123',
        feeds: [
            'http://feeds.bbci.co.uk/sport/rss.xml'
        ]
    }
];

const mediaHandler = new MediaHandler();
const rssService = new RSSService();

// Load history
let history = [];
try {
    if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
} catch (error) {
    console.error('Error loading history:', error);
}

function isAlreadyShared(guid) {
    return history.includes(guid);
}

function addToHistory(guid) {
    history.push(guid);
    // Keep history size manageable (e.g., last 1000 items)
    if (history.length > 1000) history.shift();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function extractImage(item) {
    // 1. Check enclosure
    if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image')) {
        return item.enclosure.url;
    }

    // 2. Check media:content (sometimes parsed as 'media')
    if (item['media:content'] && item['media:content'].$.url) {
        return item['media:content'].$.url;
    }

    // 3. Regex in content
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const match = imgRegex.exec(item.content || item['content:encoded']);
    if (match) return match[1];

    return null;
}

async function runBot() {
    console.log('--- Bot Cycle Started ---');

    for (const botConfig of BOTS) {
        console.log(`Processing bot: ${botConfig.name}`);
        const auth = new BotAuth(API_URL);

        try {
            // Login
            await auth.login(botConfig.email, botConfig.password);

            for (const feedUrl of botConfig.feeds) {
                const items = await rssService.fetchFeed(feedUrl);

                // Process newest first (reverse), or limit to 1 per cycle to look natural
                // For now, let's just process the top 3 unshared items
                let processedCount = 0;

                for (const item of items) {
                    if (processedCount >= 3) break; // Limit per feed per run

                    const guid = item.guid || item.link;
                    if (isAlreadyShared(guid)) continue;

                    console.log(`New item found: ${item.title}`);

                    // Prepare Post Data
                    const form = new FormData();
                    form.append('content', `${item.title}\n\n${item.contentSnippet || ''}\n\nRead more: ${item.link}`);

                    // Handle Image
                    const imageUrl = extractImage(item);
                    let localImagePath = null;

                    if (imageUrl) {
                        console.log(`Downloading image: ${imageUrl}`);
                        localImagePath = await mediaHandler.downloadImage(imageUrl);
                        if (localImagePath) {
                            form.append('media', fs.createReadStream(localImagePath));
                        }
                    }

                    // Send to API
                    try {
                        const headers = {
                            ...auth.getHeaders(),
                            ...form.getHeaders()
                        };

                        await axios.post(`${API_URL}/posts`, form, { headers });
                        console.log(`--> Posted successfully!`);

                        addToHistory(guid);
                        processedCount++;
                    } catch (postError) {
                        console.error(`Failed to post: ${postError.response?.data?.message || postError.message}`);
                    } finally {
                        if (localImagePath) mediaHandler.cleanup(localImagePath);
                    }
                }
            }

        } catch (error) {
            console.error(`Error processing ${botConfig.name}:`, error.message);
        }
    }
    console.log('--- Bot Cycle Finished ---');
}

// Main Execution Loop
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 Minutes

async function startBotLoop() {
    console.log(`\n=== Bot Service Started ===`);
    console.log(`Check Interval: ${CHECK_INTERVAL / 1000} seconds`);

    // Run immediately on start
    await runBot();

    // Schedule re-runs
    setInterval(async () => {
        try {
            await runBot();
        } catch (error) {
            console.error('CRITICAL ERROR in Bot Loop:', error);
        }
    }, CHECK_INTERVAL);
}

// Handle Process Termination
process.on('SIGINT', () => {
    console.log('\nStopping Bot Service...');
    process.exit();
});

startBotLoop();
