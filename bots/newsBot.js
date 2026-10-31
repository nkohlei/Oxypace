import Parser from 'rss-parser';
import mongoose from 'mongoose';
import axios from 'axios';
import { translateText } from '../utils/translate.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Portal from '../models/Portal.js';
import BotHistory from '../models/BotHistory.js';
import BotConfig from '../models/BotConfig.js';
import logActivity from '../utils/auditLogger.js';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/rdf+xml, application/atom+xml, application/xml, text/xml, */*'
    },
    timeout: 15000
});

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 Minutes

export const BOT_CONFIGS = [
    {
        botUsername: 'GamesNews',
        portalId: '698cf346bb064b2d0bc7881b',
        portalName: 'OXYᴳᴬᴹᴱ', 
        channelId: '698d1824db5ccf0a4f06c9a1',
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
        portalId: '69485e416ce2eac8943a5de2',
        portalName: 'Oxypace Global',
        channelId: '69835873dff9f89766c44c26',
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
        portalId: '69485e416ce2eac8943a5de2',
        portalName: 'Oxypace Global',
        channelId: '69835858dff9f89766c44c20',
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
        portalId: '69d1731c7bfba7599e161b99',
        portalName: 'Space',
        channelId: '6adcc0a9d676dee7e7dbe559',
        channelName: 'Gelişimler',
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
        portalName: 'Oxynema | Movie&List',
        channelId: '69a48a87c86222e58be4972d',
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

// Global Cinema Filter
export const isGlobalCinemaNews = (item) => {
    const title = (item.title || '').toLowerCase();
    const description = (item.contentSnippet || item.content || '').toLowerCase();
    
    // Whitelist: Global cinema major themes
    const positiveKeywords = [
        'movie', 'film', 'cinema', 'director', 'actor', 'actress', 'trailer', 'sequel', 
        'box office', 'oscar', 'cannes', 'marvel', 'dc', 'disney', 'netflix', 'warner bros', 
        'paramount', 'universal', 'sony', 'hbo', 'casting', 'nolan', 'tarantino', 'scorsese', 
        'spielberg', 'coppola', 'avatar', 'dune', 'star wars', 'blockbuster', 'cannes film festival'
    ];
    
    // Blacklist: Local TV, theatre, books, Broadway, live events, ratings
    const negativeKeywords = [
        'broadway', 'tony award', 'tonys', 'theater', 'ratings', 'podcast', 'live show', 
        'tv ratings', 'tv review', 'stage review', 'book review', 'local news', 'concert',
        'tony nominations', 'wrestlemania', 'wwe'
    ];
    
    const hasPositive = positiveKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => title.includes(keyword));
    
    return hasPositive && !hasNegative;
};

// Protect specific terms from being mistranslated
const protectTerms = (text) => {
    const protectedList = [
        { word: '60 Minutes', placeholder: '__TERM_60_MINUTES__' },
        { word: 'The Tonight Show', placeholder: '__TERM_TONIGHT_SHOW__' },
        { word: 'Saturday Night Live', placeholder: '__TERM_SNL__' },
        { word: 'Apple TV', placeholder: '__TERM_APPLE_TV__' },
        { word: 'Prime Video', placeholder: '__TERM_PRIME_VIDEO__' },
        { word: 'Netflix', placeholder: '__TERM_NETFLIX__' },
        { word: 'Disney\\+', placeholder: '__TERM_DISNEY_PLUS__' },
        { word: 'Disney', placeholder: '__TERM_DISNEY__' },
        { word: 'Warner Bros', placeholder: '__TERM_WARNER_BROS__' },
        { word: 'HBO Max', placeholder: '__TERM_HBO_MAX__' },
        { word: 'HBO', placeholder: '__TERM_HBO__' },
        { word: 'Collider', placeholder: '__TERM_COLLIDER__' },
        { word: 'Variety', placeholder: '__TERM_VARIETY__' },
        { word: 'Deadline', placeholder: '__TERM_DEADLINE__' },
        { word: 'The Hollywood Reporter', placeholder: '__TERM_THR__' },
        { word: 'IGN', placeholder: '__TERM_IGN__' },
        { word: 'GameSpot', placeholder: '__TERM_GAMESPOT__' },
        { word: 'TechCrunch', placeholder: '__TERM_TECHCRUNCH__' },
        { word: 'The Verge', placeholder: '__TERM_THE_VERGE__' },
        { word: 'NASA', placeholder: '__TERM_NASA__' },
        { word: 'SpaceX', placeholder: '__TERM_SPACEX__' },
        { word: 'Webrazzi', placeholder: '__TERM_WEBRAZZI__' }
    ];

    let workingText = text;
    const replacements = [];

    protectedList.forEach(({ word, placeholder }) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(workingText)) {
            workingText = workingText.replace(regex, placeholder);
            replacements.push({ placeholder, original: word });
        }
    });

    return { text: workingText, replacements };
};

// Restore protected terms
const restoreTerms = (text, replacements) => {
    let workingText = text;
    replacements.forEach(({ placeholder, original }) => {
        const regex = new RegExp(placeholder, 'g');
        workingText = workingText.replace(regex, original);
    });

    // Turkish idiom polish
    const jargonMap = {
        'gişe rekorları kıran': 'blockbuster',
        'kıdemli': 'veteran',
        'yürütücü yapımcı': 'baş yapımcı',
        'ateşleme': 'fırlatma'
    };

    for (const [eng, tr] of Object.entries(jargonMap)) {
        const regex = new RegExp(eng, 'g');
        workingText = workingText.replace(regex, tr);
    }

    return workingText;
};

// Translate and Refine wrapper
export const translateAndRefine = async (text) => {
    if (!text || text.trim() === '') return '';
    try {
        const { text: protectedText, replacements } = protectTerms(text);
        const translated = await translateText(protectedText);
        return restoreTerms(translated, replacements);
    } catch (err) {
        console.error('⚠️ translateAndRefine failed:', err.message);
        return text;
    }
};

// Extract high-quality image from RSS item or target article page
export async function extractItemImage(item) {
    if (!item) return '';

    // 1. Enclosure check (image/jpeg, image/png, etc.)
    if (item.enclosure && item.enclosure.url) {
        const encType = String(item.enclosure.type || '').toLowerCase();
        const encUrl = item.enclosure.url;
        if (encType.startsWith('image') || /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(encUrl)) {
            return encUrl;
        }
    }

    // 2. Media namespace tags (media:content, media:thumbnail)
    if (item['media:content']) {
        const mc = item['media:content'];
        const url = mc.url || mc.$?.url;
        if (url && typeof url === 'string') return url;
        if (Array.isArray(mc) && mc.length > 0) {
            const firstUrl = mc[0].url || mc[0].$?.url;
            if (firstUrl) return firstUrl;
        }
    }

    if (item['media:thumbnail']) {
        const mt = item['media:thumbnail'];
        const url = mt.url || mt.$?.url;
        if (url && typeof url === 'string') return url;
        if (Array.isArray(mt) && mt.length > 0) {
            const firstUrl = mt[0].url || mt[0].$?.url;
            if (firstUrl) return firstUrl;
        }
    }

    // 3. Embedded <img> tag inside description or content:encoded
    const contentToSearch = [
        item['content:encoded'],
        item.content,
        item.description,
        item.summary
    ].filter(Boolean).join(' ');

    if (contentToSearch) {
        const imgMatch = contentToSearch.match(/<img[^>]+src=["'](https?:\/\/[^"'>]+)["']/i);
        if (imgMatch && imgMatch[1]) {
            const imgUrl = imgMatch[1];
            if (!imgUrl.includes('1x1') && !imgUrl.includes('spacer') && !imgUrl.includes('pixel')) {
                return imgUrl;
            }
        }
    }

    // 4. Fetch the target article page and extract og:image or twitter:image
    if (item.link && (item.link.startsWith('http://') || item.link.startsWith('https://'))) {
        try {
            const response = await axios.get(item.link, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 6000,
                maxContentLength: 2 * 1024 * 1024
            });

            const html = typeof response.data === 'string' ? response.data : '';
            if (html) {
                // og:image
                const ogMatch = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["'](https?:\/\/[^"'>]+)["']/i) ||
                                html.match(/<meta[^>]+content=["'](https?:\/\/[^"'>]+)["'][^>]+property=["']og:image(?::secure_url)?["']/i);
                if (ogMatch && ogMatch[1]) {
                    return ogMatch[1];
                }

                // twitter:image
                const twMatch = html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["'](https?:\/\/[^"'>]+)["']/i) ||
                                html.match(/<meta[^>]+content=["'](https?:\/\/[^"'>]+)["'][^>]+name=["']twitter:image(?::src)?["']/i);
                if (twMatch && twMatch[1]) {
                    return twMatch[1];
                }

                // apple-touch-icon
                const touchIconMatch = html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"'>]+)["']/i);
                if (touchIconMatch && touchIconMatch[1]) {
                    try {
                        return new URL(touchIconMatch[1], item.link).href;
                    } catch (_) {}
                }
            }
        } catch (_) {}
    }

    // 5. High-resolution website logo/favicon fallback to guarantee a visual
    try {
        const originUrl = new URL(item.link || 'https://oxypace.com.tr').origin;
        return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(originUrl)}&size=256`;
    } catch (_) {
        return '';
    }
}

// Auto-discover RSS / Atom feed URL from any web page or domain
export async function discoverRssFeed(inputUrl) {
    let rawUrl = (inputUrl || '').trim();
    if (!rawUrl) throw new Error('Geçersiz web adresi.');

    if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
    }

    let urlObj;
    try {
        urlObj = new URL(rawUrl);
    } catch (e) {
        throw new Error('Geçersiz URL biçimi: ' + inputUrl);
    }

    const cleanBase = `${urlObj.origin}${urlObj.pathname.replace(/\/+$/, '')}`;

    const candidates = [
        rawUrl,
        `${cleanBase}/feed`,
        `${cleanBase}/feed/`,
        `${cleanBase}/rss`,
        `${cleanBase}/rss.xml`,
        `${cleanBase}/feed.xml`,
        `${cleanBase}/atom.xml`,
        `${cleanBase}/index.xml`,
        `${urlObj.origin}/feed`,
        `${urlObj.origin}/feed/`,
        `${urlObj.origin}/rss`,
        `${urlObj.origin}/rss.xml`,
        `${urlObj.origin}/atom.xml`,
        `${urlObj.origin}/feeds/posts/default`
    ];

    // 1. Test candidates directly
    for (const cand of candidates) {
        try {
            const feed = await parser.parseURL(cand);
            if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
                return {
                    feedUrl: cand,
                    title: feed.title || urlObj.hostname,
                    itemCount: feed.items.length
                };
            }
        } catch (_) {}
    }

    // 2. Fetch page HTML and scan for <link rel="alternate" type="application/rss+xml" ...>
    try {
        const response = await axios.get(rawUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 8000,
            maxContentLength: 2 * 1024 * 1024
        });

        const html = typeof response.data === 'string' ? response.data : '';
        if (html) {
            const linkRegex = /<link[^>]+(?:type=["']application\/(?:rss|atom)\+xml["']|rel=["']alternate["'])[^>]*>/gi;
            const matches = html.match(linkRegex) || [];

            for (const tag of matches) {
                const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
                if (hrefMatch && hrefMatch[1]) {
                    let feedHref = hrefMatch[1].trim();
                    try {
                        const resolvedFeedUrl = new URL(feedHref, rawUrl).href;
                        const feed = await parser.parseURL(resolvedFeedUrl);
                        if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
                            return {
                                feedUrl: resolvedFeedUrl,
                                title: feed.title || urlObj.hostname,
                                itemCount: feed.items.length
                            };
                        }
                    } catch (_) {}
                }
            }
        }
    } catch (htmlErr) {
        console.warn('HTML scrape error during RSS discovery:', htmlErr.message);
    }

    throw new Error(`"${rawUrl}" adresinde geçerli bir RSS/Atom akışı otomatik bulunamadı. Lütfen sitenin doğrudan RSS bağlantısını girin.`);
}

// Safe feed fetcher with auto discovery fallback
export async function fetchFeedSafely(url) {
    const rawUrl = (url || '').trim();
    if (!rawUrl) throw new Error('Geçersiz besleme bağlantısı.');

    let lastError = null;

    try {
        const feed = await parser.parseURL(rawUrl);
        if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
            return { feed, resolvedUrl: rawUrl };
        }
    } catch (err) {
        lastError = err;
    }

    // Try auto-discovery
    try {
        const discovered = await discoverRssFeed(rawUrl);
        if (discovered && discovered.feedUrl) {
            const feed = await parser.parseURL(discovered.feedUrl);
            if (feed && Array.isArray(feed.items) && feed.items.length > 0) {
                return { feed, resolvedUrl: discovered.feedUrl };
            }
        }
    } catch (discErr) {
        lastError = discErr;
    }

    throw lastError || new Error(`Besleme okunamadı (${rawUrl})`);
}

// Auto-create bot accounts and sync BotConfig if they do not exist
async function ensureBotAccountsExist() {
    console.log('🤖 Checking bot accounts and BotConfig registrations...');
    for (const config of BOT_CONFIGS) {
        try {
            let botUser = await User.findOne({ username: config.botUsername });
            if (!botUser) {
                const crypto = await import('crypto');
                const password = crypto.randomBytes(16).toString('hex');
                const email = config.email;
                
                botUser = new User({
                    email,
                    username: config.botUsername,
                    password,
                    profile: config.profile,
                    isBot: true,
                    isVerified: true,
                    verificationBadge: 'special'
                });

                await botUser.save();
                console.log(`🤖 BOT ACCOUNT CREATED: ${config.botUsername}`);
            }

            // Sync BotConfig in DB if missing or incomplete
            let botConfig = await BotConfig.findOne({ bot: botUser._id });
            if (!botConfig) {
                let targetPortal = null;
                if (config.portalId) targetPortal = await Portal.findById(config.portalId);
                if (!targetPortal && config.portalName) targetPortal = await Portal.findOne({ name: config.portalName });

                let targetChannelId = 'general';
                if (targetPortal && targetPortal.channels && targetPortal.channels.length > 0) {
                    const matched = targetPortal.channels.find(c => 
                        (config.channelId && c._id.toString() === config.channelId.toString()) ||
                        (config.channelName && c.name.toLowerCase() === config.channelName.toLowerCase())
                    ) || targetPortal.channels[0];
                    if (matched) targetChannelId = matched._id.toString();
                }

                botConfig = new BotConfig({
                    bot: botUser._id,
                    defaultPortal: targetPortal ? targetPortal._id : null,
                    defaultChannel: targetChannelId,
                    feeds: config.feeds || [],
                    isActive: true,
                    autoTranslate: true
                });
                await botConfig.save();
                console.log(`🤖 Initialized BotConfig for "${config.botUsername}" -> Portal: "${targetPortal?.name || 'N/A'}"`);
            }
        } catch (err) {
            console.error(`❌ Failed to auto-create bot user "${config.botUsername}":`, err.message);
        }
    }
}

// Process a single feed item and deploy as Post
export const processItem = async (item, { user, config, portal, channel, io }) => {
    const guid = item.guid || item.link;
    if (!guid) return null;

    try {
        // 1. Precise History Check
        const isShared = await BotHistory.findOne({ guid, botName: user.username });
        if (isShared) return null;

        // 2. Fuzzy Deduplication (Title check within last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const titleSnippet = (item.title || '').substring(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (titleSnippet) {
            const existingSimilarPost = await Post.findOne({
                portal: portal._id,
                author: user._id,
                createdAt: { $gte: oneDayAgo },
                content: { $regex: new RegExp(titleSnippet, 'i') }
            });

            if (existingSimilarPost) {
                console.log(`🛡️ [${user.username}] Fuzzy match triggered. Marking as shared.`);
                await BotHistory.create({ guid, botName: user.username });
                return null;
            }
        }

        console.log(`🆕 [${user.username}] Processing: ${item.title}`);
        
        // Translate Title & Description if autoTranslate is enabled
        let finalTitle = item.title || '';
        let finalDesc = item.contentSnippet || item.content || '';
        finalDesc = finalDesc.replace(/<[^>]+>/g, '').trim();
        if (finalDesc.length > 1000) finalDesc = finalDesc.substring(0, 1000) + '...';

        const shouldTranslate = config?.autoTranslate !== false;
        if (shouldTranslate) {
            finalTitle = await translateAndRefine(finalTitle);
            finalDesc = await translateAndRefine(finalDesc);
        }

        const prefix = config?.postPrefix || '📢';
        const formattedContent = `${prefix} **${finalTitle}**\n\n${finalDesc ? `📝 ${finalDesc}\n\n` : ''}🔗 Tamamını Oku: ${item.link}`;

        await BotHistory.create({ guid, botName: user.username });

        const postImage = await extractItemImage(item);

        const newPost = new Post({
            content: formattedContent,
            author: user._id,
            portal: portal._id,
            channel: channel._id.toString(),
            mediaType: 'none',
            media: '',
            isProcessing: false,
            createdAt: new Date()
        });

        await newPost.save();
        await User.findByIdAndUpdate(user._id, { $inc: { postCount: 1 } }).catch(() => {});
        console.log(`✅ [${user.username}] Post Deployed: ${finalTitle.substring(0, 30)}...`);

        // Update BotConfig stats
        try {
            const botConf = config || await BotConfig.findOne({ bot: user._id });
            if (botConf) {
                botConf.stats = botConf.stats || {};
                botConf.stats.totalPosts = (botConf.stats.totalPosts || 0) + 1;
                botConf.stats.lastRunAt = new Date();
                botConf.stats.lastSuccessAt = new Date();
                botConf.stats.lastPostTitle = finalTitle;
                botConf.stats.lastPostUrl = item.link || '';
                botConf.stats.lastError = '';
                await botConf.save().catch(() => {});
            }
        } catch (statErr) {
            console.error('Bot stat save error:', statErr.message);
        }

        logActivity({
            user: user._id,
            username: user.username,
            action: 'BOT_POST',
            category: 'bot',
            targetId: newPost._id,
            targetType: 'Post',
            details: {
                title: finalTitle,
                portal: portal.name,
                channel: channel.name,
                link: item.link
            }
        });

        // --- REAL-TIME SPREAD & PERSISTENT NOTIFICATIONS ---
        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'username profile.displayName profile.avatar profile.lowResAvatar verificationBadge customBadge settings.privacy isDeleted isBot')
            .populate('portal', 'name avatar icon privacy members badges customBadge isVerified')
            .exec();

        const activeIo = io || globalIo;
        if (activeIo && populatedPost) {
            const sPortalId = portal._id.toString();
            const sChannelId = channel._id.toString();

            activeIo.to(`portal:${sPortalId}`).emit('post:created', populatedPost);
            if (sChannelId) {
                activeIo.to(`channel:${sChannelId}`).emit('post:created', populatedPost);
            }
            activeIo.emit('post:created', populatedPost);

            activeIo.emit('global:portal_activity', {
                portalId: sPortalId,
                channelId: sChannelId,
                postId: newPost._id.toString()
            });
        }

        try {
            const memberIds = portal.members.filter(m => m.toString() !== user._id.toString());
            if (memberIds.length > 0) {
                const notificationDocs = memberIds.map(userId => ({
                    recipient: userId,
                    sender: user._id,
                    type: 'portal_post',
                    portal: portal._id,
                    channel: channel._id.toString(),
                    post: newPost._id,
                    read: false
                }));
                const Notification = (await import('../models/Notification.js')).default;
                await Notification.insertMany(notificationDocs);
            }
        } catch (notifyErr) {
            console.error(`⚠️ [${user.username}] Notification sync failed:`, notifyErr.message);
        }

        return populatedPost;

    } catch (error) {
        if (error.code === 11000) {
            // Duplicate detected (Race condition handled)
            return null;
        }
        console.error(`❌ [${user.username}] Failed publish:`, error.message);
        return null;
    }
};

// Check all feeds for a bot and process items
export const checkNewsForBot = async (botContext) => {
    const { user, config, portal, channel, feeds, io } = botContext;
    let deployedPost = null;

    for (const url of feeds) {
        try {
            console.log(`📡 [${user.username}] Scanning: ${url}`);
            const { feed, resolvedUrl } = await fetchFeedSafely(url);

            if (resolvedUrl !== url && config && Array.isArray(config.feeds) && !config.feeds.includes(resolvedUrl)) {
                config.feeds.push(resolvedUrl);
                await config.save().catch(() => {});
            }
            
            if (!feed.items || feed.items.length === 0) {
                console.warn(`⚠️ [${user.username}] Feed is empty: ${url}`);
                continue;
            }

            let itemsToProcess = feed.items;
            if (user.username === 'MovieNewsBot') {
                itemsToProcess = itemsToProcess.filter(isGlobalCinemaNews);
                console.log(`🔍 [${user.username}] Filtered down to ${itemsToProcess.length} cinema items.`);
            }

            // Keyword filter if configured
            if (config?.keywords && config.keywords.length > 0) {
                const kw = config.keywords.map(k => k.toLowerCase().trim()).filter(Boolean);
                itemsToProcess = itemsToProcess.filter(item => {
                    const text = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
                    return kw.some(k => text.includes(k));
                });
            }

            itemsToProcess = itemsToProcess.slice(0, 5).reverse();

            for (const item of itemsToProcess) {
                const res = await processItem(item, {
                    user,
                    config,
                    portal,
                    channel,
                    io: io || globalIo
                });
                if (res) {
                    deployedPost = res;
                    break; // Process one fresh item per cycle to avoid flooding
                }
            }

            if (deployedPost) break;

        } catch (error) {
            console.error(`⚠️ [${user.username}] Failed fetching feed (${url}):`, error.message);
            if (config) {
                config.stats = config.stats || {};
                config.stats.lastRunAt = new Date();
                config.stats.lastError = error.message;
                await config.save().catch(() => {});
            }
        }
    }

    if (config) {
        config.stats = config.stats || {};
        config.stats.lastRunAt = new Date();
        if (deployedPost) {
            config.stats.lastError = '';
        }
        await config.save().catch(() => {});
    }

    return deployedPost;
};

// Manually trigger single bot run (Immediate Test & Share)
export async function runSingleBot(botConfigIdOrBotId, ioInstance = null) {
    let dConfig = await BotConfig.findById(botConfigIdOrBotId).populate('bot');
    if (!dConfig) {
        dConfig = await BotConfig.findOne({ bot: botConfigIdOrBotId }).populate('bot');
    }
    if (!dConfig || !dConfig.bot) {
        throw new Error('Bot hesabı veya yapılandırması bulunamadı.');
    }

    // Resolve portal
    let portal = null;
    if (dConfig.defaultPortal) {
        portal = await Portal.findById(dConfig.defaultPortal);
    }
    if (!portal && dConfig.bot.joinedPortals && dConfig.bot.joinedPortals.length > 0) {
        portal = await Portal.findById(dConfig.bot.joinedPortals[0]);
    }
    if (!portal) {
        throw new Error('Hedef portal bulunamadı. Lütfen bir hedef portal belirleyin.');
    }

    // Resolve channel
    let channel = null;
    const targetChannelStr = String(dConfig.defaultChannel || '').trim();
    if (targetChannelStr) {
        channel = portal.channels.find(c => c._id.toString() === targetChannelStr || c.name.toLowerCase() === targetChannelStr.toLowerCase());
    }
    if (!channel && portal.channels && portal.channels.length > 0) {
        channel = portal.channels[0];
        // Permanently persist the resolved channel's unique ID
        dConfig.defaultChannel = channel._id.toString();
        await dConfig.save().catch(() => {});
    }
    if (!channel) {
        throw new Error('Hedef kanal bulunamadı. Portalda geçerli bir metin kanalı olmalıdır.');
    }

    const feeds = dConfig.feeds || [];
    if (feeds.length === 0) {
        throw new Error('Kayıtlı besleme (RSS / Web) linki yok. Lütfen en az bir besleme linki ekleyin.');
    }

    const createdPost = await checkNewsForBot({
        user: dConfig.bot,
        config: dConfig,
        portal,
        channel,
        feeds,
        io: ioInstance || globalIo
    });

    const refreshedConfig = await BotConfig.findById(dConfig._id);

    return {
        success: true,
        createdPost,
        stats: refreshedConfig?.stats || {},
        message: createdPost 
            ? `Harika! "${createdPost.author?.profile?.displayName || dConfig.bot.username}" botu yeni bir gönderiyi başarıyla paylaştı.` 
            : 'Besleme kaynağındaki içerikler kontrol edildi; yeni paylaşılmamış bir içerik bulunamadı (akış zaten güncel).'
    };
}

// Master loop for automatic background scraping
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

    // Ensure system default bots exist
    await ensureBotAccountsExist();

    const runScrapeCycle = async () => {
        console.log(`🕒 [${new Date().toLocaleTimeString()}] Starting Bot Scrape Cycle...`);

        try {
            let botConfigs = await BotConfig.find().populate('bot');

            for (const dConfig of botConfigs) {
                try {
                    if (!dConfig.bot) continue;
                    if (dConfig.bot.isBanned) continue;
                    if (dConfig.isActive === false) continue; // Respect paused bots!

                    const feeds = dConfig.feeds || [];
                    if (feeds.length === 0) continue;

                    let portal = null;
                    if (dConfig.defaultPortal) {
                        portal = await Portal.findById(dConfig.defaultPortal);
                    }
                    if (!portal && dConfig.bot.joinedPortals && dConfig.bot.joinedPortals.length > 0) {
                        portal = await Portal.findById(dConfig.bot.joinedPortals[0]);
                    }
                    if (!portal) continue;

                    let channel = null;
                    const targetChannelStr = String(dConfig.defaultChannel || '').trim();
                    if (targetChannelStr) {
                        channel = portal.channels.find(c => c._id.toString() === targetChannelStr || c.name.toLowerCase() === targetChannelStr.toLowerCase());
                    }
                    if (!channel && portal.channels && portal.channels.length > 0) {
                        channel = portal.channels[0];
                    }
                    if (!channel) continue;

                    await checkNewsForBot({
                        user: dConfig.bot,
                        config: dConfig,
                        portal,
                        channel,
                        feeds,
                        io: globalIo
                    });

                } catch (botErr) {
                    console.error(`❌ Error processing bot "${dConfig.bot?.username || 'unknown'}":`, botErr.message);
                }
            }
        } catch (dbErr) {
            console.error('❌ Error processing bots scrape cycle:', dbErr.message);
        }
    };

    await runScrapeCycle();
    setInterval(runScrapeCycle, CHECK_INTERVAL_MS);
}
