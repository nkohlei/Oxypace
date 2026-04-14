import mongoose from 'mongoose';
import 'dotenv/config';
import Parser from 'rss-parser';
import axios from 'axios';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import BotHistory from '../models/BotHistory.js';

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

const BOT_CONFIG = {
    botUsername: 'Space',
    portalName: 'Space',
    channelName: 'Gelişmeler, Bilgiler ve Eğlenmeler',
    feeds: [
        'https://www.nasa.gov/rss/dyn/breaking_news.rss',
        'https://www.space.com/feeds/all',
        'https://www.universetoday.com/feed',
        'https://earthsky.org/feed/'
    ]
};

const fetchHDMetadata = async (url) => {
    try {
        const { data: html } = await axios.get(url, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i) || 
                             html.match(/<meta[^>]+content="([^">]+)"[^>]+property="og:image"/i);
        return { hdImage: ogImageMatch ? ogImageMatch[1] : null };
    } catch (error) {
        return { hdImage: null };
    }
};

async function testSpace() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🚀 Testing @Space Bot...');
    
    const user = await User.findOne({ username: BOT_CONFIG.botUsername });
    const portal = await Portal.findOne({ name: BOT_CONFIG.portalName });
    
    if (!user || !portal) {
        console.error('❌ User or Portal not found');
        process.exit(1);
    }
    
    const channel = portal.channels.find(c => c.name === BOT_CONFIG.channelName);
    console.log(`📡 Scanning feeds for ${BOT_CONFIG.botUsername}...`);
    
    for (const url of BOT_CONFIG.feeds) {
        try {
            console.log(`🔍 Checking: ${url}`);
            const feed = await parser.parseURL(url);
            const items = feed.items.slice(0, 2);
            
            for (const item of items) {
                const metadata = await fetchHDMetadata(item.link);
                console.log(`📝 Title: ${item.title}`);
                console.log(`🖼️ Image: ${metadata.hdImage || 'N/A'}`);
                console.log(`---`);
            }
        } catch (e) {
            console.error(`❌ Feed error: ${e.message}`);
        }
    }
    await mongoose.disconnect();
}

testSpace();
