import Parser from 'rss-parser';
import mongoose from 'mongoose';
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
    console.log('🤖 Starting Intelligent Multi-News Bot Service...');

    if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for DB connection...');
        await new Promise(resolve => {
            if (mongoose.connection.readyState === 1) return resolve();
            mongoose.connection.once('connected', resolve);
        });
        console.log('✅ DB Connected, proceeding with bots startup...');
    }

    try {
        // Prepare operational configs for all bots
        const activeBots = [];

        for (const config of BOT_CONFIGS) {
            const user = await User.findOne({ username: config.botUsername });
            if (!user) {
                console.warn(`⚠️ Skipping ${config.botUsername}: User not found in DB.`);
                continue;
            }

            const portal = await Portal.findOne({ name: config.portalName });
            if (!portal) {
                console.warn(`⚠️ Skipping ${config.botUsername}: Target Portal "${config.portalName}" not found.`);
                continue;
            }

            let channel;
            // Find specific channel if provided
            if (config.channelName) {
                channel = portal.channels.find(c => c.name === config.channelName);
            }
            
            // Fallback strategy
            if (!channel) {
                channel = portal.channels.find(c => ['genel', 'general', 'GENEL'].includes(c.name)) || portal.channels[0];
            }

            if (!channel) {
                console.warn(`⚠️ Skipping ${config.botUsername}: No suitable channel found in portal ${portal.name}.`);
                continue;
            }

            activeBots.push({
                user,
                portal,
                channel,
                feeds: config.feeds
            });
            console.log(`✅ [${config.botUsername}] Online -> Routing to ${portal.name} #${channel.name}`);
        }

        if (activeBots.length === 0) {
            console.error('❌ No bots were successfully configured. Aborting Bot Service.');
            return;
        }

        // Executor Function
        const runScrapeCycle = async () => {
            for (const bot of activeBots) {
                await checkNewsForBot(bot);
            }
        };

        // Run Immediately, then on interval
        await runScrapeCycle();
        setInterval(runScrapeCycle, CHECK_INTERVAL_MS);

    } catch (error) {
        console.error('❌ Failed to start Multi-Bot Engine:', error);
    }
}

// Scraper Engine per Bot
const checkNewsForBot = async (bot) => {
    for (const url of bot.feeds) {
        try {
            console.log(`📡 [${bot.user.username}] Scanning: ${url}`);
            const feed = await parser.parseURL(url);

            // Get Top 2 freshest items
            const itemsToProcess = feed.items.slice(0, 2).reverse();

            for (const item of itemsToProcess) {
                await processItem(item, bot);
            }
        } catch (error) {
            console.error(`⚠️ [${bot.user.username}] Failed fetching feed (${url}):`, error.message);
        }
    }
};

// Rich Media Extractor Algorithm
const extractRichMedia = (item) => {
    let mediaUrl = '';
    let mediaType = 'none';

    // 1. Check Native Enclosures for direct injections (Podcast/Video/Image)
    if (item.enclosure && item.enclosure.url) {
        if (item.enclosure.type && item.enclosure.type.includes('video')) {
            return { mediaUrl: item.enclosure.url, mediaType: 'video' };
        }
        if (item.enclosure.type && item.enclosure.type.includes('image')) {
            mediaUrl = item.enclosure.url;
            mediaType = 'image';
        }
    }

    // 2. Scan XML Namespaced <media:content>
    if (item.mediaContent && Array.isArray(item.mediaContent) && item.mediaContent.length > 0) {
        // Prioritize Video
        const videoRes = item.mediaContent.find(m => m.$ && m.$.type && m.$.type.includes('video'));
        if (videoRes && videoRes.$.url) return { mediaUrl: videoRes.$.url, mediaType: 'video' };

        // Fallback to Image
        if (!mediaUrl) {
            const imgRes = item.mediaContent.find(m => m.$ && (m.$.medium === 'image' || (m.$.type && m.$.type.includes('image'))));
            if (imgRes && imgRes.$.url) {
                mediaUrl = imgRes.$.url;
                mediaType = 'image';
            }
        }
    }

    // 2.5 Scan <media:thumbnail> (Common in BBC/ESPN)
    if (!mediaUrl && item.mediaThumbnail && Array.isArray(item.mediaThumbnail) && item.mediaThumbnail.length > 0) {
        const thumbRes = item.mediaThumbnail[0];
        if (thumbRes && thumbRes.$.url) {
            mediaUrl = thumbRes.$.url;
            mediaType = 'image';
        }
    }

    // 3. Regex Deep-Scan inside CDATA Content (HTML Payloads)
    const rawContent = item.contentEncoded || item.content || '';
    
    // Check embedded HTML5 Video
    if (mediaType !== 'video') {
        const vidMatch = rawContent.match(/<source[^>]+src="([^">]+\.mp4[^">]*)"/i) || rawContent.match(/<video[^>]+src="([^">]+\.mp4[^">]*)"/i);
        if (vidMatch) return { mediaUrl: vidMatch[1], mediaType: 'video' };
    }

    // Check embedded Images if none found yet
    if (!mediaUrl) {
        const imgMatch = rawContent.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) {
            mediaUrl = imgMatch[1];
            mediaType = 'image';
        }
    }

    return { mediaUrl, mediaType };
};

// Process and Deploy Payload
const processItem = async (item, bot) => {
    const guid = item.guid || item.link;

    // Fast deduplication check
    const isShared = await BotHistory.findOne({ guid, botName: bot.user.username });
    if (isShared) return;

    // Double security check to ensure no portal flooding
    const exists = await Post.findOne({
        author: bot.user._id,
        portal: bot.portal._id,
        content: { $regex: item.link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
    });

    if (exists) {
        await BotHistory.create({ guid, botName: bot.user.username });
        return;
    }

    console.log(`🆕 [${bot.user.username}] Extracting Payload: ${item.title}`);

    try {
        const { mediaUrl, mediaType } = extractRichMedia(item);

        let description = item.contentSnippet || item.content || '';
        // Clean brutal HTML fragments
        description = description.replace(/<[^>]+>/g, '').trim(); 
        
        if (description.length > 250) description = description.substring(0, 250) + '...';
        if (description.length < 10) description = ""; // Nullify garbage text payloads

        // Construct Premium Readout
        const formattedContent = `📢 **${item.title}**\n\n${description ? `📝 ${description}\n\n` : ''}🔗 Tamamını Oku: ${item.link}`;

        const newPost = new Post({
            content: formattedContent,
            author: bot.user._id,
            portal: bot.portal._id,
            channel: bot.channel._id,
            likes: [],
            comments: [],
            isPinned: false,
            media: mediaUrl || '',
            mediaType: mediaUrl ? mediaType : 'none',
            createdAt: new Date()
        });

        await newPost.save();
        await BotHistory.create({ guid, botName: bot.user.username });
        console.log(`✅ [${bot.user.username}] Blast Deployed Successfully! (Media: ${mediaType})`);

    } catch (error) {
        console.error(`❌ [${bot.user.username}] Failed to construct & publish post:`, error);
    }
};
