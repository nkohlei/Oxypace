
import Parser from 'rss-parser';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js'; // Ensure Portal model is imported
import BotHistory from '../models/BotHistory.js'; // Use BotHistory for duplicate checking

const parser = new Parser();

// Configuration
const RSS_FEEDS = [
    'https://feeds.feedburner.com/ign/news', // IGN - Major global news, GTA 6, etc.
    'https://www.gamespot.com/feeds/news/'   // GameSpot - Industry news, popular games
];
const BOT_USERNAME = 'GamesNews';
const TARGET_PORTAL_NAME = 'OXYᴳᴬᴹᴱ';
const TARGET_PORTAL_ID = '698cf346bb064b2d0bc7881b'; // OXYᴳᴬᴹᴱ
const TARGET_CHANNEL_ID = '698d1824db5ccf0a4f06c9a1'; // genel
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 Minutes

// State
let botUserId = null;
let targetPortalId = null;
let targetChannelId = null;

// Initialize
export default async function startBotLoop() {
    console.log('🤖 Starting Game News Bot Service...');

    // Wait for DB connection if not ready
    // Wait for DB connection if not ready
    if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for DB connection...');
        await new Promise(resolve => {
            if (mongoose.connection.readyState === 1) return resolve();
            mongoose.connection.once('connected', resolve);
        });
        console.log('✅ DB Connected, proceeding with bot startup...');
    }

    try {
        // 1. Get Bot User ID
        const user = await User.findOne({ username: BOT_USERNAME });
        if (!user) {
            console.error(`❌ Bot user "${BOT_USERNAME}" not found!`);
            return;
        }
        botUserId = user._id;

        // 2. Get Target Portal/Channel
        const portal = await Portal.findOne({ name: TARGET_PORTAL_NAME });
        if (!portal) {
            console.error(`❌ Target portal "${TARGET_PORTAL_NAME}" not found!`);
            return;
        }
        targetPortalId = portal._id;

        // Find "genel" channel or take the first text channel
        const channel = portal.channels.find(c => c.name === 'genel' || c.name === 'general') || portal.channels[0];
        if (!channel) {
            console.error('❌ No suitable channel found in portal!');
            return;
        }
        targetChannelId = channel._id;

        console.log(`✅ Game News Bot Configured: ${user.username} -> ${portal.name} #${channel.name}`);

        // 3. Initial Fetch
        await checkNews();

        // 4. Schedule
        setInterval(checkNews, CHECK_INTERVAL_MS);

    } catch (error) {
        console.error('❌ Failed to start News Bot:', error);
    }
};

const checkNews = async () => {
    for (const url of RSS_FEEDS) {
        try {
            console.log(`📡 Fetching news from: ${url}`);
            const feed = await parser.parseURL(url);

            // Process latest 2 items from EACH feed to ensure variety
            const itemsToProcess = feed.items.slice(0, 2).reverse();

            for (const item of itemsToProcess) {
                await processItem(item);
            }
        } catch (error) {
            console.error(`⚠️ Failed to fetch feed (${url}):`, error.message);
        }
    }
};

const processItem = async (item) => {
    const guid = item.guid || item.link;

    // Check history (deduplication)
    const isShared = await BotHistory.findOne({ guid, botName: BOT_USERNAME });
    if (isShared) return;

    // Check Post DB (double safety)
    const exists = await Post.findOne({
        author: botUserId,
        portal: targetPortalId,
        content: { $regex: item.link }
    });

    if (exists) {
        await BotHistory.create({ guid, botName: BOT_USERNAME });
        return;
    }

    // Filter Logic (Optional): Check for specific keywords if requested
    // User asked for: Companies, Dev Stages (GTA 6), Discounts, Popular Games
    // The selected feeds (IGN/GameSpot) general news already cover these naturally.
    // We can filter OUT things if needed, but for now we accept all "News".

    console.log(`🆕 Posting Game News: ${item.title}`);

    // Create Post
    await createPost(item);

    // Add to history
    await BotHistory.create({ guid, botName: BOT_USERNAME });
};

const createPost = async (item) => {
    try {
        // Extract Image if available in content (merlin usually puts it in description)
        let mediaUrl = '';
        const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            mediaUrl = imgMatch[1];
        }

        // Clean up description (remove HTML tags)
        let description = item.contentSnippet || item.content || '';
        if (description.length > 200) description = description.substring(0, 200) + '...';

        const content = `**${item.title}**\n\n${description}\n\n🔗 Source: ${item.link}`;

        const newPost = new Post({
            content: content,
            author: botUserId,
            portal: targetPortalId,
            channel: targetChannelId, // Store channel ID
            likes: [],
            comments: [],
            isPinned: false,
            media: mediaUrl, // Add image if found
            mediaType: mediaUrl ? 'image' : 'none',
            createdAt: new Date()
        });

        await newPost.save();
        console.log('📢 News posted successfully!');

    } catch (error) {
        console.error('❌ Failed to publish news post:', error);
    }
};
