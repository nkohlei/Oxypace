import Parser from 'rss-parser';
import mongoose from 'mongoose';
import axios from 'axios';
import { translate } from 'google-translate-api-x';
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

// Translation helper
const translateText = async (text) => {
    if (!text) return "";
    try {
        const res = await translate(text, { to: 'tr' });
        console.log(`🌐 Translated: ${text.substring(0, 30)}... -> ${res.text.substring(0, 30)}...`);
        return res.text;
    } catch (error) {
        console.error("❌ Translation failed:", error.message);
        return text; // Fallback to original
    }
};

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
const BOT_CONFIGS = [
    {
        botUsername: 'GamesNews',
        portalName: 'OXYᴳᴬᴹᴱ', 
        channelName: 'genel', 
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

    try {
        const activeBots = [];
        for (const config of BOT_CONFIGS) {
            const user = await User.findOne({ username: config.botUsername });
            if (!user) continue;

            const portal = await Portal.findOne({ name: config.portalName });
            if (!portal) continue;

            let channel;
            if (config.channelName) {
                channel = portal.channels.find(c => c.name === config.channelName);
            }
            if (!channel) {
                channel = portal.channels.find(c => ['genel', 'general', 'GENEL'].includes(c.name)) || portal.channels[0];
            }
            if (!channel) continue;

            activeBots.push({ user, portal, channel, feeds: config.feeds });
            console.log(`✅ [${config.botUsername}] Online -> Turkish/HD Mode Active`);
        }

        if (activeBots.length === 0) return;

        const runScrapeCycle = async () => {
            for (const bot of activeBots) {
                await checkNewsForBot(bot);
            }
        };

        await runScrapeCycle();
        setInterval(runScrapeCycle, CHECK_INTERVAL_MS);

    } catch (error) {
        console.error('❌ Failed to start Multi-Bot Engine:', error);
    }
}

const checkNewsForBot = async (bot) => {
    for (const url of bot.feeds) {
        try {
            console.log(`📡 [${bot.user.username}] Scanning: ${url}`);
            const feed = await parser.parseURL(url);
            const itemsToProcess = feed.items.slice(0, 5).reverse();

            for (const item of itemsToProcess) {
                await processItem(item, bot);
            }
        } catch (error) {
            console.error(`⚠️ [${bot.user.username}] Failed fetching feed:`, error.message);
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
    const isShared = await BotHistory.findOne({ guid, botName: bot.user.username });
    if (isShared) return;

    try {
        const { mediaUrl, mediaType } = await extractRichMedia(item);

        // MANDATORY IMAGE POLICY
        if (!mediaUrl || mediaType === 'none') {
            console.warn(`⏭️ [${bot.user.username}] Skipping post: No HD visual found for "${item.title}"`);
            await BotHistory.create({ guid, botName: bot.user.username });
            return;
        }

        console.log(`🆕 [${bot.user.username}] Processing Elite Payload (TR/HD): ${item.title}`);
        console.log(`📸 Using Media: ${mediaUrl.substring(0, 50)}... (${mediaType})`);

        // Translate Title & Description
        const translatedTitle = await translateText(item.title);
        let description = item.contentSnippet || item.content || '';
        description = description.replace(/<[^>]+>/g, '').trim();
        if (description.length > 300) description = description.substring(0, 300) + '...';
        
        const translatedDesc = await translateText(description);

        const formattedContent = `📢 **${translatedTitle}**\n\n${translatedDesc ? `📝 ${translatedDesc}\n\n` : ''}🔗 Tamamını Oku: ${item.link}`;

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
        await BotHistory.create({ guid, botName: bot.user.username });
        console.log(`✅ [${bot.user.username}] Elite Post Deployed: ${translatedTitle.substring(0, 30)}... (Type: ${mediaType})`);

    } catch (error) {
        console.error(`❌ [${bot.user.username}] Failed elite publish:`, error.message);
    }
};
