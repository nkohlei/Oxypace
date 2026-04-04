import Parser from 'rss-parser';
import mongoose from 'mongoose';
import axios from 'axios';
import { translateText } from '../utils/translate.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import BotHistory from '../models/BotHistory.js';

// Extend parser to capture rich media attributes hidden in XML namespaces
const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
            ['enclosure', 'enclosure'],
            ['content:encoded', 'contentEncoded']
        ]
    }
});

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 Minutes

// (Removed local translate helper - now using centralized utils/translate.js)

// HD Metadata Scraper (OpenGraph)
const fetchHDMetadata = async (url) => {
    try {
        const { data: html } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        
        // Match og:image
        const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i) || 
                             html.match(/<meta[^>]+content="([^">]+)"[^>]+property="og:image"/i);
        
        // Match youtube/vimeo links in page
        const youtubeMatch = html.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);

        return {
            hdImage: ogImageMatch ? ogImageMatch[1] : null,
            videoUrl: youtubeMatch ? youtubeMatch[0] : null
        };
    } catch (error) {
        return { hdImage: null, videoUrl: null };
    }
};

// --- MULTI-BOT ARCHITECTURE ---
// --- MULTI-BOT ARCHITECTURE ---
const BOT_CONFIGS = [
    {
        botUsername: 'GamesNews',
        portalName: 'OXYᴳᴬᴹᴱ', 
        channelName: 'Game News 🐦‍🔥', // Corrected channel name (Phoenix)
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
    console.log('🤖 Starting Elite Multi-News Bot Service (Turkish/HD/Video)...');

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
                // FETCH FRESH CONTEXT FOR EVERY BOT EVERY CYCLE
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

                // Inject fresh context into the check function
                await checkNewsForBot({ user, portal, channel, feeds: config.feeds });
                
            } catch (err) {
                console.error(`❌ Error processing bot "${config.botUsername}":`, err.message);
            }
        }
    };

    // Run first cycle immediately
    await runScrapeCycle();
    // Then schedule
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

const extractRichMedia = async (item) => {
    let mediaUrl = '';
    let mediaType = 'none';

    // 1. YouTube detection in the link itself
    const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
    const linkMatch = (item.link || '').match(youtubeRegex);
    if (linkMatch) return { mediaUrl: linkMatch[0], mediaType: 'youtube' };

    // 2. Enclosures
    if (item.enclosure && item.enclosure.url) {
        if (item.enclosure.type?.includes('video')) return { mediaUrl: item.enclosure.url, mediaType: 'video' };
        if (item.enclosure.type?.includes('image')) {
            mediaUrl = item.enclosure.url;
            mediaType = 'image';
        }
    }

    // 3. Media:Content
    if (item.mediaContent && Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
        const videoRes = item.mediaContent.find(m => m.$?.type?.includes('video'));
        if (videoRes && videoRes.$.url) return { mediaUrl: videoRes.$.url, mediaType: 'video' };

        if (!mediaUrl) {
            const imgRes = item.mediaContent.find(m => m.$ && (m.$.medium === 'image' || m.$.type?.includes('image')));
            if (imgRes && imgRes.$.url) {
                mediaUrl = imgRes.$.url;
                mediaType = 'image';
            }
        }
    }

    // 4. Fallback to Thumbnails
    if (!mediaUrl && item.mediaThumbnail && item.mediaThumbnail[0]) {
        mediaUrl = item.mediaThumbnail[0].$.url;
        mediaType = 'image';
    }

    // 5. DEEP SCRAPE for OG:IMAGE (HD Image Requirement)
    if (item.link) {
        const metadata = await fetchHDMetadata(item.link);
        if (metadata.videoUrl) return { mediaUrl: metadata.videoUrl, mediaType: 'youtube' };
        if (metadata.hdImage) {
            mediaUrl = metadata.hdImage;
            mediaType = 'image';
        }
    }

    return { mediaUrl, mediaType };
};

const processItem = async (item, bot) => {
    const guid = item.guid || item.link;
    if (!guid) return;

    try {
        // 1. Precise History Check (Database Index level)
        const isShared = await BotHistory.findOne({ guid, botName: bot.user.username });
        if (isShared) {
            // console.log(`⏭️ [${bot.user.username}] Skipped: Already shared (GUID: ${guid.substring(0, 20)}...)`);
            return;
        }

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
            console.log(`🛡️ [${bot.user.username}] Fuzzy match triggered (Title: "${item.title.substring(0, 30)}..."). Marking as shared.`);
            await BotHistory.create({ guid, botName: bot.user.username });
            return;
        }

        const { mediaUrl, mediaType } = await extractRichMedia(item);

        // SOFT IMAGE POLICY: We prefer images, but we won't block the news if they are missing
        if (!mediaUrl || mediaType === 'none') {
            console.log(`ℹ️ [${bot.user.username}] Posting without visual: "${item.title.substring(0, 30)}..."`);
        } else {
            console.log(`🖼️ [${bot.user.username}] Visual found (${mediaType}): "${item.title.substring(0, 30)}..."`);
        }

        console.log(`🆕 [${bot.user.username}] Processing Elite Payload (TR/HD): ${item.title}`);
        
        // Translate Title & Description
        const translatedTitle = await translateText(item.title);
        let description = item.contentSnippet || item.content || '';
        description = description.replace(/<[^>]+>/g, '').trim();
        
        // Increased character limit for "bolca yazı açıklamalı" (rich text)
        if (description.length > 1000) description = description.substring(0, 1000) + '...';
        
        const translatedDesc = await translateText(description);

        const formattedContent = `📢 **${translatedTitle}**\n\n${translatedDesc ? `📝 ${translatedDesc}\n\n` : ''}🔗 Tamamını Oku: ${item.link}`;

        // --- ATOMICITY FIX ---
        // We create the history record FIRST. 
        // If it succeeds, it means no other bot has taken this yet (or this bot hasn't).
        // If it fails (rare race condition), the try-catch will handle it.
        await BotHistory.create({ guid, botName: bot.user.username });

        const newPost = new Post({
            content: formattedContent,
            author: bot.user._id,
            portal: bot.portal._id,
            channel: bot.channel._id,
            media: mediaUrl,
            mediaType: mediaType,
            createdAt: new Date()
        });

        await newPost.save();
        console.log(`✅ [${bot.user.username}] Elite Post Deployed: ${translatedTitle.substring(0, 30)}...`);

    } catch (error) {
        if (error.code === 11000) {
            // Duplicate detected at the moment of creation (Race condition handled)
            return;
        }
        console.error(`❌ [${bot.user.username}] Failed elite publish:`, error.message);
    }
};
