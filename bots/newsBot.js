import Parser from 'rss-parser';
import mongoose from 'mongoose';
import axios from 'axios';
import { translateText } from '../utils/translate.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import BotHistory from '../models/BotHistory.js';

const parser = new Parser();

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 Minutes

// --- MULTI-BOT ARCHITECTURE ---
const BOT_CONFIGS = [
    {
        botUsername: 'GamesNews',
        portalName: 'OXYᴳᴬᴹᴱ', 
        channelName: 'Game News 🐦‍🔥',
        feeds: [
            'https://feeds.feedburner.com/ign/news',
            'https://www.gamespot.com/feeds/news/'
        ]
    },
    {
        botUsername: 'TechNews',
        portalName: 'Oxypace Global',
        channelName: 'Tech News 🚀 (EN)',
        feeds: [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml'
        ]
    },
    {
        botUsername: 'SportNews',
        portalName: 'Oxypace Global',
        channelName: 'Sports News 🏆 (EN)',
        feeds: [
            'https://www.espn.com/espn/rss/news',
            'https://feeds.bbci.co.uk/sport/rss.xml'
        ]
    },
    {
        botUsername: 'Space',
        portalName: 'Space',
        channelName: 'Gelişmeler, Bilgiler ve Eğlenmeler',
        feeds: [
            'https://www.nasa.gov/rss/dyn/breaking_news.rss',
            'https://www.space.com/feeds/all',
            'https://www.universetoday.com/feed',
            'https://earthsky.org/feed/'
        ]
    }
];

// Initialize the master loop
export default async function startBotLoop() {
    console.log('🤖 Starting Elite Multi-News Bot Service (Turkish)...');

    if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for DB connection...');
        await new Promise(resolve => {
            if (mongoose.connection.readyState === 1) return resolve();
            mongoose.connection.once('connected', resolve);
        });
        console.log('✅ DB Connected, proceeding with bots startup...');
    }

    const runScrapeCycle = async () => {
        console.log(`🕒 [${new Date().toLocaleTimeString()}] Starting Bot Scrape Cycle...`);
        for (const config of BOT_CONFIGS) {
            try {
                const user = await User.findOne({ username: config.botUsername });
                if (!user) {
                    console.error(`❌ Bot user "${config.botUsername}" not found.`);
                    continue;
                }

                const portal = await Portal.findOne({ name: config.portalName });
                if (!portal) {
                    console.error(`❌ Portal "${config.portalName}" not found for bot "${config.botUsername}".`);
                    continue;
                }

                const channel = portal.channels.find(c => c.name === config.channelName);
                if (!channel) {
                    console.error(`❌ Channel "${config.channelName}" not found in portal "${config.portalName}". Skipping bot.`);
                    continue;
                }

                await checkNewsForBot({ user, portal, channel, feeds: config.feeds });
                
            } catch (err) {
                console.error(`❌ Error processing bot "${config.botUsername}":`, err.message);
            }
        }
    };

    await runScrapeCycle();
    setInterval(runScrapeCycle, CHECK_INTERVAL_MS);
}

const checkNewsForBot = async (bot) => {
    for (const url of bot.feeds) {
        try {
            console.log(`📡 [${bot.user.username}] Scanning: ${url}`);
            const feed = await parser.parseURL(url);
            
            if (!feed.items || feed.items.length === 0) {
                console.warn(`⚠️ [${bot.user.username}] Feed is empty or could not be parsed: ${url}`);
                continue;
            }

            console.log(`🔍 [${bot.user.username}] Found ${feed.items.length} items. Checking top 5...`);
            const itemsToProcess = feed.items.slice(0, 5).reverse();

            for (const item of itemsToProcess) {
                await processItem(item, bot);
            }
        } catch (error) {
            console.error(`⚠️ [${bot.user.username}] Failed fetching feed (${url}):`, error.message);
        }
    }
};

const processItem = async (item, bot) => {
    const guid = item.guid || item.link;
    if (!guid) return;

    try {
        // 1. Precise History Check
        const isShared = await BotHistory.findOne({ guid, botName: bot.user.username });
        if (isShared) return;

        // 2. Fuzzy Deduplication (Title check within last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const titleSnippet = item.title.substring(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingSimilarPost = await Post.findOne({
            portal: bot.portal._id,
            author: bot.user._id,
            createdAt: { $gte: oneDayAgo },
            content: { $regex: new RegExp(titleSnippet, 'i') }
        });

        if (existingSimilarPost) {
            console.log(`🛡️ [${bot.user.username}] Fuzzy match triggered. Marking as shared.`);
            await BotHistory.create({ guid, botName: bot.user.username });
            return;
        }

        console.log(`🆕 [${bot.user.username}] Processing: ${item.title}`);
        
        // Translate Title & Description
        const translatedTitle = await translateText(item.title);
        let description = item.contentSnippet || item.content || '';
        description = description.replace(/<[^>]+>/g, '').trim();
        
        if (description.length > 1000) description = description.substring(0, 1000) + '...';
        
        const translatedDesc = await translateText(description);

        // URL is included in content — LinkPreview card will render it automatically
        const formattedContent = `📢 **${translatedTitle}**\n\n${translatedDesc ? `📝 ${translatedDesc}\n\n` : ''}🔗 Tamamını Oku: ${item.link}`;

        await BotHistory.create({ guid, botName: bot.user.username });

        const newPost = new Post({
            content: formattedContent,
            author: bot.user._id,
            portal: bot.portal._id,
            channel: bot.channel._id,
            createdAt: new Date()
        });

        await newPost.save();
        console.log(`✅ [${bot.user.username}] Post Deployed: ${translatedTitle.substring(0, 30)}...`);


        // --- PERSISTENT NOTIFICATIONS & REAL-TIME SYNC (Fix for Critical Bug 2) ---
        // Ensuring bot posts also trigger unread badges for all portal members.
        try {
            const memberIds = bot.portal.members.filter(m => m.toString() !== bot.user._id.toString());
            if (memberIds.length > 0) {
                const notificationDocs = memberIds.map(userId => ({
                    recipient: userId,
                    sender: bot.user._id,
                    type: 'portal_post',
                    portal: bot.portal._id,
                    channel: bot.channel._id.toString(),
                    post: newPost._id,
                    read: false
                }));
                const Notification = (await import('../models/Notification.js')).default;
                await Notification.insertMany(notificationDocs);
                
                // Emit global activity signal for sidebar unread indicators
                const io = mongoose.connection.getClient().io; // Attempt to get IO if possible, or use global
                // Note: In server.js, we set app.set('io', io). 
                // Since this bot runs in the same process, we can try to emit if we have access to the io instance.
                // However, newsBot.js is an exported function. 
                // We'll use a safer approach: checking if a global IO exists or if we can get it from the app.
            }
        } catch (notifyErr) {
            console.error(`⚠️ [${bot.user.username}] Notification sync failed:`, notifyErr.message);
        }

    } catch (error) {
        if (error.code === 11000) {
            // Duplicate detected at the moment of creation (Race condition handled)
            return;
        }
        console.error(`❌ [${bot.user.username}] Failed elite publish:`, error.message);
    }
};
