import express from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';
import Portal from '../models/Portal.js';
import User from '../models/User.js';
import Post from '../models/Post.js'; // Assuming Post model exists

const router = express.Router();

// Simple in-memory cache
let sitemapCache;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

router.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');

    // Serve from cache if available and fresh
    if (sitemapCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
        res.send(sitemapCache);
        return;
    }

    try {
        const smStream = new SitemapStream({ hostname: 'https://oxypace.vercel.app' });
        const pipeline = smStream.pipe(createGzip());

        // 1. Static Pages
        smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
        smStream.write({ url: '/login', changefreq: 'monthly', priority: 0.5 });
        smStream.write({ url: '/register', changefreq: 'monthly', priority: 0.5 });
        smStream.write({ url: '/search', changefreq: 'weekly', priority: 0.8 });
        smStream.write({ url: '/contact', changefreq: 'monthly', priority: 0.3 });
        smStream.write({ url: '/privacy', changefreq: 'yearly', priority: 0.3 });
        smStream.write({ url: '/terms', changefreq: 'yearly', priority: 0.3 });

        // 2. Portals (Fetch recent/all)
        // Adjust query as needed, e.g. only public portals
        const portals = await Portal.find({ privacy: 'public' }, '_id updatedAt').limit(1000).sort({ createdAt: -1 }).lean();
        for (const portal of portals) {
            smStream.write({
                url: `/portal/${portal._id}`,
                changefreq: 'daily',
                priority: 0.9,
                lastmod: portal.updatedAt
            });
        }

        // 3. Profiles (Users)
        const users = await User.find({}, 'username createdAt').limit(1000).sort({ createdAt: -1 }).lean();
        for (const user of users) {
            smStream.write({
                url: `/profile/${user.username}`,
                changefreq: 'weekly',
                priority: 0.7
            });
        }

        // 4. Posts (Public posts only usually, but schema may not have visibility field easily accessible)
        // Assuming all posts are visible for now or filtering by basic criteria
        // Limit to 1000 most recent
        const posts = await Post.find({}, '_id updatedAt').sort({ createdAt: -1 }).limit(1000).lean();
        for (const post of posts) {
            smStream.write({
                url: `/post/${post._id}`,
                changefreq: 'weekly',
                priority: 0.6,
                lastmod: post.updatedAt
            });
        }

        smStream.end();

        // Cache the buffer
        const buffer = await streamToPromise(pipeline);
        sitemapCache = buffer;
        lastCacheTime = Date.now();

        res.send(buffer);
    } catch (e) {
        console.error('Sitemap generation failed:', e);
        res.status(500).end();
    }
});

export default router;
