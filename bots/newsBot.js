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

export const BOT_CONFIGS = [
    {
        botUsername: 'GamesNews',
        portalName: 'OXYᴳᴬᴹᴱ', 
        channelName: 'Game News 🐦‍🔥',
        email: 'gamesnews@oxypace.com',
        profile: {
            displayName: 'Game News Bot',
            bio: 'Automated games news aggregator.',
            avatar: ''
        },
        feeds: [
            'https://feeds.feedburner.com/ign/news',
            'https://www.gamespot.com/feeds/news/'
        ]
    },
    {
        botUsername: 'TechNews',
        portalName: 'Oxypace Global',
        channelName: 'Tech News 🚀',
        email: 'technews@oxypace.com',
        profile: {
            displayName: 'Tech News Bot',
            bio: 'Automated technology news aggregator.',
            avatar: ''
        },
        feeds: [
            'https://techcrunch.com/feed/',
            'https://www.theverge.com/rss/index.xml'
        ]
    },
    {
        botUsername: 'SportNews',
        portalName: 'Oxypace Global',
        channelName: 'Sports News 🏆',
        email: 'sportsbot@oxypace.com',
        profile: {
            displayName: 'World Sports',
            bio: 'Latest sports updates from around the globe.',
            avatar: ''
        },
        feeds: [
            'https://www.espn.com/espn/rss/news',
            'https://feeds.bbci.co.uk/sport/rss.xml'
        ]
    },
    {
        botUsername: 'Space',
        portalName: 'Space',
        channelName: 'Gelişmeler, Bilgiler ve Eğlenmeler',
        email: 'spacebot@oxypace.com',
        profile: {
            displayName: 'Space Bot',
            bio: 'Automated space news aggregator.',
            avatar: ''
        },
        feeds: [
            'https://www.nasa.gov/rss/dyn/breaking_news.rss',
            'https://www.space.com/feeds/all',
            'https://www.universetoday.com/feed',
            'https://earthsky.org/feed/'
        ]
    },
    {
        botUsername: 'MovieNewsBot',
        portalId: '69a48a87c86222e58be4972c',
        portalName: 'Oxynema',
        channelName: 'Movie News',
        email: 'movienewsbot@oxypace.com',
        profile: {
            displayName: 'Movie News Bot',
            bio: 'Küresel sinema kaynaklarından en güncel haberler ve gelişmeler.',
            avatar: '/uploads/cinema_bot_avatar.png'
        },
        feeds: [
            'https://collider.com/feed/',
            'https://deadline.com/feed/',
            'https://variety.com/feed/'
        ]
    }
];

let globalIo = null;

// Auto-create bot accounts if they do not exist
async function ensureBotAccountsExist() {
    console.log('🤖 Checking bot accounts database registration...');
    for (const config of BOT_CONFIGS) {
        try {
            const exists = await User.findOne({ username: config.botUsername });
            if (!exists) {
                const crypto = await import('crypto');
                const fs = await import('fs');
                const path = await import('path');

                // Generate secure random password
                const password = crypto.randomBytes(16).toString('hex');
                const email = config.email;
                
                const botUser = new User({
                    email,
                    username: config.botUsername,
                    password,
                    profile: config.profile,
                    isBot: true,
                    isVerified: true,
                    verificationBadge: 'special'
                });

                await botUser.save();

                // Save credentials to scratch
                const credentialsPath = path.join(process.cwd(), 'scratch', 'movie_news_bot_credentials.txt');
                fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
                fs.appendFileSync(credentialsPath, `[${new Date().toISOString()}] Bot Account Created:\nUsername: ${config.botUsername}\nEmail: ${email}\nPassword: ${password}\n\n`);

                console.log(`\n======================================================`);
                console.log(`🤖 BOT ACCOUNT CREATED: ${config.botUsername}`);
                console.log(`📧 Email: ${email}`);
                console.log(`🔑 Password: ${password}`);
                console.log(`⚠️ PLEASE NOTE THIS PASSWORD DOWN! Saved to: scratch/movie_news_bot_credentials.txt`);
                console.log(`======================================================\n`);
            }
        } catch (err) {
            console.error(`❌ Failed to auto-create bot user "${config.botUsername}":`, err.message);
        }
    }
}

// Extract image URL from feed item
const extractImage = (item) => {
    // 1. Check enclosure
    if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
        return item.enclosure.url;
    }
    // 2. Check media content fields
    const mediaContent = item['media:content'] || item.media || item['media:thumbnail'];
    if (mediaContent) {
        if (Array.isArray(mediaContent) && mediaContent.length > 0 && mediaContent[0].$) {
            return mediaContent[0].$.url;
        }
        if (mediaContent.$ && mediaContent.$.url) {
            return mediaContent.$.url;
        }
    }
    // 3. Search in description or content
    const htmlContent = item.content || item.description || '';
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
    const match = htmlContent.match(imgRegex);
    if (match && match[1]) {
        return match[1];
    }
    return null;
};

// Initialize the master loop
export default async function startBotLoop(io) {
    globalIo = io;
    console.log('🤖 Starting Elite Multi-News Bot Service (Turkish)...');

    if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for DB connection...');
        await new Promise(resolve => {
            if (mongoose.connection.readyState === 1) return resolve();
            mongoose.connection.once('connected', resolve);
        });
        console.log('✅ DB Connected, proceeding with bots startup...');
    }

    // Ensure bot accounts are present
    await ensureBotAccountsExist();

    const runScrapeCycle = async () => {
        console.log(`🕒 [${new Date().toLocaleTimeString()}] Starting Bot Scrape Cycle...`);
        for (const config of BOT_CONFIGS) {
            try {
                const user = await User.findOne({ username: config.botUsername });
                if (!user) {
                    console.error(`❌ Bot user "${config.botUsername}" not found.`);
                    continue;
                }

                let portal = null;
                if (config.portalId) {
                    portal = await Portal.findById(config.portalId);
                }
                
                if (!portal) {
                    portal = await Portal.findOne({ name: config.portalName });
                }

                if (!portal) {
                    console.error(`❌ Portal not found for bot "${config.botUsername}". Checked ID: ${config.portalId || 'N/A'}, Name: ${config.portalName}`);
                    continue;
                }

                let channel = portal.channels.find(c => c.name === config.channelName);
                if (!channel) {
                    console.log(`📡 Creating missing channel "${config.channelName}" on portal "${portal.name}"`);
                    portal.channels.push({
                        name: config.channelName,
                        type: 'text'
                    });
                    await portal.save();
                    // Retrieve it again to get the generated _id
                    channel = portal.channels.find(c => c.name === config.channelName);
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

        const imageUrl = extractImage(item);

        await BotHistory.create({ guid, botName: bot.user.username });

        const newPost = new Post({
            content: formattedContent,
            author: bot.user._id,
            portal: bot.portal._id,
            channel: bot.channel._id.toString(),
            mediaType: imageUrl ? 'image' : 'none',
            media: imageUrl || '',
            createdAt: new Date()
        });

        await newPost.save();
        console.log(`✅ [${bot.user.username}] Post Deployed: ${translatedTitle.substring(0, 30)}...`);

        // --- PERSISTENT NOTIFICATIONS & REAL-TIME SYNC ---
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
                if (globalIo) {
                    globalIo.emit('global:portal_activity', {
                        portalId: bot.portal._id.toString(),
                        channelId: bot.channel._id.toString(),
                        postId: newPost._id.toString()
                    });
                }
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
