import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import BotAuth from './utils/BotAuth.js';
import MediaHandler from './utils/MediaHandler.js';
import RSSService from './services/RSSService.js';
import BotHistory from '../models/BotHistory.js';

// Setup Env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
// Use Process Env for API URL (Render provides this) or fallback to local
// If API_HOST_PORT is present (Render Internal), construct the URL
const API_URL = process.env.API_HOST_PORT
    ? `http://${process.env.API_HOST_PORT}/api`
    : (process.env.API_URL || 'http://localhost:5000/api');

// Database Connection
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// BOT CONFIGURATIONS
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

// History Management via MongoDB
async function isAlreadyShared(guid) {
    const exists = await BotHistory.exists({ guid });
    return !!exists;
}

async function addToHistory(guid, botName) {
    try {
        await BotHistory.create({ guid, botName });
    } catch (error) {
        if (error.code !== 11000) { // Ignore duplicate key errors
            console.error('Error saving history:', error.message);
        }
    }
}

function extractImage(item) {
    if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image')) {
        return item.enclosure.url;
    }
    if (item['media:content'] && item['media:content'].$.url) {
        return item['media:content'].$.url;
    }
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

                let processedCount = 0;

                for (const item of items) {
                    if (processedCount >= 3) break;

                    const guid = item.guid || item.link;
                    if (await isAlreadyShared(guid)) continue;

                    console.log(`New item found: ${item.title}`);

                    const form = new FormData();
                    form.append('content', `${item.title}\n\n${item.contentSnippet || ''}\n\nRead more: ${item.link}`);
                    form.append('portalId', '69485e416ce2eac8943a5de2'); // Oxypace Global
                    form.append('channel', 'general');

                    const imageUrl = extractImage(item);
                    let localImagePath = null;

                    if (imageUrl) {
                        // console.log(`Downloading image: ${imageUrl}`);
                        localImagePath = await mediaHandler.downloadImage(imageUrl);
                        if (localImagePath) {
                            form.append('media', fs.createReadStream(localImagePath));
                        }
                    }

                    try {
                        const headers = {
                            ...auth.getHeaders(),
                            ...form.getHeaders()
                        };

                        await axios.post(`${API_URL}/posts`, form, { headers });
                        console.log(`--> Posted successfully!`);

                        await addToHistory(guid, botConfig.name);
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

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 Minutes

async function startBotLoop() {
    console.log(`\n=== Bot Service Started ===`);
    console.log(`Check Interval: ${CHECK_INTERVAL / 1000} seconds`);
    console.log(`Target API: ${API_URL}`);

    // Connect to DB for History
    try {
        if (mongoose.connection.readyState === 0) {
            console.log('Connecting to MongoDB...');
            await mongoose.connect(MONGO_URI);
            console.log('Connected to DB.');
        }
    } catch (err) {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    }

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

process.on('SIGINT', () => {
    console.log('\nStopping Bot Service...');
    mongoose.connection.close();
    process.exit();
});

startBotLoop();
