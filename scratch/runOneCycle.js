import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import BotHistory from '../models/BotHistory.js';
import Post from '../models/Post.js';
import { translateText } from '../utils/translate.js';
import { BOT_CONFIGS } from '../bots/newsBot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const parser = new Parser();

async function runOneCycle() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    for (const config of BOT_CONFIGS) {
        console.log(`\n🤖 Processing: ${config.botUsername}`);
        const user = await User.findOne({ username: config.botUsername });
        if (!user) {
            console.error(`❌ User not found: ${config.botUsername}`);
            continue;
        }
        const portal = await Portal.findOne({ name: config.portalName });
        if (!portal) {
            console.error(`❌ Portal not found: ${config.portalName}`);
            continue;
        }
        const channel = portal.channels.find(c => c.name === config.channelName);
        if (!channel) {
            console.error(`❌ Channel not found: ${config.channelName}`);
            continue;
        }

        console.log(`✅ Channel and Portal matched for ${config.botUsername}. Starting feeds scan...`);

        for (const url of config.feeds) {
            try {
                console.log(`📡 Scanning: ${url}`);
                const feed = await parser.parseURL(url);
                if (!feed.items || feed.items.length === 0) continue;
                
                // Process top 5 items
                const itemsToProcess = feed.items.slice(0, 5).reverse();
                let postedAny = false;

                for (const item of itemsToProcess) {
                    const guid = item.guid || item.link;
                    if (!guid) continue;

                    // Check if already shared
                    const isShared = await BotHistory.findOne({ guid, botName: user.username });
                    if (isShared) {
                        console.log(`ℹ️ Already shared: ${item.title}`);
                        continue;
                    }

                    console.log(`🆕 Translating and posting: ${item.title}`);
                    const translatedTitle = await translateText(item.title);
                    console.log(`   Translated title: ${translatedTitle}`);
                    
                    let description = item.contentSnippet || item.content || '';
                    description = description.replace(/<[^>]+>/g, '').trim();
                    if (description.length > 1000) description = description.substring(0, 1000) + '...';
                    const translatedDesc = await translateText(description);

                    const formattedContent = `📢 **${translatedTitle}**\n\n${translatedDesc ? `📝 ${translatedDesc}\n\n` : ''}🔗 Tamamını Oku: ${item.link}`;

                    const newPost = new Post({
                        content: formattedContent,
                        author: user._id,
                        portal: portal._id,
                        channel: channel._id,
                        createdAt: new Date()
                    });
                    
                    await newPost.save();
                    await BotHistory.create({ guid, botName: user.username });
                    console.log(`🎉 Successfully posted: ${translatedTitle}`);
                    postedAny = true;
                    break; // Just do one feed item per feed for this test
                }
                if (postedAny) {
                    break;
                }
            } catch (e) {
                console.error(`❌ Error in feed scan: ${e.message}`);
            }
        }
    }

    await mongoose.connection.close();
    console.log('\nFinished testing.');
    process.exit(0);
}

runOneCycle();
